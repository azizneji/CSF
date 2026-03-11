import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  private async checkAccess(orgId: string, userId: string) {
    const { data: org } = await this.db()
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()
    if (!org) throw new NotFoundException('Organization not found')

    const { data: mem } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    if (!mem || !['admin', 'manager'].includes(mem.role)) {
      throw new ForbiddenException('Org admin or manager only')
    }
    return org
  }

  async getOrgAnalytics(orgId: string, userId: string) {
    const org = await this.checkAccess(orgId, userId)
    const db  = this.db()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalMembers },
      { count: totalActivities },
      { count: totalOpportunities },
      { count: totalPosts },
      { count: totalServices },
      { count: totalProjects },
      { count: newMembers30d },
      { count: pendingJoinRequests },
      { data: membersOverTime },
      { data: activitiesOverTime },
      { data: recentMembers },
      { data: topActivities },
      { data: recentPosts },
    ] = await Promise.all([
      // Totals
      db.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      db.from('activities').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      db.from('opportunities').select('*', { count: 'exact', head: true }).eq('poster_id', orgId),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', orgId),
      db.from('free_services').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      db.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),

      // New members last 30d
      db.from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', thirtyDaysAgo),

      // Pending join requests
      db.from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'pending'),

      // Members joined per month (last 90 days)
      db.from('organization_members')
        .select('created_at')
        .eq('organization_id', orgId)
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: true }),

      // Activities per month (last 90 days)
      db.from('activities')
        .select('created_at, type, title, start_date')
        .eq('organization_id', orgId)
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: true }),

      // Recent members with profile info
      db.from('organization_members')
        .select('role, created_at, user:profiles!user_id(id, full_name, avatar_url, email)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(8),

      // Top activities by registrations
      db.from('activities')
        .select('id, title, type, start_date, location')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent posts
      db.from('posts')
        .select('id, content, created_at')
        .eq('author_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Build monthly buckets (last 3 months)
    const membersByMonth  = this.bucketByMonth(membersOverTime  || [], 'created_at', 3)
    const activitiesByMonth = this.bucketByMonth(activitiesOverTime || [], 'created_at', 3)

    // Activity type breakdown
    const typeBreakdown = (activitiesOverTime || []).reduce((acc: any, a: any) => {
      acc[a.type] = (acc[a.type] || 0) + 1
      return acc
    }, {})

    return {
      org: { id: org.id, name: org.name },
      totals: {
        members:       totalMembers     || 0,
        activities:    totalActivities  || 0,
        opportunities: totalOpportunities || 0,
        posts:         totalPosts       || 0,
        services:      totalServices    || 0,
        projects:      totalProjects    || 0,
      },
      highlights: {
        new_members_30d:      newMembers30d      || 0,
        pending_join_requests: pendingJoinRequests || 0,
      },
      charts: {
        members_by_month:    membersByMonth,
        activities_by_month: activitiesByMonth,
        activity_types:      typeBreakdown,
      },
      recent: {
        members:    recentMembers    || [],
        activities: topActivities    || [],
        posts:      recentPosts      || [],
      },
    }
  }

  private bucketByMonth(rows: any[], dateField: string, months: number) {
    const buckets: Record<string, number> = {}

    // Pre-fill last N months with 0
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7) // "2024-03"
      buckets[key] = 0
    }

    for (const row of rows) {
      const key = row[dateField]?.slice(0, 7)
      if (key && key in buckets) buckets[key]++
    }

    return Object.entries(buckets).map(([month, count]) => ({ month, count }))
  }
}
