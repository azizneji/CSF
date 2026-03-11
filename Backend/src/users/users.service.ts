import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select(`
        *,
        organization_members(
          role,
          organization:organizations(id, name, description, logo_url, category, created_at)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundException('User not found')
    }

    // Flatten organizations array for the frontend
    const organizations = (data.organization_members || [])
      .map((m: any) => ({ ...m.organization, role: m.role }))
      .filter(Boolean)

    return { ...data, organizations, organization_members: undefined }
  }

  async findAll(search?: string) {
    let query = this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id, full_name, bio, location, avatar_url, created_at')

    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getUserOrganizations(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('organization_members')
      .select(`
        role,
        joined_at,
        organization:organizations(*)
      `)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }
}