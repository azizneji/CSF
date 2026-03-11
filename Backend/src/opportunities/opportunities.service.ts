import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto'

const OPP_TYPE_LABELS: Record<string, string> = {
  job: 'offre d\'emploi', consultant: 'mission consultant', tender: 'appel d\'offres',
  volunteer: 'bénévolat', internship: 'stage', grant: 'subvention',
}

@Injectable()
export class OpportunitiesService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: CreateOpportunityDto) {
    const { data, error } = await this.db()
      .from('opportunities')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // Auto-post to feed
    const typeLabel = OPP_TYPE_LABELS[data.type] || data.type
    await this.db().from('posts').insert({
      user_id:     userId,
      author_type: dto.poster_type,
      author_id:   dto.poster_id,
      content:     `A publié une ${typeLabel} : ${data.title}`,
      post_type:   'opportunity',
      ref_id:      data.id,
      ref_title:   data.title,
      ref_cover:   null,
    }).select().single()

    return data
  }

  async findAll(type?: string, search?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = this.db()
      .from('opportunities')
      .select('*', { count: 'exact' })

    if (type)   query = query.eq('type', type)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new BadRequestException(error.message)

    const enriched = await Promise.all((data || []).map(opp => this.enrichWithPoster(opp)))
    return { data: enriched, total: count, page, limit }
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Opportunity not found')
    return this.enrichWithPoster(data)
  }

  async update(id: string, userId: string, dto: UpdateOpportunityDto) {
    await this.checkOwner(id, userId)
    const { data, error } = await this.db()
      .from('opportunities')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    await this.checkOwner(id, userId)
    const { error } = await this.db().from('opportunities').delete().eq('id', id)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Opportunity deleted' }
  }

  async apply(opportunityId: string, userId: string, message?: string) {
    const { data, error } = await this.db()
      .from('opportunity_applications')
      .insert({ opportunity_id: opportunityId, user_id: userId, message })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async getApplications(opportunityId: string, userId: string) {
    await this.checkOwner(opportunityId, userId)
    const { data, error } = await this.db()
      .from('opportunity_applications')
      .select(`*, applicant:profiles!user_id(id, full_name, avatar_url, bio, location)`)
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data
  }

  private async enrichWithPoster(opp: any) {
    let poster = null
    if (opp.poster_type === 'organization') {
      const { data } = await this.db().from('organizations').select('id, name, logo_url, location').eq('id', opp.poster_id).single()
      poster = data
    } else if (opp.poster_type === 'enterprise') {
      const { data } = await this.db().from('enterprises').select('id, name, logo_url, location').eq('id', opp.poster_id).single()
      poster = data
    }
    return { ...opp, poster }
  }

  private async checkOwner(id: string, userId: string) {
    const { data } = await this.db().from('opportunities').select('created_by').eq('id', id).single()
    if (!data) throw new NotFoundException('Opportunity not found')
    if (data.created_by !== userId) throw new ForbiddenException('Not authorized')
  }
}
