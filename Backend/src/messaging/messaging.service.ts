import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

export type ActorType = 'user' | 'organization' | 'enterprise'

@Injectable()
export class MessagingService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  // ─── Verify the caller controls the actor ────────────────────────────────
  private async assertActorAccess(userId: string, actorType: ActorType, actorId: string) {
    if (actorType === 'user') {
      if (userId !== actorId) throw new ForbiddenException('Not your account')
      return
    }
    if (actorType === 'organization') {
      const { data } = await this.db()
        .from('organization_members')
        .select('role')
        .eq('organization_id', actorId)
        .eq('user_id', userId)
        .single()
      if (!data || !['admin', 'manager'].includes(data.role)) {
        throw new ForbiddenException('Not an admin/manager of this organization')
      }
      return
    }
    if (actorType === 'enterprise') {
      const { data } = await this.db()
        .from('enterprises')
        .select('id')
        .eq('id', actorId)
        .eq('created_by', userId)
        .single()
      if (!data) throw new ForbiddenException('Not the owner of this enterprise')
      return
    }
    throw new BadRequestException('Invalid actor type')
  }

  // ─── Enrich actor info (name, avatar) ────────────────────────────────────
  private async enrichActor(actorType: ActorType, actorId: string) {
    if (actorType === 'user') {
      const { data } = await this.db()
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', actorId)
        .single()
      return { type: 'user', id: actorId, name: data?.full_name, avatar: data?.avatar_url }
    }
    if (actorType === 'organization') {
      const { data } = await this.db()
        .from('organizations')
        .select('id, name, logo_url')
        .eq('id', actorId)
        .single()
      return { type: 'organization', id: actorId, name: data?.name, avatar: data?.logo_url }
    }
    if (actorType === 'enterprise') {
      const { data } = await this.db()
        .from('enterprises')
        .select('id, name, logo_url')
        .eq('id', actorId)
        .single()
      return { type: 'enterprise', id: actorId, name: data?.name, avatar: data?.logo_url }
    }
  }

  // ─── Get or create conversation between two actors ───────────────────────
  async getOrCreateConversation(
    userId: string,
    myType: ActorType, myId: string,
    theirType: ActorType, theirId: string,
  ) {
    await this.assertActorAccess(userId, myType, myId)

    // Check if conversation already exists between these two actors
    const { data: existing } = await this.db()
      .from('conversation_participants')
      .select('conversation_id')
      .eq('actor_type', myType)
      .eq('actor_id', myId)

    if (existing && existing.length > 0) {
      const myConvIds = existing.map((e: any) => e.conversation_id)

      const { data: match } = await this.db()
        .from('conversation_participants')
        .select('conversation_id')
        .eq('actor_type', theirType)
        .eq('actor_id', theirId)
        .in('conversation_id', myConvIds)
        .limit(1)
        .single()

      if (match) {
        // Conversation exists — verify it has exactly 2 participants (direct message)
        const { count } = await this.db()
          .from('conversation_participants')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', match.conversation_id)

        if (count === 2) {
          return { conversation_id: match.conversation_id, created: false }
        }
      }
    }

    // Create new conversation
    const { data: conv, error } = await this.db()
      .from('conversations')
      .insert({})
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)

    await this.db().from('conversation_participants').insert([
      { conversation_id: conv.id, actor_type: myType,   actor_id: myId },
      { conversation_id: conv.id, actor_type: theirType, actor_id: theirId },
    ])

    return { conversation_id: conv.id, created: true }
  }

  // ─── List conversations for an actor ─────────────────────────────────────
  async getConversations(userId: string, actorType: ActorType, actorId: string) {
    await this.assertActorAccess(userId, actorType, actorId)

    const { data: participations } = await this.db()
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('actor_type', actorType)
      .eq('actor_id', actorId)

    if (!participations || participations.length === 0) return []

    const convIds = participations.map((p: any) => p.conversation_id)
    const lastReadMap = Object.fromEntries(
      participations.map((p: any) => [p.conversation_id, p.last_read_at])
    )

    // Get all participants for these conversations
    const { data: allParticipants } = await this.db()
      .from('conversation_participants')
      .select('conversation_id, actor_type, actor_id')
      .in('conversation_id', convIds)

    // Get last message for each conversation
    const { data: conversations } = await this.db()
      .from('conversations')
      .select('id, updated_at')
      .in('id', convIds)
      .order('updated_at', { ascending: false })

    // Get last message per conversation
    const lastMessages: Record<string, any> = {}
    for (const convId of convIds) {
      const { data: msg } = await this.db()
        .from('messages')
        .select('content, created_at, sender_type, sender_id')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (msg) lastMessages[convId] = msg
    }

    // Count unread messages per conversation
    const unreadCounts: Record<string, number> = {}
    for (const convId of convIds) {
      const lastRead = lastReadMap[convId]
      const { count } = await this.db()
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', actorId)
        .gt('created_at', lastRead || '1970-01-01')
      unreadCounts[convId] = count || 0
    }

    // Build enriched list
    const result = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const participants = (allParticipants || []).filter(
          (p: any) => p.conversation_id === conv.id && !(p.actor_type === actorType && p.actor_id === actorId)
        )
        const otherActors = await Promise.all(
          participants.map((p: any) => this.enrichActor(p.actor_type, p.actor_id))
        )
        return {
          id: conv.id,
          updated_at: conv.updated_at,
          last_message: lastMessages[conv.id] || null,
          unread_count: unreadCounts[conv.id] || 0,
          participants: otherActors,
        }
      })
    )

    return result
  }

  // ─── Get messages in a conversation ──────────────────────────────────────
  async getMessages(userId: string, actorType: ActorType, actorId: string, conversationId: string, page = 1) {
    await this.assertActorAccess(userId, actorType, actorId)

    // Verify actor is a participant
    const { data: participant } = await this.db()
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('actor_type', actorType)
      .eq('actor_id', actorId)
      .single()

    if (!participant) throw new ForbiddenException('Not a participant in this conversation')

    const limit = 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: messages, count } = await this.db()
      .from('messages')
      .select('id, content, sender_type, sender_id, created_at', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(from, to)

    // Mark as read
    await this.db()
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('actor_type', actorType)
      .eq('actor_id', actorId)

    // Enrich senders
    const enriched = await Promise.all(
      (messages || []).map(async (msg: any) => ({
        ...msg,
        sender: await this.enrichActor(msg.sender_type, msg.sender_id),
      }))
    )

    return {
      data: enriched.reverse(), // chronological order
      total: count,
      page,
      limit,
    }
  }

  // ─── Send a message ───────────────────────────────────────────────────────
  async sendMessage(
    userId: string,
    actorType: ActorType, actorId: string,
    conversationId: string,
    content: string,
  ) {
    await this.assertActorAccess(userId, actorType, actorId)

    if (!content?.trim()) throw new BadRequestException('Message cannot be empty')

    // Verify participant
    const { data: participant } = await this.db()
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('actor_type', actorType)
      .eq('actor_id', actorId)
      .single()

    if (!participant) throw new ForbiddenException('Not a participant in this conversation')

    const { data: message, error } = await this.db()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: actorType,
        sender_id: actorId,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    return {
      ...message,
      sender: await this.enrichActor(actorType, actorId),
    }
  }

  // ─── Get unread count (for navbar badge) ─────────────────────────────────
  async getUnreadCount(userId: string, actorType: ActorType, actorId: string) {
    await this.assertActorAccess(userId, actorType, actorId)

    const { data: participations } = await this.db()
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('actor_type', actorType)
      .eq('actor_id', actorId)

    if (!participations || participations.length === 0) return { unread: 0 }

    let total = 0
    for (const p of participations) {
      const { count } = await this.db()
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .neq('sender_id', actorId)
        .gt('created_at', p.last_read_at || '1970-01-01')
      total += count || 0
    }

    return { unread: total }
  }
}
