import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreatePublicationDto, UpdatePublicationDto } from './dto/knowledge.dto'

const CAT_LABELS: Record<string, string> = {
  study: 'étude', report: 'rapport', guide: 'guide',
  research: 'recherche', policy: 'politique', newsletter: 'newsletter', other: 'publication',
}

@Injectable()
export class KnowledgeService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: CreatePublicationDto) {
    const { data, error } = await this.db()
      .from('publications')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // Auto-post to feed
    const catLabel = CAT_LABELS[data.category] || 'publication'
    await this.db().from('posts').insert({
      user_id:     userId,
      author_type: dto.author_type || 'user',
      author_id:   dto.author_id   || userId,
      content:     `A partagé une ${catLabel} : ${data.title}`,
      post_type:   'knowledge',
      ref_id:      data.id,
      ref_title:   data.title,
      ref_cover:   data.cover_url || null,
    }).select().single()

    return data
  }

  async findAll(category?: string, search?: string, authorType?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = this.db()
      .from('publications')
      .select('*', { count: 'exact' })

    if (category)   query = query.eq('category', category)
    if (authorType) query = query.eq('author_type', authorType)
    if (search)     query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new BadRequestException(error.message)
    const enriched = await Promise.all((data || []).map(p => this.enrichWithAuthor(p)))
    return { data: enriched, total: count, page, limit }
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('publications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Publication not found')
    return this.enrichWithAuthor(data)
  }

  async update(id: string, userId: string, dto: UpdatePublicationDto) {
    await this.checkOwner(id, userId)
    const { data, error } = await this.db()
      .from('publications')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    await this.checkOwner(id, userId)
    const { error } = await this.db().from('publications').delete().eq('id', id)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Publication deleted' }
  }

  private async enrichWithAuthor(pub: any) {
    let author = null
    if (pub.author_type === 'user') {
      const { data } = await this.db().from('profiles').select('id, full_name, avatar_url').eq('id', pub.author_id).single()
      author = data
    } else if (pub.author_type === 'organization') {
      const { data } = await this.db().from('organizations').select('id, name, logo_url').eq('id', pub.author_id).single()
      author = data ? { ...data, full_name: data.name, avatar_url: data.logo_url } : null
    } else if (pub.author_type === 'enterprise') {
      const { data } = await this.db().from('enterprises').select('id, name, logo_url').eq('id', pub.author_id).single()
      author = data ? { ...data, full_name: data.name, avatar_url: data.logo_url } : null
    }
    return { ...pub, author }
  }

  private async checkOwner(id: string, userId: string) {
    const { data } = await this.db().from('publications').select('created_by').eq('id', id).single()
    if (!data) throw new NotFoundException('Publication not found')
    if (data.created_by !== userId) throw new ForbiddenException('Not authorized')
  }
}
