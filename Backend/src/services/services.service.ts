// services.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ServicesService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: any) {
    const { data, error } = await this.db()
      .from('free_services')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async findAll(category?: string, search?: string) {
    let query = this.db()
      .from('free_services')
      .select(`
        *,
        organization:organizations!organization_id(id, name, logo_url)
      `)
      .eq('is_active', true)

    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('title', `%${search}%`)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('free_services')
      .select(`*, organization:organizations!organization_id(id, name, logo_url)`)
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundException('Service not found')
    return data
  }

  async update(id: string, userId: string, dto: any) {
    const { data: svc } = await this.db().from('free_services').select('created_by').eq('id', id).single()
    if (!svc) throw new NotFoundException()
    if (svc.created_by !== userId) throw new ForbiddenException()
    const { data, error } = await this.db().from('free_services').update(dto).eq('id', id).select().single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    const { data: svc } = await this.db().from('free_services').select('created_by').eq('id', id).single()
    if (!svc) throw new NotFoundException()
    if (svc.created_by !== userId) throw new ForbiddenException()
    await this.db().from('free_services').delete().eq('id', id)
    return { message: 'Service deleted' }
  }
}
