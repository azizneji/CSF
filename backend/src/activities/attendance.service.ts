import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class AttendanceService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  async setAttendance(activityId: string, userId: string, status: 'interested' | 'going' | 'not_going') {
    const db = this.supabase.getAdminClient()
    const { data: existing } = await db
      .from('event_attendances').select('id, status')
      .eq('activity_id', activityId).eq('user_id', userId).single()

    if (existing) {
      if (existing.status === status) {
        await db.from('event_attendances').delete().eq('id', existing.id)
        return { removed: true }
      }
      const { data, error } = await db.from('event_attendances')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.id).select().single()
      if (error) throw new BadRequestException(error.message)

      // 🔔 Notify org admins when status changes to interested/going
      if (status === 'interested' || status === 'going') {
        await this.notifications.onEventAttendance(userId, activityId, status)
      }

      return data
    }

    const { data, error } = await db.from('event_attendances')
      .insert({ activity_id: activityId, user_id: userId, status })
      .select().single()
    if (error) throw new BadRequestException(error.message)

    // 🔔 Notify org admins + check first-event milestone
    if (status === 'interested' || status === 'going') {
      await this.notifications.onEventAttendance(userId, activityId, status)
    }

    return data
  }

  async getAttendance(activityId: string) {
    const { data } = await this.supabase.getAdminClient()
      .from('event_attendances')
      .select('status, user:profiles!user_id(id, full_name, avatar_url)')
      .eq('activity_id', activityId)

    const counts = { interested: 0, going: 0, not_going: 0 }
    const grouped: any = { interested: [], going: [], not_going: [] }
    for (const a of data || []) {
      counts[a.status as keyof typeof counts]++
      grouped[a.status].push(a.user)
    }
    return { counts, attendees: grouped }
  }
}