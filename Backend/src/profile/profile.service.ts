import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ProfileService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  // ─── Profile ──────────────────────────────────────────────────

  async getFullProfile(profileId: string) {
    const db = this.db()

    const [
      { data: profile },
      { data: experiences },
      { data: socialLinks },
      { data: posts },
      { data: orgs },
    ] = await Promise.all([
      db.from('profiles').select('*').eq('id', profileId).single(),
      db.from('profile_experiences').select('*').eq('user_id', profileId).order('is_current', { ascending: false }).order('start_date', { ascending: false }),
      db.from('social_links').select('*').eq('owner_type', 'user').eq('owner_id', profileId),
      db.from('posts').select(`
        *,
        reactions:post_reactions(type, user_id),
        comments:post_comments(id)
      `).eq('user_id', profileId).order('created_at', { ascending: false }).limit(10),
      db.from('organization_members').select(`
        role, joined_at,
        organization:organizations!organization_id(id, name, logo_url, category, is_verified)
      `).eq('user_id', profileId),
    ])

    if (!profile) throw new NotFoundException('Profile not found')

    return { ...profile, experiences, social_links: socialLinks, recent_posts: posts, organizations: orgs }
  }

  async updateProfile(userId: string, updates: any) {
    const allowed = ['full_name', 'bio', 'location', 'avatar_url', 'phone', 'website', 'job_title', 'interests', 'skills']
    const filtered = Object.keys(updates)
      .filter(k => allowed.includes(k))
      .reduce((acc: any, k) => { acc[k] = updates[k]; return acc }, {})

    const { data, error } = await this.db()
      .from('profiles')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  // ─── Experiences ──────────────────────────────────────────────

  async addExperience(userId: string, exp: any) {
    const { data, error } = await this.db()
      .from('profile_experiences')
      .insert({ ...exp, user_id: userId })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async updateExperience(expId: string, userId: string, updates: any) {
    await this.checkExpOwner(expId, userId)
    const { data, error } = await this.db()
      .from('profile_experiences')
      .update(updates)
      .eq('id', expId)
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async deleteExperience(expId: string, userId: string) {
    await this.checkExpOwner(expId, userId)
    await this.db().from('profile_experiences').delete().eq('id', expId)
    return { message: 'Experience deleted' }
  }

  // ─── Social Links ─────────────────────────────────────────────

  async upsertSocialLinks(ownerType: string, ownerId: string, links: Array<{ platform: string; url: string }>) {
    const db = this.db()
    await db.from('social_links').delete().eq('owner_type', ownerType).eq('owner_id', ownerId)

    if (links.length === 0) return []

    const { data, error } = await db.from('social_links').insert(
      links.filter(l => l.url).map(l => ({ owner_type: ownerType, owner_id: ownerId, platform: l.platform, url: l.url }))
    ).select()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async getSocialLinks(ownerType: string, ownerId: string) {
    const { data } = await this.db()
      .from('social_links')
      .select('*')
      .eq('owner_type', ownerType)
      .eq('owner_id', ownerId)
    return data || []
  }

  // ─── Join Requests ────────────────────────────────────────────

  async requestJoin(userId: string, orgId: string, message?: string, roleRequested = 'member') {
    const { data, error } = await this.db()
      .from('join_requests')
      .insert({ user_id: userId, organization_id: orgId, message, role_requested: roleRequested })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async getJoinRequests(orgId: string, userId: string) {
    const { data: mem } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()
    if (!mem || !['admin', 'manager'].includes(mem.role)) {
      throw new ForbiddenException('Org admin/manager only')
    }

    const { data } = await this.db()
      .from('join_requests')
      .select(`*, user:profiles!user_id(id, full_name, avatar_url, bio, job_title)`)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return data
  }

  async reviewJoinRequest(requestId: string, reviewerId: string, status: 'accepted' | 'rejected') {
    const { data: req } = await this.db()
      .from('join_requests')
      .select('*, organization:organizations!organization_id(id)')
      .eq('id', requestId)
      .single()
    if (!req) throw new NotFoundException('Request not found')

    await this.db().from('join_requests').update({
      status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString()
    }).eq('id', requestId)

    if (status === 'accepted') {
      const { data: existingMember } = await this.db()
        .from('organization_members')
        .select('id')
        .eq('organization_id', req.organization_id)
        .eq('user_id', req.user_id)
        .single()

      if (!existingMember) {
        await this.db().from('organization_members').insert({
          organization_id: req.organization_id,
          user_id: req.user_id,
          role: req.role_requested || 'member',
        })
      }
    }

    return { message: `Request ${status}` }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async checkExpOwner(expId: string, userId: string) {
    const { data } = await this.db().from('profile_experiences').select('user_id').eq('id', expId).single()
    if (!data) throw new NotFoundException('Experience not found')
    if (data.user_id !== userId) throw new ForbiddenException('Not authorized')
  }
}