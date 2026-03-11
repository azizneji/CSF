import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  CreatePetitionDto, UpdatePetitionDto, SignPetitionDto, AddPetitionUpdateDto,
} from './dto/petitions.dto'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

@Injectable()
export class PetitionsService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  private get db() { return this.supabase.getAdminClient() }

  // ─── CRUD ────────────────────────────────────────────────────

  async findAll(params?: { status?: string; search?: string; page?: number }) {
    const { status, search, page = 1 } = params || {}
    const limit = 20
    const offset = (page - 1) * limit

    let query = this.db.from('petitions').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    else query = query.neq('status', 'closed') // default: show active + goal_reached

    if (search) query = query.ilike('title', `%${search}%`)

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    // Enrich with author info
    const enriched = await Promise.all((data || []).map(p => this.enrichWithAuthor(p)))
    return { data: enriched, total: count || 0 }
  }

  async findById(id: string, userId?: string) {
    const { data, error } = await this.db
      .from('petitions')
      .select(`*, updates:petition_updates(*, author:profiles(id, full_name, avatar_url))`)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Petition not found')

    const enriched = await this.enrichWithAuthor(data)

    // Check if user signed
    let signed = false
    let signatureId = null
    if (userId) {
      const { data: sig } = await this.db
        .from('petition_signatures')
        .select('id')
        .eq('petition_id', id)
        .eq('user_id', userId)
        .single()
      signed = !!sig
      signatureId = sig?.id || null
    }

    // Get recent signers
    const { data: signers } = await this.db
      .from('petition_signatures')
      .select('id, created_at, comment, user:profiles(id, full_name, avatar_url)')
      .eq('petition_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return { ...enriched, signed, signatureId, recent_signers: signers || [] }
  }

  async create(userId: string, dto: CreatePetitionDto) {
    // Verify org ownership if author_type is organization
    if (dto.author_type === 'organization') {
      const { data: member } = await this.db
        .from('organization_members')
        .select('role')
        .eq('organization_id', dto.author_id)
        .eq('user_id', userId)
        .single()
      if (!member || !['admin', 'owner', 'manager'].includes(member.role)) {
        throw new ForbiddenException('You must be an admin of this organization')
      }
    }

    const { data, error } = await this.db
      .from('petitions')
      .insert({ ...dto, status: 'active' })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Create feed post
    await this.createFeedPost(data, userId)

    return data
  }

  async update(id: string, userId: string, dto: UpdatePetitionDto) {
    await this.requireAuthor(id, userId)
    const { data, error } = await this.db
      .from('petitions')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    await this.requireAuthor(id, userId)
    await this.db.from('petitions').delete().eq('id', id)
    return { success: true }
  }

  async close(id: string, userId: string) {
    await this.requireAuthor(id, userId)
    await this.db.from('petitions').update({ status: 'closed' }).eq('id', id)
    return { success: true }
  }

  // ─── SIGN ────────────────────────────────────────────────────

  async sign(petitionId: string, userId: string, dto: SignPetitionDto) {
    const { data: petition } = await this.db
      .from('petitions')
      .select('*')
      .eq('id', petitionId)
      .single()

    if (!petition) throw new NotFoundException('Petition not found')
    if (petition.status === 'closed') throw new BadRequestException('This petition is closed')

    // Check deadline
    if (petition.deadline && new Date(petition.deadline) < new Date()) {
      await this.db.from('petitions').update({ status: 'closed' }).eq('id', petitionId)
      throw new BadRequestException('This petition has passed its deadline')
    }

    // Check already signed
    const { data: existing } = await this.db
      .from('petition_signatures')
      .select('id')
      .eq('petition_id', petitionId)
      .eq('user_id', userId)
      .single()
    if (existing) throw new BadRequestException('You have already signed this petition')

    // Insert signature
    await this.db.from('petition_signatures').insert({
      petition_id: petitionId,
      user_id: userId,
      comment: dto.comment,
      share_to_feed: dto.share_to_feed || false,
    })

    // Reload updated petition
    const { data: updated } = await this.db
      .from('petitions')
      .select('*')
      .eq('id', petitionId)
      .single()

    // Share to feed if requested
    if (dto.share_to_feed) {
      await this.createSignatureFeedPost(updated, userId)
    }

    // Check if goal reached
    if (updated.signature_count >= updated.goal && updated.status === 'active') {
      await this.onGoalReached(updated, userId)
    }

    return { success: true, signature_count: updated.signature_count }
  }

  async unsign(petitionId: string, userId: string) {
    const { data: petition } = await this.db
      .from('petitions').select('status').eq('id', petitionId).single()
    if (petition?.status !== 'active') throw new BadRequestException('Cannot unsign a closed petition')

    await this.db
      .from('petition_signatures')
      .delete()
      .eq('petition_id', petitionId)
      .eq('user_id', userId)
    return { success: true }
  }

  async getSignatures(petitionId: string, page = 1) {
    const limit = 20
    const offset = (page - 1) * limit
    const { data, count } = await this.db
      .from('petition_signatures')
      .select('*, user:profiles(id, full_name, avatar_url)', { count: 'exact' })
      .eq('petition_id', petitionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    return { data: data || [], total: count || 0 }
  }

  // ─── UPDATES ─────────────────────────────────────────────────

  async addUpdate(petitionId: string, userId: string, dto: AddPetitionUpdateDto) {
    await this.requireAuthor(petitionId, userId)
    const { data, error } = await this.db
      .from('petition_updates')
      .insert({ petition_id: petitionId, author_id: userId, content: dto.content })
      .select(`*, author:profiles(id, full_name, avatar_url)`)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  // ─── CRON: close expired petitions ───────────────────────────

  async closeExpiredPetitions() {
    const { data, error } = await this.db
      .from('petitions')
      .update({ status: 'closed' })
      .eq('status', 'active')
      .lt('deadline', new Date().toISOString())
      .select()
    if (error) throw new Error(error.message)
    return { closed: (data || []).length }
  }

  // ─── GOAL REACHED ─────────────────────────────────────────────

  private async onGoalReached(petition: any, triggerUserId: string) {
    // Update status
    await this.db.from('petitions')
      .update({ status: 'goal_reached' })
      .eq('id', petition.id)

    // Generate PDF
    const pdfUrl = await this.generatePdf(petition)
    if (pdfUrl) {
      await this.db.from('petitions').update({ pdf_url: pdfUrl }).eq('id', petition.id)
    }

    // Notify all signers
    const { data: signers } = await this.db
      .from('petition_signatures')
      .select('user_id')
      .eq('petition_id', petition.id)

    const signerIds = (signers || []).map((s: any) => s.user_id)
    await this.notifications.createBatch(
      signerIds,
      'admin_broadcast' as any,
      `La pétition "${petition.title}" a atteint son objectif de ${petition.goal} signatures !`,
      `/petitions/${petition.id}`,
    )

    // Notify petition owner
    if (petition.author_type === 'user') {
      await this.notifications.create(
        petition.author_id,
        'admin_broadcast' as any,
        `"${petition.title}" a recueilli ${petition.goal} signatures. Un PDF a été généré.`,
        `/petitions/${petition.id}`,
      )
    }

    // Create feed post about goal reached
    await this.db.from('feed_posts').insert({
      post_type: 'petition',
      content: `La pétition "${petition.title}" a atteint son objectif de ${petition.goal} signatures !`,
      ref_id: petition.id,
      ref_title: petition.title,
      user_id: triggerUserId,
      author_type: petition.author_type,
      author_id: petition.author_id,
    })
  }

  // ─── PDF GENERATION ───────────────────────────────────────────

  private async generatePdf(petition: any): Promise<string | null> {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4
      const { width, height } = page.getSize()

      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

      const brandColor = rgb(0.09, 0.45, 0.33)
      const darkColor = rgb(0.1, 0.1, 0.1)
      const grayColor = rgb(0.5, 0.5, 0.5)

      let y = height - 60

      // Header bar
      page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: brandColor })
      page.drawText('CITOYENS SANS FRONTIÈRES', {
        x: 40, y: height - 35, size: 14, font: boldFont, color: rgb(1, 1, 1),
      })
      page.drawText('Pétition Officielle', {
        x: 40, y: height - 55, size: 10, font: regularFont, color: rgb(0.8, 0.95, 0.88),
      })

      y = height - 120

      // Title
      page.drawText('PÉTITION', { x: 40, y, size: 10, font: boldFont, color: brandColor })
      y -= 25
      page.drawText(petition.title, { x: 40, y, size: 20, font: boldFont, color: darkColor, maxWidth: width - 80 })
      y -= 40

      // Divider
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
      y -= 25

      // Stats row
      const stats = [
        { label: 'Signatures', value: petition.signature_count.toString() },
        { label: 'Objectif', value: petition.goal.toString() },
        { label: 'Statut', value: petition.status === 'goal_reached' ? 'Objectif atteint ✓' : 'Active' },
      ]
      let statX = 40
      for (const stat of stats) {
        page.drawText(stat.value, { x: statX, y, size: 16, font: boldFont, color: brandColor })
        page.drawText(stat.label, { x: statX, y: y - 18, size: 9, font: regularFont, color: grayColor })
        statX += 160
      }
      y -= 55

      // Institution
      if (petition.target_institution) {
        page.drawText('Destinataire', { x: 40, y, size: 9, font: boldFont, color: grayColor })
        y -= 16
        page.drawText(petition.target_institution, { x: 40, y, size: 12, font: boldFont, color: darkColor })
        y -= 30
      }

      // Objective
      page.drawText('Objectif de la pétition', { x: 40, y, size: 9, font: boldFont, color: grayColor })
      y -= 16
      const objLines = wrapText(petition.objective, 75)
      for (const line of objLines) {
        page.drawText(line, { x: 40, y, size: 11, font: regularFont, color: darkColor })
        y -= 16
      }
      y -= 15

      // Description
      page.drawText('Description', { x: 40, y, size: 9, font: boldFont, color: grayColor })
      y -= 16
      const descLines = wrapText(petition.description, 85).slice(0, 20)
      for (const line of descLines) {
        if (y < 100) break
        page.drawText(line, { x: 40, y, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) })
        y -= 14
      }

      // Footer
      page.drawRectangle({ x: 0, y: 0, width, height: 50, color: rgb(0.97, 0.97, 0.97) })
      page.drawText(`Généré le ${new Date().toLocaleDateString('fr-TN')} — csf-tau.vercel.app`, {
        x: 40, y: 18, size: 9, font: regularFont, color: grayColor,
      })

      const pdfBytes = await pdfDoc.save()

      // Upload to Supabase storage
      const filename = `petitions/${petition.id}/petition-${Date.now()}.pdf`
      const { data: uploadData, error } = await this.supabase.getAdminClient()
        .storage.from('documents')
        .upload(filename, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true })

      if (error) {
        console.error('PDF upload error:', error)
        return null
      }

      const { data: { publicUrl } } = this.supabase.getAdminClient()
        .storage.from('documents')
        .getPublicUrl(filename)

      return publicUrl
    } catch (err) {
      console.error('PDF generation error:', err)
      return null
    }
  }

  // ─── FEED POSTS ───────────────────────────────────────────────

  private async createFeedPost(petition: any, userId: string) {
    try {
      await this.db.from('feed_posts').insert({
        post_type: 'petition',
        content: petition.objective,
        ref_id: petition.id,
        ref_title: petition.title,
        ref_cover: petition.cover_url,
        user_id: userId,
        author_type: petition.author_type,
        author_id: petition.author_id,
      })
    } catch (err) {
      console.error('Failed to create feed post for petition:', err)
    }
  }

  private async createSignatureFeedPost(petition: any, userId: string) {
    try {
      const { data: profile } = await this.db
        .from('profiles').select('full_name').eq('id', userId).single()
      await this.db.from('feed_posts').insert({
        post_type: 'post',
        content: `✍️ Je viens de signer la pétition "${petition.title}" — rejoignez-moi !`,
        ref_id: petition.id,
        user_id: userId,
        author_type: 'user',
        author_id: userId,
      })
    } catch (err) {
      console.error('Failed to create signature feed post:', err)
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────

  private async requireAuthor(petitionId: string, userId: string) {
    const { data } = await this.db
      .from('petitions').select('author_type, author_id').eq('id', petitionId).single()
    if (!data) throw new NotFoundException('Petition not found')

    if (data.author_type === 'user') {
      if (data.author_id !== userId) throw new ForbiddenException('Not authorized')
    } else {
      const { data: member } = await this.db
        .from('organization_members')
        .select('role')
        .eq('organization_id', data.author_id)
        .eq('user_id', userId)
        .single()
      if (!member || !['admin', 'owner', 'manager'].includes(member.role)) {
        throw new ForbiddenException('Not authorized')
      }
    }
  }

  private async enrichWithAuthor(petition: any) {
    if (petition.author_type === 'user') {
      const { data } = await this.db
        .from('profiles').select('id, full_name, avatar_url').eq('id', petition.author_id).single()
      return { ...petition, author: data }
    } else {
      const { data } = await this.db
        .from('organizations').select('id, name, logo_url').eq('id', petition.author_id).single()
      return { ...petition, author: data }
    }
  }
}

// ─── UTILITY ──────────────────────────────────────────────────
function wrapText(text: string, maxChars: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines
}