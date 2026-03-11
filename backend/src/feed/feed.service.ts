import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreatePostDto, CreateCommentDto, CreateReactionDto } from './dto/feed.dto'

@Injectable()
export class FeedService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  // ─── Posts ────────────────────────────────────────────────────

  async createPost(userId: string, dto: CreatePostDto) {
    const db = this.supabase.getAdminClient()

    const { data, error } = await db
      .from('posts')
      .insert({
        content:     dto.content,
        author_type: dto.author_type,
        author_id:   dto.author_id,
        user_id:     userId, // the logged-in user who made the post
        images:      dto.images || [],
        files:       dto.files  || [],
      })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async getFeed(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to   = from + limit - 1

    const { data, error, count } = await this.supabase
      .getAdminClient()
      .from('posts')
      .select(`
        *,
        reactions:post_reactions(type, user_id),
        comments:post_comments(
          id, content, author_type, author_id, created_at,
          author_profile:profiles!user_id(id, full_name, avatar_url)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new BadRequestException(error.message)

    // Enrich with author details
    const enriched = await this.enrichPostsWithAuthors(data || [])

    return { data: enriched, total: count, page, limit }
  }

  async getPostById(id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('posts')
      .select(`
        *,
        reactions:post_reactions(type, user_id),
        comments:post_comments(
          id, content, author_type, author_id, created_at,
          author_profile:profiles!user_id(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Post not found')

    const [enriched] = await this.enrichPostsWithAuthors([data])
    return enriched
  }

  async deletePost(postId: string, userId: string) {
    const { data: post } = await this.supabase
      .getAdminClient()
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post) throw new NotFoundException('Post not found')
    if (post.user_id !== userId) throw new ForbiddenException('Not your post')

    const { error } = await this.supabase
      .getAdminClient()
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw new BadRequestException(error.message)
    return { message: 'Post deleted' }
  }

  // ─── Reactions ────────────────────────────────────────────────

  async reactToPost(postId: string, dto: CreateReactionDto) {
    const db = this.supabase.getAdminClient()

    // Check if user already reacted — toggle or change
    const { data: existing } = await db
      .from('post_reactions')
      .select('id, type')
      .eq('post_id', postId)
      .eq('user_id', dto.user_id)
      .single()

    if (existing) {
      if (existing.type === dto.type) {
        // Same reaction → remove it (toggle off)
        await db.from('post_reactions').delete().eq('id', existing.id)
        return { message: 'Reaction removed' }
      } else {
        // Different reaction → update
        const { data, error } = await db
          .from('post_reactions')
          .update({ type: dto.type })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw new BadRequestException(error.message)
        return data
      }
    }

    // New reaction
    const { data, error } = await db
      .from('post_reactions')
      .insert({ post_id: postId, user_id: dto.user_id, type: dto.type })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // 🔔 Notify post owner + check 100-reaction milestone
    await this.notifications.onReaction(dto.user_id, postId)

    return data
  }

  // ─── Comments ─────────────────────────────────────────────────

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('post_comments')
      .insert({
        post_id:     postId,
        content:     dto.content,
        author_type: dto.author_type,
        author_id:   dto.author_id,
        user_id:     userId,
      })
      .select(`
        *,
        author_profile:profiles!user_id(id, full_name, avatar_url)
      `)
      .single()

    if (error) throw new BadRequestException(error.message)

    // 🔔 Notify post owner
    await this.notifications.onComment(userId, postId)

    return data
  }

  async deleteComment(commentId: string, userId: string) {
    const { data: comment } = await this.supabase
      .getAdminClient()
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (!comment) throw new NotFoundException('Comment not found')
    if (comment.user_id !== userId) throw new ForbiddenException('Not your comment')

    await this.supabase.getAdminClient()
      .from('post_comments')
      .delete()
      .eq('id', commentId)

    return { message: 'Comment deleted' }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async enrichPostsWithAuthors(posts: any[]) {
    const db = this.supabase.getAdminClient()

    return Promise.all(posts.map(async (post) => {
      let author = null

      if (post.author_type === 'user') {
        const { data } = await db
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', post.author_id)
          .single()
        author = data
      } else if (post.author_type === 'organization') {
        const { data } = await db
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', post.author_id)
          .single()
        author = data ? { ...data, full_name: data.name, avatar_url: data.logo_url } : null
      } else if (post.author_type === 'enterprise') {
        const { data } = await db
          .from('enterprises')
          .select('id, name, logo_url')
          .eq('id', post.author_id)
          .single()
        author = data ? { ...data, full_name: data.name, avatar_url: data.logo_url } : null
      }

      // Group reactions by type with counts
      const reactionCounts = (post.reactions || []).reduce((acc: any, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1
        return acc
      }, {})

      return { ...post, author, reaction_counts: reactionCounts }
    }))
  }
}