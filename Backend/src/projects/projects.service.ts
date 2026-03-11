import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ProjectsService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  async create(userId: string, dto: any) {
    const { data: mem } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', dto.organization_id)
      .eq('user_id', userId)
      .single()

    if (!mem || !['admin', 'manager'].includes(mem.role)) {
      throw new ForbiddenException('Org admin/manager only')
    }

    const { data, error } = await this.db()
      .from('projects')
      .insert({ ...dto, created_by: userId })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async findByOrg(orgId: string, status?: string) {
    let query = this.db()
      .from('projects')
      .select(`
        *,
        activities:activities!project_id(
          id, title, type, start_date, cover_url, location
        )
      `)
      .eq('organization_id', orgId)

    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.db()
      .from('projects')
      .select(`
        *,
        organization:organizations!organization_id(id, name, logo_url),
        activities:activities!project_id(
          id, title, type, start_date, end_date, cover_url, location, description
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Project not found')
    return data
  }

  async update(id: string, userId: string, dto: any) {
    await this.checkAccess(id, userId)
    const { data, error } = await this.db()
      .from('projects')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(id: string, userId: string) {
    await this.checkAccess(id, userId)
    await this.db().from('projects').delete().eq('id', id)
    return { message: 'Project deleted' }
  }

  async linkActivity(projectId: string, activityId: string, userId: string) {
    await this.checkAccess(projectId, userId)
    const { error } = await this.db()
      .from('activities')
      .update({ project_id: projectId })
      .eq('id', activityId)
    if (error) throw new BadRequestException(error.message)
    return { message: 'Activity linked to project' }
  }

  private async checkAccess(projectId: string, userId: string) {
    const { data: project } = await this.db()
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()
    if (!project) throw new NotFoundException('Project not found')

    const { data: mem } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .single()
    if (!mem || !['admin', 'manager'].includes(mem.role)) throw new ForbiddenException('Not authorized')
  }
}
