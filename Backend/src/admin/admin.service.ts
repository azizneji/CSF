import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { UploadsService } from '../uploads/uploads.service'
import * as bcrypt from 'bcrypt'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class AdminService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
    private uploads: UploadsService,
  ) {}

  private db() { return this.supabase.getAdminClient() }

  // ─── STATS ────────────────────────────────────────────────────

  async getStats() {
    const db = this.db()
    const [
      { count: users },
      { count: orgs },
      { count: enterprises },
      { count: posts },
      { count: opportunities },
      { count: activities },
      { count: publications },
      { count: services },
      { count: verifications },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('organizations').select('*', { count: 'exact', head: true }),
      db.from('enterprises').select('*', { count: 'exact', head: true }),
      db.from('posts').select('*', { count: 'exact', head: true }),
      db.from('opportunities').select('*', { count: 'exact', head: true }),
      db.from('activities').select('*', { count: 'exact', head: true }),
      db.from('publications').select('*', { count: 'exact', head: true }),
      db.from('free_services').select('*', { count: 'exact', head: true }),
      db.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count: newUsers } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { data: recentUsers } = await db
      .from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    return {
      totals: { users, orgs, enterprises, posts, opportunities, activities, publications, services },
      pending_verifications: verifications,
      new_users_30d: newUsers,
      recent_signups: recentUsers,
    }
  }

  // ─── USERS ────────────────────────────────────────────────────

  async getUsers(search?: string, role?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1
    let query = this.db().from('profiles').select('*', { count: 'exact' })
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    if (role)   query = query.eq('role', role)
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) throw new BadRequestException(error.message)
    return { data, total: count, page, limit }
  }

  async updateUser(userId: string, updates: { role?: string; is_suspended?: boolean; is_verified?: boolean }) {
    const { data, error } = await this.db()
      .from('profiles').update(updates).eq('id', userId).select().single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async impersonateUser(userId: string, adminId: string) {
    const { data: user } = await this.db().from('profiles').select('*').eq('id', userId).single()
    if (!user) throw new NotFoundException('User not found')
    await this.log(adminId, 'impersonate', 'user', userId, { target_email: user.email })
    const { data, error } = await this.db().auth.admin.generateLink({ type: 'magiclink', email: user.email })
    if (error) throw new BadRequestException(error.message)
    return { action_link: data.properties?.action_link, user }
  }

  async bulkCreateUsers(users: Array<{ email: string; full_name: string; password?: string }>, adminId: string) {
    const results = []
    for (const u of users) {
      try {
        const password = u.password || Math.random().toString(36).slice(-8) + 'A1!'
        const { data, error } = await this.db().auth.admin.createUser({
          email: u.email, password,
          user_metadata: { full_name: u.full_name },
          email_confirm: true,
        })
        if (error) { results.push({ email: u.email, success: false, error: error.message }); continue }
        results.push({ email: u.email, success: true, temp_password: u.password ? undefined : password, id: data.user?.id })
      } catch (e: any) {
        results.push({ email: u.email, success: false, error: e.message })
      }
    }
    await this.log(adminId, 'bulk_create_users', 'user', undefined, { count: users.length, results })
    return results
  }

  // ─── ORGANIZATIONS ────────────────────────────────────────────

  async getOrganizations(search?: string, page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1
    let query = this.db().from('organizations').select('*, members:organization_members(count)', { count: 'exact' })
    if (search) query = query.ilike('name', `%${search}%`)
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) throw new BadRequestException(error.message)
    return { data, total: count, page, limit }
  }

  async deleteOrganization(orgId: string, adminId: string) {
    const { error } = await this.db().from('organizations').delete().eq('id', orgId)
    if (error) throw new BadRequestException(error.message)
    await this.log(adminId, 'delete_organization', 'organization', orgId)
    return { message: 'Organization deleted' }
  }

  // ─── VERIFICATION ─────────────────────────────────────────────

  async getVerificationRequests(status?: string) {
    let query = this.db()
      .from('verification_requests')
      .select(`
        *,
        organization:organizations!organization_id(id, name, logo_url, category),
        submitter:profiles!submitted_by(id, full_name, email)
      `)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)

    // Resolve private storage-private:// references to signed URLs (1 hour)
    const resolved = await Promise.all((data || []).map(async (req: any) => {
      const resolve = (url: string | null) => url ? this.uploads.resolveUrl(url) : null
      const [patente_url, jort_url, statuts_url, extra_docs] = await Promise.all([
        resolve(req.patente_url),
        resolve(req.jort_url),
        resolve(req.statuts_url),
        req.extra_docs?.length
          ? Promise.all(req.extra_docs.map((u: string) => resolve(u)))
          : Promise.resolve([]),
      ])
      return { ...req, patente_url, jort_url, statuts_url, extra_docs }
    }))

    return resolved
  }

  async reviewVerification(requestId: string, adminId: string, status: 'approved' | 'rejected', note?: string) {
    const { data: req } = await this.db()
      .from('verification_requests').select('organization_id').eq('id', requestId).single()
    if (!req) throw new NotFoundException('Request not found')

    await this.db().from('verification_requests').update({
      status, admin_note: note, reviewed_by: adminId, reviewed_at: new Date().toISOString()
    }).eq('id', requestId)

    if (status === 'approved') {
      await this.notifications.onOrgVerified(req.organization_id)
      await this.db().from('organizations').update({
        is_verified: true, verified_at: new Date().toISOString()
      }).eq('id', req.organization_id)
    }

    await this.log(adminId, `verification_${status}`, 'organization', req.organization_id)
    return { message: `Verification ${status}` }
  }

  // ─── PLATFORM SETTINGS ────────────────────────────────────────

  async getSettings() {
    const { data, error } = await this.db().from('platform_settings').select('*')
    if (error) throw new BadRequestException(error.message)
    return data.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc }, {})
  }

  async updateSettings(settings: Record<string, string>, adminId: string) {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key, value, updated_by: adminId, updated_at: new Date().toISOString()
    }))
    const { error } = await this.db().from('platform_settings').upsert(updates, { onConflict: 'key' })
    if (error) throw new BadRequestException(error.message)
    await this.log(adminId, 'update_settings', 'platform', undefined, { keys: Object.keys(settings) })
    return { message: 'Settings updated' }
  }

  // ─── CONTENT ──────────────────────────────────────────────────

  async deletePost(postId: string, adminId: string) {
    const { error } = await this.db().from('posts').delete().eq('id', postId)
    if (error) throw new BadRequestException(error.message)
    await this.log(adminId, 'delete_post', 'post', postId)
    return { message: 'Post deleted' }
  }

  async getLogs(page = 1, limit = 50) {
    const from = (page - 1) * limit
    const to   = from + limit - 1
    const { data, error, count } = await this.db()
      .from('admin_logs')
      .select(`*, admin:profiles!admin_id(id, full_name, email)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw new BadRequestException(error.message)
    return { data, total: count, page, limit }
  }

  private async log(adminId: string, action: string, targetType?: string, targetId?: string, details?: any) {
    await this.db().from('admin_logs').insert({
      admin_id: adminId, action, target_type: targetType, target_id: targetId, details,
    })
  }
}
