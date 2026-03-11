import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import {
  CreateGroupDto, UpdateGroupDto, CreateGroupPostDto,
  CreateGroupMessageDto, InviteUserDto, RespondJoinRequestDto, UpdateMemberRoleDto,
} from './dto/groups.dto'

@Injectable()
export class GroupsService {
  constructor(private supabase: SupabaseService) {}

  private get db() { return this.supabase.getAdminClient() }

  // ─── GROUPS CRUD ────────────────────────────────────────────

  async findAll(userId?: string, search?: string) {
    let query = this.db.from('groups').select(`
      id, name, description, cover_url, visibility, post_approval, member_count, created_at, created_by
    `)

    // Only show public, approval groups to non-members; hidden groups only via direct link
    query = query.in('visibility', ['public', 'approval'])

    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    if (!userId) return data

    // Attach membership status
    const { data: memberships } = await this.db
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId)

    const memberMap = new Map((memberships || []).map((m: any) => [m.group_id, m.role]))

    return (data || []).map((g: any) => ({
      ...g,
      membership: memberMap.get(g.id) || null,
    }))
  }

  async findMyGroups(userId: string) {
    const { data, error } = await this.db
      .from('group_members')
      .select(`role, group:groups(id, name, description, cover_url, visibility, post_approval, member_count, created_at, created_by)`)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []).map((m: any) => ({ ...m.group, membership: m.role }))
  }

  async findById(id: string, userId?: string) {
    const { data, error } = await this.db
      .from('groups')
      .select(`*, creator:profiles!groups_created_by_fkey(id, full_name, avatar_url)`)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Group not found')

    // Check access for private/hidden groups
    if (['private', 'hidden'].includes(data.visibility) && userId) {
      const { data: member } = await this.db
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .single()
      if (!member) throw new ForbiddenException('You are not a member of this group')
    }

    let membership = null
    if (userId) {
      const { data: member } = await this.db
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .single()
      membership = member?.role || null
    }

    // Member count already in table
    return { ...data, membership }
  }

  async create(userId: string, dto: CreateGroupDto) {
    const { data: group, error } = await this.db
      .from('groups')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Creator becomes owner
    await this.db.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
    })

    return group
  }

  async update(id: string, userId: string, dto: UpdateGroupDto) {
    await this.requireAdminOrOwner(id, userId)

    const { data, error } = await this.db
      .from('groups')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    await this.requireOwner(id, userId)
    const { error } = await this.db.from('groups').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // ─── MEMBERSHIP ─────────────────────────────────────────────

  async join(groupId: string, userId: string, message?: string) {
    const group = await this.findById(groupId, userId).catch(() => null)
    if (!group) throw new NotFoundException('Group not found')

    if (group.visibility === 'private') throw new ForbiddenException('This group is invite-only')

    // Check already member
    const { data: existing } = await this.db
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
    if (existing) throw new BadRequestException('Already a member')

    if (group.visibility === 'approval') {
      // Create join request
      const { error } = await this.db.from('group_join_requests').upsert({
        group_id: groupId,
        user_id: userId,
        message,
        status: 'pending',
      })
      if (error) throw new Error(error.message)
      return { status: 'pending', message: 'Join request sent' }
    }

    // Public — join directly
    const { error } = await this.db.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    })
    if (error) throw new Error(error.message)
    return { status: 'joined' }
  }

  async leave(groupId: string, userId: string) {
    await this.requireMember(groupId, userId)
    const { error } = await this.db
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  async getMembers(groupId: string) {
    const { data, error } = await this.db
      .from('group_members')
      .select(`role, joined_at, user:profiles(id, full_name, avatar_url, bio)`)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data
  }

  async updateMemberRole(groupId: string, targetUserId: string, requesterId: string, dto: UpdateMemberRoleDto) {
    await this.requireOwner(groupId, requesterId)
    const { error } = await this.db
      .from('group_members')
      .update({ role: dto.role })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  async kickMember(groupId: string, targetUserId: string, requesterId: string) {
    await this.requireAdminOrOwner(groupId, requesterId)
    const { error } = await this.db
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // ─── JOIN REQUESTS ──────────────────────────────────────────

  async getJoinRequests(groupId: string, requesterId: string) {
    await this.requireAdminOrOwner(groupId, requesterId)
    const { data, error } = await this.db
      .from('group_join_requests')
      .select(`*, user:profiles(id, full_name, avatar_url)`)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  }

  async respondJoinRequest(groupId: string, requestId: string, requesterId: string, dto: RespondJoinRequestDto) {
    await this.requireAdminOrOwner(groupId, requesterId)

    const { data: req, error: fetchError } = await this.db
      .from('group_join_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    if (fetchError || !req) throw new NotFoundException('Request not found')

    await this.db.from('group_join_requests').update({
      status: dto.action,
      reviewed_by: requesterId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', requestId)

    if (dto.action === 'accepted') {
      await this.db.from('group_members').insert({
        group_id: groupId,
        user_id: req.user_id,
        role: 'member',
      })
    }

    return { success: true }
  }

  // ─── INVITES ────────────────────────────────────────────────

  async invite(groupId: string, inviterId: string, dto: InviteUserDto) {
    await this.requireAdminOrOwner(groupId, inviterId)
    const { error } = await this.db.from('group_invites').upsert({
      group_id: groupId,
      invited_by: inviterId,
      invited_user_id: dto.user_id,
      status: 'pending',
    })
    if (error) throw new Error(error.message)
    return { success: true }
  }

  async respondInvite(groupId: string, userId: string, action: 'accepted' | 'rejected') {
    const { data: invite } = await this.db
      .from('group_invites')
      .select('*')
      .eq('group_id', groupId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .single()
    if (!invite) throw new NotFoundException('Invite not found')

    await this.db.from('group_invites').update({ status: action }).eq('id', invite.id)

    if (action === 'accepted') {
      await this.db.from('group_members').insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      })
    }
    return { success: true }
  }

  async getMyInvites(userId: string) {
    const { data, error } = await this.db
      .from('group_invites')
      .select(`*, group:groups(id, name, cover_url), inviter:profiles!group_invites_invited_by_fkey(id, full_name, avatar_url)`)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
    if (error) throw new Error(error.message)
    return data
  }

  // ─── GROUP POSTS ────────────────────────────────────────────

  async getPosts(groupId: string, userId: string) {
    await this.requireMember(groupId, userId)

    const { data, error } = await this.db
      .from('group_posts')
      .select(`
        *,
        author:profiles(id, full_name, avatar_url),
        comments:group_post_comments(id, content, created_at, author:profiles(id, full_name, avatar_url)),
        reactions:group_post_reactions(id, type, user_id)
      `)
      .eq('group_id', groupId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  }

  async getPendingPosts(groupId: string, userId: string) {
    await this.requireAdminOrOwner(groupId, userId)
    const { data, error } = await this.db
      .from('group_posts')
      .select(`*, author:profiles(id, full_name, avatar_url)`)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  }

  async createPost(groupId: string, userId: string, dto: CreateGroupPostDto) {
    await this.requireMember(groupId, userId)

    const group = await this.findById(groupId, userId)
    const isAdmin = await this.isAdminOrOwner(groupId, userId)
    const status = group.post_approval && !isAdmin ? 'pending' : 'approved'

    const { data, error } = await this.db
      .from('group_posts')
      .insert({ ...dto, group_id: groupId, author_id: userId, status })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { ...data, requiresApproval: status === 'pending' }
  }

  async approvePost(groupId: string, postId: string, userId: string, action: 'approved' | 'rejected') {
    await this.requireAdminOrOwner(groupId, userId)
    const { error } = await this.db
      .from('group_posts')
      .update({ status: action })
      .eq('id', postId)
      .eq('group_id', groupId)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  async deletePost(groupId: string, postId: string, userId: string) {
    const { data: post } = await this.db.from('group_posts').select('author_id').eq('id', postId).single()
    const isAdmin = await this.isAdminOrOwner(groupId, userId)
    if (post?.author_id !== userId && !isAdmin) throw new ForbiddenException('Not allowed')
    await this.db.from('group_posts').delete().eq('id', postId)
    return { success: true }
  }

  async reactPost(groupId: string, postId: string, userId: string, type: string) {
    await this.requireMember(groupId, userId)
    const { data: existing } = await this.db
      .from('group_post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      await this.db.from('group_post_reactions').delete().eq('id', existing.id)
      return { action: 'removed' }
    }
    await this.db.from('group_post_reactions').insert({ post_id: postId, user_id: userId, type })
    return { action: 'added' }
  }

  async commentPost(groupId: string, postId: string, userId: string, content: string) {
    await this.requireMember(groupId, userId)
    const { data, error } = await this.db
      .from('group_post_comments')
      .insert({ post_id: postId, author_id: userId, content })
      .select(`*, author:profiles(id, full_name, avatar_url)`)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  // ─── GROUP MESSAGES (chat) ───────────────────────────────────

  async getMessages(groupId: string, userId: string, limit = 50) {
    await this.requireMember(groupId, userId)
    const { data, error } = await this.db
      .from('group_messages')
      .select(`*, sender:profiles(id, full_name, avatar_url)`)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data || []).reverse()
  }

  async sendMessage(groupId: string, userId: string, dto: CreateGroupMessageDto) {
    await this.requireMember(groupId, userId)
    const { data, error } = await this.db
      .from('group_messages')
      .insert({ group_id: groupId, sender_id: userId, content: dto.content })
      .select(`*, sender:profiles(id, full_name, avatar_url)`)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private async requireMember(groupId: string, userId: string) {
    const { data } = await this.db
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
    if (!data) throw new ForbiddenException('You are not a member of this group')
    return data
  }

  private async requireAdminOrOwner(groupId: string, userId: string) {
    const { data } = await this.db
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
    if (!data || !['admin', 'owner'].includes(data.role)) {
      throw new ForbiddenException('Admin access required')
    }
    return data
  }

  private async requireOwner(groupId: string, userId: string) {
    const { data } = await this.db
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
    if (!data || data.role !== 'owner') throw new ForbiddenException('Owner access required')
    return data
  }

  private async isAdminOrOwner(groupId: string, userId: string): Promise<boolean> {
    const { data } = await this.db
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
    return data ? ['admin', 'owner'].includes(data.role) : false
  }
}
