import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private client: SupabaseClient
  private adminClient: SupabaseClient

  constructor(private config: ConfigService) {
    // Anon client — respects RLS (for user-facing operations)
    this.client = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_ANON_KEY'),
    )

    // Admin/service-role client — bypasses RLS (for admin operations)
    this.adminClient = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_SERVICE_ROLE_KEY'),
    )
  }

  // Returns anon client (RLS active)
  getClient(): SupabaseClient {
    return this.client
  }

  // Returns admin client (RLS bypassed — use carefully)
  getAdminClient(): SupabaseClient {
    return this.adminClient
  }

  // Returns a client authenticated as the current user (for RLS-aware queries)
  getAuthenticatedClient(accessToken: string): SupabaseClient {
    return createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_ANON_KEY'),
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      },
    )
  }
}
