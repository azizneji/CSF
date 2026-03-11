import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto'

@Injectable()
export class OrganizationsService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: CreateOrganizationDto) {
    const { data: org, error: orgError } = await this.db()
      .from('organizations')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (orgError) throw new BadRequestException(orgError.message)

    await this.db()
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: userId, role: 'admin' })

    return org
  }

  async findAll(search?: string, category?: string, domaine?: string) {
    let query = this.db()
      .from('organizations')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, avatar_url),
        members_count:organization_members(count)
      `)

    if (search)  query = query.ilike('name', `%${search}%`)
    if (category) query = query.eq('category', category)
    if (domaine)  query = query.ilike('domaine_activite', `%${domaine}%`)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  }

  async getMine(userId: string) {
    const { data, error } = await this.db()
      .from('organization_members')
      .select(`
        role,
        organization:organizations(
          id, name, description, category, location, website, logo_url,
          is_verified, created_at
        )
      `)
      .eq('user_id', userId)

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('organizations')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, avatar_url),
        members:organization_members(
          role,
          joined_at,
          user:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Organization not found')
    return data
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    await this.checkAdminOrManagerAccess(orgId, userId)

    const { data, error } = await this.db()
      .from('organizations')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', orgId)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(orgId: string, userId: string) {
    await this.checkAdminOrManagerAccess(orgId, userId)
    const { error } = await this.db().from('organizations').delete().eq('id', orgId)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Organization deleted successfully' }
  }

  async addMember(orgId: string, requesterId: string, targetUserId: string, role = 'member') {
    await this.checkAdminOrManagerAccess(orgId, requesterId)
    const { data, error } = await this.db()
      .from('organization_members')
      .insert({ organization_id: orgId, user_id: targetUserId, role })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async removeMember(orgId: string, requesterId: string, targetUserId: string) {
    await this.checkAdminOrManagerAccess(orgId, requesterId)
    const { error } = await this.db()
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Member removed' }
  }

  async getJoinRequests(orgId: string) {
    const { data, error } = await this.db()
      .from('join_requests')
      .select(`*, user:profiles!user_id(id, full_name, avatar_url, email)`)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async respondJoinRequest(requestId: string, userId: string, orgId: string, action: 'accept' | 'reject') {
    await this.checkAdminOrManagerAccess(orgId, userId)
    const status = action === 'accept' ? 'accepted' : 'rejected'
    const { data: req, error: reqError } = await this.db()
      .from('join_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single()
    if (reqError) throw new BadRequestException(reqError.message)

    if (action === 'accept') {
      await this.db()
        .from('organization_members')
        .insert({ organization_id: orgId, user_id: req.user_id, role: 'member' })

      // 🔔 Notify user their request was accepted + check first-org milestone
      await this.notifications.onJoinAccepted(req.user_id, orgId)
    } else {
      // 🔔 Notify user their request was rejected
      await this.notifications.onJoinRejected(req.user_id, orgId)
    }

    return { message: `Request ${status}` }
  }

  private async checkAdminOrManagerAccess(orgId: string, userId: string) {
    const { data } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    if (!data || !['admin', 'manager'].includes(data.role)) {
      throw new ForbiddenException('Admin or manager access required')
    }
  }
}