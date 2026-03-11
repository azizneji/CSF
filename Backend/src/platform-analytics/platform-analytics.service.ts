import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class PlatformAnalyticsService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  // ─── Helper: date ranges ──────────────────────────────────────
  private daysAgo(n: number) {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
  }

  private bucketByDay(rows: any[], dateField: string, days: number) {
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    for (const row of rows) {
      const key = row[dateField]?.slice(0, 10)
      if (key && key in buckets) buckets[key]++
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  }

  private bucketByMonth(rows: any[], dateField: string, months: number) {
    const buckets: Record<string, number> = {}
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      buckets[d.toISOString().slice(0, 7)] = 0
    }
    for (const row of rows) {
      const key = row[dateField]?.slice(0, 7)
      if (key && key in buckets) buckets[key]++
    }
    return Object.entries(buckets).map(([month, count]) => ({ month, count }))
  }

  // ════════════════════════════════════════════════════════════════
  // 1. USER GROWTH
  // ════════════════════════════════════════════════════════════════
  async getUserGrowth() {
    const db = this.db()
    const now = new Date()

    const [
      { count: total },
      { count: newToday },
      { count: newThisWeek },
      { count: newThisMonth },
      { count: activated },
      { data: dailySignups },
      { data: bySource },
      { data: byCountry },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(now.setHours(0,0,0,0)).toISOString()),
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(7)),
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('profiles').select('*', { count: 'exact', head: true })
        .eq('is_activated', true),
      db.from('profiles').select('created_at').gte('created_at', this.daysAgo(30))
        .order('created_at', { ascending: true }),
      db.from('profiles').select('acquisition_source'),
      db.from('profiles').select('country').not('country', 'is', null),
    ])

    // Activation rate
    const activationRate = total ? Math.round(((activated || 0) / (total || 1)) * 100) : 0

    // Growth rate (this month vs last month)
    const { count: lastMonth } = await db.from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', this.daysAgo(60))
      .lt('created_at', this.daysAgo(30))
    const growthRate = lastMonth
      ? Math.round((((newThisMonth || 0) - (lastMonth || 0)) / (lastMonth || 1)) * 100)
      : 0

    // Source breakdown
    const sourceMap: Record<string, number> = {}
    for (const row of bySource || []) {
      const src = row.acquisition_source || 'organic'
      sourceMap[src] = (sourceMap[src] || 0) + 1
    }

    // Country breakdown
    const countryMap: Record<string, number> = {}
    for (const row of byCountry || []) {
      const c = row.country || 'Unknown'
      countryMap[c] = (countryMap[c] || 0) + 1
    }
    const topCountries = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    return {
      totals: {
        total:       total || 0,
        new_today:   newToday || 0,
        new_week:    newThisWeek || 0,
        new_month:   newThisMonth || 0,
        activated:   activated || 0,
        growth_rate: growthRate,
        activation_rate: activationRate,
      },
      charts: {
        daily_signups: this.bucketByDay(dailySignups || [], 'created_at', 30),
        by_source: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
        by_country: topCountries,
      },
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 2. USER ENGAGEMENT (DAU / WAU / MAU / stickiness)
  // ════════════════════════════════════════════════════════════════
  async getUserEngagement() {
    const db = this.db()

    const [
      { count: dau },
      { count: wau },
      { count: mau },
      { data: sessions },
      { data: deviceData },
    ] = await Promise.all([
      // DAU: distinct users active today
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_active_at', this.daysAgo(1)),
      // WAU
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_active_at', this.daysAgo(7)),
      // MAU
      db.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_active_at', this.daysAgo(30)),
      // Sessions
      db.from('user_sessions').select('duration_sec, page_count, device_type')
        .gte('started_at', this.daysAgo(30))
        .not('duration_sec', 'is', null),
      // Device breakdown from events
      db.from('platform_events').select('device_type')
        .gte('created_at', this.daysAgo(30))
        .not('device_type', 'is', null),
    ])

    const sessArr = sessions || []
    const avgDuration = sessArr.length
      ? Math.round(sessArr.reduce((s: number, r: any) => s + (r.duration_sec || 0), 0) / sessArr.length)
      : 0
    const avgPages = sessArr.length
      ? Math.round(sessArr.reduce((s: number, r: any) => s + (r.page_count || 0), 0) / sessArr.length)
      : 0

    const stickiness = mau ? Math.round(((dau || 0) / (mau || 1)) * 100) : 0

    const deviceMap: Record<string, number> = {}
    for (const row of deviceData || []) {
      const d = row.device_type || 'unknown'
      deviceMap[d] = (deviceMap[d] || 0) + 1
    }

    // DAU trend last 14 days from platform_events
    const { data: dauTrend } = await db.from('platform_events')
      .select('created_at, user_id')
      .gte('created_at', this.daysAgo(14))
      .order('created_at', { ascending: true })

    // Distinct users per day
    const dauByDay: Record<string, Set<string>> = {}
    for (const row of dauTrend || []) {
      const day = row.created_at?.slice(0, 10)
      if (!day) continue
      if (!dauByDay[day]) dauByDay[day] = new Set()
      if (row.user_id) dauByDay[day].add(row.user_id)
    }
    const dauChart = Object.entries(dauByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, users]) => ({ date, count: users.size }))

    return {
      totals: {
        dau:             dau || 0,
        wau:             wau || 0,
        mau:             mau || 0,
        stickiness,
        avg_session_min: Math.round(avgDuration / 60),
        avg_pages:       avgPages,
      },
      charts: {
        dau_trend: dauChart,
        devices: Object.entries(deviceMap).map(([device, count]) => ({ device, count })),
      },
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 3. COMMUNITY INTERACTION
  // ════════════════════════════════════════════════════════════════
  async getCommunityInteraction() {
    const db = this.db()

    const [
      { count: totalConnections },
      { count: connectionsThisMonth },
      { count: totalMessages },
      { count: messagesThisMonth },
      { count: totalComments },
      { count: totalReactions },
      { count: orgFollows },
      { data: connectionTrend },
    ] = await Promise.all([
      db.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      db.from('connections').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted').gte('created_at', this.daysAgo(30)),
      db.from('messages').select('*', { count: 'exact', head: true }),
      db.from('messages').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('post_comments').select('*', { count: 'exact', head: true }),
      db.from('post_reactions').select('*', { count: 'exact', head: true }),
      db.from('organization_follows').select('*', { count: 'exact', head: true }),
      db.from('connections').select('created_at')
        .eq('status', 'accepted').gte('created_at', this.daysAgo(30))
        .order('created_at', { ascending: true }),
    ])

    return {
      totals: {
        connections:          totalConnections || 0,
        connections_month:    connectionsThisMonth || 0,
        messages:             totalMessages || 0,
        messages_month:       messagesThisMonth || 0,
        comments:             totalComments || 0,
        reactions:            totalReactions || 0,
        org_follows:          orgFollows || 0,
      },
      charts: {
        connections_trend: this.bucketByDay(connectionTrend || [], 'created_at', 30),
      },
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 4. ORGANIZATION ANALYTICS
  // ════════════════════════════════════════════════════════════════
  async getOrganizationAnalytics() {
    const db = this.db()

    const [
      { count: total },
      { count: verified },
      { count: newThisMonth },
      { count: totalPosts },
      { count: totalActivities },
      { count: totalOpportunities },
      { count: joinRequests },
      { count: joinAccepted },
      { data: byCategory },
      { data: orgGrowth },
      { data: topOrgs },
    ] = await Promise.all([
      db.from('organizations').select('*', { count: 'exact', head: true }),
      db.from('organizations').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      db.from('organizations').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('author_type', 'organization'),
      db.from('activities').select('*', { count: 'exact', head: true }),
      db.from('opportunities').select('*', { count: 'exact', head: true })
        .eq('poster_type', 'organization'),
      db.from('join_requests').select('*', { count: 'exact', head: true }),
      db.from('join_requests').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      db.from('organizations').select('category'),
      db.from('organizations').select('created_at').gte('created_at', this.daysAgo(90))
        .order('created_at', { ascending: true }),
      db.from('organizations')
        .select('id, name, is_verified, category, members:organization_members(count)')
        .order('created_at', { ascending: false }).limit(5),
    ])

    const catMap: Record<string, number> = {}
    for (const row of byCategory || []) {
      const c = row.category || 'other'
      catMap[c] = (catMap[c] || 0) + 1
    }

    const acceptanceRate = joinRequests
      ? Math.round(((joinAccepted || 0) / (joinRequests || 1)) * 100)
      : 0

    return {
      totals: {
        total:          total || 0,
        verified:       verified || 0,
        new_month:      newThisMonth || 0,
        posts:          totalPosts || 0,
        activities:     totalActivities || 0,
        opportunities:  totalOpportunities || 0,
        join_requests:  joinRequests || 0,
        join_accepted:  joinAccepted || 0,
        acceptance_rate: acceptanceRate,
      },
      charts: {
        org_growth:    this.bucketByMonth(orgGrowth || [], 'created_at', 3),
        by_category:   Object.entries(catMap).map(([category, count]) => ({ category, count })),
      },
      top_orgs: topOrgs || [],
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 5. EVENT / ACTIVITY ANALYTICS
  // ════════════════════════════════════════════════════════════════
  async getEventAnalytics() {
    const db = this.db()

    const [
      { count: totalEvents },
      { count: eventsThisMonth },
      { count: totalRegistrations },
      { count: registrationsThisMonth },
      { data: upcomingEvents },
      { data: byType },
      { data: popularEvents },
    ] = await Promise.all([
      db.from('activities').select('*', { count: 'exact', head: true }),
      db.from('activities').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('activity_registrations').select('*', { count: 'exact', head: true }),
      db.from('activity_registrations').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('activities').select('id, title, start_date, type')
        .gte('start_date', new Date().toISOString()).limit(5)
        .order('start_date', { ascending: true }),
      db.from('activities').select('type'),
      db.from('activities')
        .select('id, title, type, start_date, registrations:activity_registrations(count)')
        .order('created_at', { ascending: false }).limit(5),
    ])

    const typeMap: Record<string, number> = {}
    for (const row of byType || []) {
      const t = row.type || 'other'
      typeMap[t] = (typeMap[t] || 0) + 1
    }

    const avgRegistrations = totalEvents
      ? Math.round((totalRegistrations || 0) / (totalEvents || 1))
      : 0

    return {
      totals: {
        total:              totalEvents || 0,
        new_month:          eventsThisMonth || 0,
        registrations:      totalRegistrations || 0,
        registrations_month: registrationsThisMonth || 0,
        avg_registrations:  avgRegistrations,
      },
      charts: {
        by_type: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
      },
      upcoming: upcomingEvents || [],
      popular:  popularEvents || [],
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 6. MATCHING / ECOSYSTEM ANALYTICS
  // ════════════════════════════════════════════════════════════════
  async getMatchingAnalytics() {
    const db = this.db()

    const [
      { count: totalJoins },
      { count: joinsThisMonth },
      { count: pendingRequests },
      { count: acceptedRequests },
      { count: rejectedRequests },
      { count: collabConnections },
      { data: joinTrend },
    ] = await Promise.all([
      db.from('organization_members').select('*', { count: 'exact', head: true }),
      db.from('organization_members').select('*', { count: 'exact', head: true })
        .gte('created_at', this.daysAgo(30)),
      db.from('join_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('join_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      db.from('join_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      db.from('connections').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted').eq('requester_type', 'organization'),
      db.from('organization_members').select('created_at')
        .gte('created_at', this.daysAgo(30)).order('created_at', { ascending: true }),
    ])

    const totalRequests = (acceptedRequests || 0) + (rejectedRequests || 0)
    const conversionRate = totalRequests
      ? Math.round(((acceptedRequests || 0) / totalRequests) * 100)
      : 0

    return {
      totals: {
        total_joins:       totalJoins || 0,
        joins_month:       joinsThisMonth || 0,
        pending_requests:  pendingRequests || 0,
        accepted_requests: acceptedRequests || 0,
        rejected_requests: rejectedRequests || 0,
        conversion_rate:   conversionRate,
        collab_connections: collabConnections || 0,
      },
      charts: {
        join_trend: this.bucketByDay(joinTrend || [], 'created_at', 30),
      },
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 7. RETENTION ANALYTICS
  // ════════════════════════════════════════════════════════════════
  async getRetentionAnalytics() {
    const db = this.db()

    // Cohort: users who signed up 30 days ago — how many are still active?
    const cohort30Start = this.daysAgo(37)
    const cohort30End   = this.daysAgo(30)

    const { data: cohortUsers } = await db.from('profiles')
      .select('id')
      .gte('created_at', cohort30Start)
      .lt('created_at', cohort30End)

    const cohortIds = (cohortUsers || []).map((u: any) => u.id)

    let day1 = 0, day7 = 0, day30 = 0

    if (cohortIds.length > 0) {
      // Day 1 retention: active within 24-48h of signup
      const { count: d1 } = await db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', cohortIds)
        .gte('last_active_at', cohort30Start)
        .lt('last_active_at', this.daysAgo(29))

      // Day 7 retention
      const { count: d7 } = await db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', cohortIds)
        .gte('last_active_at', this.daysAgo(23))

      // Day 30 retention: active in last 7 days
      const { count: d30 } = await db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', cohortIds)
        .gte('last_active_at', this.daysAgo(7))

      day1  = cohortIds.length ? Math.round(((d1  || 0) / cohortIds.length) * 100) : 0
      day7  = cohortIds.length ? Math.round(((d7  || 0) / cohortIds.length) * 100) : 0
      day30 = cohortIds.length ? Math.round(((d30 || 0) / cohortIds.length) * 100) : 0
    }

    // Churn: users who haven't been active in 30+ days
    const { count: churnedUsers } = await db.from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('last_active_at', this.daysAgo(30))

    const { count: totalUsers } = await db.from('profiles')
      .select('*', { count: 'exact', head: true })

    const churnRate = totalUsers
      ? Math.round(((churnedUsers || 0) / (totalUsers || 1)) * 100)
      : 0

    return {
      cohort_size: cohortIds.length,
      retention: {
        day_1:  day1,
        day_7:  day7,
        day_30: day30,
      },
      churn: {
        churned_users: churnedUsers || 0,
        churn_rate:    churnRate,
      },
    }
  }

  // ════════════════════════════════════════════════════════════════
  // MASTER: all sections in one call
  // ════════════════════════════════════════════════════════════════
  async getAllAnalytics() {
    const [
      userGrowth,
      engagement,
      community,
      organizations,
      events,
      matching,
      retention,
    ] = await Promise.all([
      this.getUserGrowth(),
      this.getUserEngagement(),
      this.getCommunityInteraction(),
      this.getOrganizationAnalytics(),
      this.getEventAnalytics(),
      this.getMatchingAnalytics(),
      this.getRetentionAnalytics(),
    ])

    return { userGrowth, engagement, community, organizations, events, matching, retention }
  }

  // ════════════════════════════════════════════════════════════════
  // TRACK EVENT (called from other services / frontend middleware)
  // ════════════════════════════════════════════════════════════════
  async trackEvent(data: {
    user_id?:    string
    event_type:  string
    category?:   string
    entity_type?: string
    entity_id?:  string
    metadata?:   Record<string, any>
    session_id?: string
    device_type?: string
    country?:    string
    city?:       string
    referrer?:   string
  }) {
    const { error } = await this.db().from('platform_events').insert({
      user_id:     data.user_id     || null,
      event_type:  data.event_type,
      category:    data.category    || 'user_action',
      entity_type: data.entity_type || null,
      entity_id:   data.entity_id   || null,
      metadata:    data.metadata    || {},
      session_id:  data.session_id  || null,
      device_type: data.device_type || null,
      country:     data.country     || null,
      city:        data.city        || null,
      referrer:    data.referrer    || null,
    })
    if (error) console.error('trackEvent error:', error.message)
  }

  async trackSession(data: {
    id:          string
    user_id?:    string
    device_type?: string
    country?:    string
    referrer?:   string
  }) {
    await this.db().from('user_sessions').upsert({
      id:          data.id,
      user_id:     data.user_id    || null,
      device_type: data.device_type || null,
      country:     data.country    || null,
      referrer:    data.referrer   || null,
    }, { onConflict: 'id' })
  }

  async endSession(sessionId: string, pageCount: number) {
    const { data: session } = await this.db()
      .from('user_sessions').select('started_at').eq('id', sessionId).single()
    if (!session) return

    const durationSec = Math.round(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    )
    await this.db().from('user_sessions').update({
      ended_at:     new Date().toISOString(),
      duration_sec: durationSec,
      page_count:   pageCount,
    }).eq('id', sessionId)
  }
}
