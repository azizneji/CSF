import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto'

@Injectable()
export class ActivitiesService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: CreateActivityDto) {
    const { data: membership } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', dto.organization_id)
      .eq('user_id', userId)
      .single()

    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      throw new ForbiddenException('You must be an admin or manager of this organization')
    }

    const { data, error } = await this.db()
      .from('activities')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // Auto-post to feed
    await this.db().from('posts').insert({
      user_id:     userId,
      author_type: 'organization',
      author_id:   dto.organization_id,
      content:     `A publié une nouvelle activité : ${data.title}`,
      post_type:   'activity',
      ref_id:      data.id,
      ref_title:   data.title,
      ref_cover:   data.cover_url || null,
    }).select().single()

    // 🔔 Notify org members & followers
    await this.notifications.onOrgPost(dto.organization_id, data.id)

    return data
  }

  async findAll(type?: string, organizationId?: string, upcoming = false, page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = this.db()
      .from('activities')
      .select(`
        *,
        organization:organizations!organization_id(id, name, logo_url, location)
      `, { count: 'exact' })

    if (type)           query = query.eq('type', type)
    if (organizationId) query = query.eq('organization_id', organizationId)
    if (upcoming)       query = query.gte('start_date', new Date().toISOString())

    const { data, error, count } = await query
      .order('start_date', { ascending: true })
      .range(from, to)

    if (error) throw new BadRequestException(error.message)
    return { data: data || [], total: count, page, limit }
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('activities')
      .select(`
        *,
        organization:organizations!organization_id(id, name, logo_url, location, description)
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Activity not found')
    return data
  }

  async update(id: string, userId: string, dto: UpdateActivityDto) {
    // Fetch existing before update to detect changes
    const { data: existing } = await this.db()
      .from('activities')
      .select('location, start_date, status')
      .eq('id', id)
      .single()

    await this.checkAccess(id, userId)

    const { data, error } = await this.db()
      .from('activities')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // 🔔 Notify attendees of meaningful changes
    const locationChanged = !!(dto.location  && dto.location  !== existing?.location)
    const timeChanged     = !!(dto.start_date && dto.start_date !== existing?.start_date)
    const cancelled       = dto.status === 'cancelled' && existing?.status !== 'cancelled'

    if (locationChanged || timeChanged || cancelled) {
      await this.notifications.onEventUpdated(id, { location: locationChanged, time: timeChanged, cancelled })
    }

    return data
  }

  async delete(id: string, userId: string) {
    await this.checkAccess(id, userId)
    const { error } = await this.db().from('activities').delete().eq('id', id)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Activity deleted' }
  }

  async register(activityId: string, userId: string) {
    const { data, error } = await this.db()
      .from('activity_registrations')
      .insert({ activity_id: activityId, user_id: userId })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async getRegistrations(activityId: string, userId: string) {
    await this.checkAccess(activityId, userId)
    const { data, error } = await this.db()
      .from('activity_registrations')
      .select(`*, user:profiles!user_id(id, full_name, avatar_url, email)`)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data
  }

  private async checkAccess(activityId: string, userId: string) {
    const { data: activity } = await this.db()
      .from('activities')
      .select('organization_id, created_by')
      .eq('id', activityId)
      .single()
    if (!activity) throw new NotFoundException('Activity not found')
    const { data: membership } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', activity.organization_id)
      .eq('user_id', userId)
      .single()
    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      throw new ForbiddenException('Not authorized')
    }
  }
}