import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class SearchService {
  constructor(private supabase: SupabaseService) {}

  private db() { return this.supabase.getAdminClient() }

  async search(q: string) {
    if (!q || q.trim().length < 2) return {}

    const term = q.trim()

    const [users, organizations, enterprises, activities, knowledge] = await Promise.all([
      this.searchUsers(term),
      this.searchOrganizations(term),
      this.searchEnterprises(term),
      this.searchActivities(term),
      this.searchKnowledge(term),
    ])

    return { users, organizations, enterprises, activities, knowledge }
  }

  private async searchUsers(term: string) {
    const { data } = await this.db()
      .from('profiles')
      .select('id, full_name, email, avatar_url, bio, location')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(5)
    return data || []
  }

  private async searchOrganizations(term: string) {
    const { data } = await this.db()
      .from('organizations')
      .select('id, name, logo_url, category, location, is_verified')
      .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(5)
    return data || []
  }

  private async searchEnterprises(term: string) {
    const { data } = await this.db()
      .from('enterprises')
      .select('id, name, logo_url, sector, location')
      .or(`name.ilike.%${term}%,sector.ilike.%${term}%`)
      .limit(5)
    return data || []
  }

  private async searchActivities(term: string) {
    const { data } = await this.db()
      .from('activities')
      .select('id, title, type, start_date, location, cover_url')
      .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(5)
    return data || []
  }

  private async searchKnowledge(term: string) {
    const { data } = await this.db()
      .from('publications')
      .select('id, title, category, cover_url')
      .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(5)
    return data || []
  }
}
