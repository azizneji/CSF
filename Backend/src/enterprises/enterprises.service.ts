import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateEnterpriseDto, UpdateEnterpriseDto } from './dto/enterprise.dto'

@Injectable()
export class EnterprisesService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateEnterpriseDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('enterprises')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return data
  }

  async findAll(search?: string, sector?: string) {
    let query = this.supabase
      .getAdminClient()
      .from('enterprises')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, avatar_url)
      `)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (sector) {
      query = query.eq('sector', sector)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('enterprises')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundException('Enterprise not found')
    }

    return data
  }

  async update(enterpriseId: string, userId: string, dto: UpdateEnterpriseDto) {
    await this.checkOwnerAccess(enterpriseId, userId)

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('enterprises')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', enterpriseId)
      .select()
      .single()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return data
  }

  async delete(enterpriseId: string, userId: string) {
    await this.checkOwnerAccess(enterpriseId, userId)

    const { error } = await this.supabase
      .getAdminClient()
      .from('enterprises')
      .delete()
      .eq('id', enterpriseId)

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { message: 'Enterprise deleted successfully' }
  }

  private async checkOwnerAccess(enterpriseId: string, userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('enterprises')
      .select('created_by')
      .eq('id', enterpriseId)
      .single()

    if (error || !data) {
      throw new NotFoundException('Enterprise not found')
    }

    if (data.created_by !== userId) {
      throw new ForbiddenException('You do not have access to this enterprise')
    }
  }
}
