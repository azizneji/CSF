// support.service.ts
import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class SupportService {
  constructor(private supabase: SupabaseService) {}

  async createTicket(data: {
    category: string
    subject: string
    message: string
    email: string
    user_id?: string
  }) {
    const { data: ticket, error } = await this.supabase
      .getAdminClient()
      .from('support_tickets')
      .insert({
        category: data.category,
        subject: data.subject,
        message: data.message,
        email: data.email,
        user_id: data.user_id || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return ticket
  }

  async getTickets(status?: string) {
    let query = this.supabase
      .getAdminClient()
      .from('support_tickets')
      .select('*, user:profiles!user_id(id, full_name, email)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async updateTicket(id: string, updates: { status?: string; admin_note?: string }) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('support_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }
}
