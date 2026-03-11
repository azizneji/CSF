import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

export type NotifType =
  // Social
  | 'connection_request'
  | 'connection_accepted'
  // Org
  | 'join_request'
  | 'join_accepted'
  | 'join_rejected'
  | 'org_verified'
  | 'org_post'           // org you follow posted something
  // Events
  | 'event_interested'
  | 'event_going'
  | 'event_reminder_3d'
  | 'event_reminder_1d'
  | 'event_reminder_1h'
  | 'event_updated'      // location or time changed
  | 'event_cancelled'
  // Opportunities
  | 'new_opportunity'    // matches profile
  // Feed
  | 'new_comment'
  | 'new_reaction'
  | 'post_milestone'     // 100 reactions
  // Milestones
  | 'milestone_connections'  // reached 10
  | 'milestone_first_event'
  | 'milestone_first_org'
  // Admin broadcast
  | 'admin_broadcast'

@Injectable()
export class NotificationsService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  // ─── Read operations ──────────────────────────────────────────
  async getForUser(userId: string) {
    const { data, error } = await this.db()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return data || []
  }

  async markRead(id: string, userId: string) {
    await this.db().from('notifications').update({ is_read: true })
      .eq('id', id).eq('user_id', userId)
    return { success: true }
  }

  async markAllRead(userId: string) {
    await this.db().from('notifications').update({ is_read: true })
      .eq('user_id', userId).eq('is_read', false)
    return { success: true }
  }

  // ─── Core create ──────────────────────────────────────────────
  async create(userId: string, type: NotifType, message: string, link?: string) {
    const { error } = await this.db().from('notifications').insert({
      user_id: userId, type, message, link, is_read: false,
    })
    if (error) console.error('[Notifications] create error:', error.message)
  }

  // Batch: notify multiple users at once
  async createBatch(userIds: string[], type: NotifType, message: string, link?: string) {
    if (!userIds.length) return
    const rows = userIds.map(uid => ({ user_id: uid, type, message, link, is_read: false }))
    const { error } = await this.db().from('notifications').insert(rows)
    if (error) console.error('[Notifications] createBatch error:', error.message)
  }

  // ════════════════════════════════════════════════════════════════
  // TRIGGER HELPERS — called by other services
  // ════════════════════════════════════════════════════════════════

  // ─── Connections ──────────────────────────────────────────────
  async onConnectionRequest(requesterId: string, targetId: string) {
    const requester = await this.getProfile(requesterId)
    await this.create(
      targetId,
      'connection_request',
      `${requester?.full_name || 'Quelqu\'un'} vous a envoyé une demande de connexion`,
      `/connections`
    )
  }

  async onConnectionAccepted(requesterId: string, targetId: string) {
    const target = await this.getProfile(targetId)
    await this.create(
      requesterId,
      'connection_accepted',
      `${target?.full_name || 'Quelqu\'un'} a accepté votre demande de connexion`,
      `/profile/${targetId}`
    )
    // Milestone: 10 connections
    await this.checkConnectionMilestone(requesterId)
    await this.checkConnectionMilestone(targetId)
  }

  // ─── Organization join ────────────────────────────────────────
  async onJoinRequest(userId: string, orgId: string) {
    const [user, orgAdmins] = await Promise.all([
      this.getProfile(userId),
      this.getOrgAdmins(orgId),
    ])
    const org = await this.getOrg(orgId)
    await this.createBatch(
      orgAdmins,
      'join_request',
      `${user?.full_name || 'Un utilisateur'} demande à rejoindre ${org?.name || 'votre organisation'}`,
      `/organizations/${orgId}`
    )
  }

  async onJoinAccepted(userId: string, orgId: string) {
    const org = await this.getOrg(orgId)
    await this.create(
      userId,
      'join_accepted',
      `Votre demande pour rejoindre ${org?.name || 'l\'organisation'} a été acceptée !`,
      `/organizations/${orgId}`
    )
    // Milestone: first org
    await this.checkFirstOrgMilestone(userId)
  }

  async onJoinRejected(userId: string, orgId: string) {
    const org = await this.getOrg(orgId)
    await this.create(
      userId,
      'join_rejected',
      `Votre demande pour rejoindre ${org?.name || 'l\'organisation'} n\'a pas été acceptée`,
      `/organizations`
    )
  }

  // ─── Verification ─────────────────────────────────────────────
  async onOrgVerified(orgId: string) {
    const [org, admins] = await Promise.all([
      this.getOrg(orgId),
      this.getOrgAdmins(orgId),
    ])
    await this.createBatch(
      admins,
      'org_verified',
      `🎉 ${org?.name || 'Votre organisation'} a été vérifiée par l'équipe CSF !`,
      `/organizations/${orgId}`
    )
  }

  // ─── Org posts (notify org members/followers) ─────────────────
  async onOrgPost(orgId: string, postId: string) {
    const org = await this.getOrg(orgId)

    // Get all members of the org (excluding admins who posted)
    const { data: members } = await this.db()
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    // Get followers
    const { data: followers } = await this.db()
      .from('organization_follows')
      .select('user_id')
      .eq('organization_id', orgId)

    const memberIds  = (members  || []).map((m: any) => m.user_id)
    const followerIds = (followers || []).map((f: any) => f.user_id)
    const userIds = [...new Set([...memberIds, ...followerIds])]

    await this.createBatch(
      userIds,
      'org_post',
      `${org?.name || 'Une organisation'} a publié une nouvelle actualité`,
      `/feed`
    )
  }

  // ─── Events / Attendance ─────────────────────────────────────
  async onEventAttendance(userId: string, activityId: string, status: 'interested' | 'going') {
    const activity = await this.getActivity(activityId)
    const orgAdmins = await this.getOrgAdmins(activity?.organization_id)
    const user = await this.getProfile(userId)

    const type = status === 'going' ? 'event_going' : 'event_interested'
    const verb = status === 'going' ? 'participera à' : 'est intéressé(e) par'

    await this.createBatch(
      orgAdmins,
      type,
      `${user?.full_name || 'Un utilisateur'} ${verb} "${activity?.title || 'votre événement'}"`,
      `/activities/${activityId}`
    )

    // Milestone: first event
    if (status === 'going') {
      await this.checkFirstEventMilestone(userId)
    }
  }

  async onEventUpdated(activityId: string, changes: { location?: boolean; time?: boolean; cancelled?: boolean }) {
    const activity = await this.getActivity(activityId)
    if (!activity) return

    // Notify all interested/going attendees
    const { data: attendees } = await this.db()
      .from('event_attendances')
      .select('user_id')
      .eq('activity_id', activityId)
      .in('status', ['interested', 'going'])

    const userIds = (attendees || []).map((a: any) => a.user_id)
    if (!userIds.length) return

    let type: NotifType = 'event_updated'
    let message = `"${activity.title}" a été mis à jour`

    if (changes.cancelled) {
      type = 'event_cancelled'
      message = `⚠️ L'événement "${activity.title}" a été annulé`
    } else if (changes.location && changes.time) {
      message = `📍🕐 Le lieu et l'heure de "${activity.title}" ont changé`
    } else if (changes.location) {
      message = `📍 Le lieu de "${activity.title}" a changé`
    } else if (changes.time) {
      message = `🕐 L'heure de "${activity.title}" a changé`
    }

    await this.createBatch(userIds, type, message, `/activities/${activityId}`)
  }

  // ─── Event reminders (called by cron) ────────────────────────
  async sendEventReminders() {
    const now = new Date()

    const windows = [
      { label: '3d',  ms: 3  * 24 * 60 * 60 * 1000, type: 'event_reminder_3d' as NotifType, text: 'dans 3 jours' },
      { label: '1d',  ms: 1  * 24 * 60 * 60 * 1000, type: 'event_reminder_1d' as NotifType, text: 'demain'       },
      { label: '1h',  ms: 1  * 60 * 60 * 1000,       type: 'event_reminder_1h' as NotifType, text: 'dans 1 heure' },
    ]

    for (const window of windows) {
      const windowStart = new Date(now.getTime() + window.ms - 5 * 60 * 1000) // ±5 min tolerance
      const windowEnd   = new Date(now.getTime() + window.ms + 5 * 60 * 1000)

      const { data: activities } = await this.db()
        .from('activities')
        .select('id, title, start_date')
        .gte('start_date', windowStart.toISOString())
        .lte('start_date', windowEnd.toISOString())

      for (const activity of activities || []) {
        const { data: attendees } = await this.db()
          .from('event_attendances')
          .select('user_id')
          .eq('activity_id', activity.id)
          .in('status', ['interested', 'going'])

        const userIds = (attendees || []).map((a: any) => a.user_id)
        await this.createBatch(
          userIds,
          window.type,
          `⏰ Rappel : "${activity.title}" commence ${window.text}`,
          `/activities/${activity.id}`
        )
      }
    }
  }

  // ─── Opportunities (notify org members when new opp posted) ──
  async onNewOpportunity(opportunityId: string, orgId: string) {
    const org  = await this.getOrg(orgId)

    // Notify all members of the org + followers
    const { data: members } = await this.db()
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    const { data: followers } = await this.db()
      .from('organization_follows')
      .select('user_id')
      .eq('organization_id', orgId)

    const userIds = [...new Set([
      ...(members  || []).map((m: any) => m.user_id),
      ...(followers || []).map((f: any) => f.user_id),
    ])]

    await this.createBatch(
      userIds,
      'new_opportunity',
      `${org?.name || 'Une organisation'} a publié une nouvelle opportunité`,
      `/opportunities/${opportunityId}`
    )
  }

  // ─── Feed reactions & comments ───────────────────────────────
  async onReaction(reactorId: string, postId: string) {
    const { data: post } = await this.db()
      .from('posts').select('user_id, content').eq('id', postId).single()
    if (!post || post.user_id === reactorId) return // don't notify yourself

    const reactor = await this.getProfile(reactorId)
    await this.create(
      post.user_id,
      'new_reaction',
      `${reactor?.full_name || 'Quelqu\'un'} a réagi à votre publication`,
      `/feed`
    )

    // Milestone: 100 reactions
    const { count } = await this.db()
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (count === 100) {
      await this.create(
        post.user_id,
        'post_milestone',
        `🎉 Votre publication a atteint 100 réactions !`,
        `/feed`
      )
    }
  }

  async onComment(commenterId: string, postId: string) {
    const { data: post } = await this.db()
      .from('posts').select('user_id').eq('id', postId).single()
    if (!post || post.user_id === commenterId) return

    const commenter = await this.getProfile(commenterId)
    await this.create(
      post.user_id,
      'new_comment',
      `${commenter?.full_name || 'Quelqu\'un'} a commenté votre publication`,
      `/feed`
    )
  }

  // ─── Milestones ───────────────────────────────────────────────
  private async checkConnectionMilestone(userId: string) {
    const { count } = await this.db()
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (count === 10) {
      await this.create(
        userId,
        'milestone_connections',
        `🎉 Bravo ! Vous avez atteint 10 connexions sur la plateforme`,
        `/connections`
      )
    }
  }

  private async checkFirstEventMilestone(userId: string) {
    const { count } = await this.db()
      .from('event_attendances')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'going')

    if (count === 1) {
      await this.create(
        userId,
        'milestone_first_event',
        `🎉 Vous participez à votre premier événement sur CSF !`,
        `/activities`
      )
    }
  }

  private async checkFirstOrgMilestone(userId: string) {
    const { count } = await this.db()
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count === 1) {
      await this.create(
        userId,
        'milestone_first_org',
        `🎉 Bienvenue ! Vous avez rejoint votre première organisation`,
        `/organizations`
      )
    }
  }

  // ─── Admin broadcast ──────────────────────────────────────────
  async adminBroadcast(adminId: string, message: string, link?: string, targetUserIds?: string[]) {
    let userIds = targetUserIds

    if (!userIds || userIds.length === 0) {
      // Send to all users
      const { data: users } = await this.db().from('profiles').select('id')
      userIds = (users || []).map((u: any) => u.id)
    }

    await this.createBatch(userIds, 'admin_broadcast', message, link)
    return { sent: userIds.length }
  }

  // ─── Private helpers ──────────────────────────────────────────
  private async getProfile(userId: string) {
    const { data } = await this.db()
      .from('profiles').select('id, full_name').eq('id', userId).single()
    return data
  }

  private async getOrg(orgId: string) {
    const { data } = await this.db()
      .from('organizations').select('id, name').eq('id', orgId).single()
    return data
  }

  private async getActivity(activityId: string) {
    const { data } = await this.db()
      .from('activities').select('id, title, organization_id, start_date').eq('id', activityId).single()
    return data
  }

  private async getOrgAdmins(orgId: string): Promise<string[]> {
    const { data } = await this.db()
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .in('role', ['admin', 'manager'])
    return (data || []).map((m: any) => m.user_id)
  }
}
