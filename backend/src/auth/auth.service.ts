import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDto, LoginDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { email, password, full_name, location, bio } = dto

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase
      .getAdminClient()
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm for now; set false in prod to require email verify
        user_metadata: { full_name },
      })

    if (authError) {
      throw new BadRequestException(authError.message)
    }

    const userId = authData.user.id

    // Create profile row (trigger also does this, but we do it explicitly for reliability)
    const { error: profileError } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email,
        location: location || null,
        bio: bio || null,
      })

    if (profileError) {
      throw new BadRequestException(profileError.message)
    }

    // Sign in to get session tokens
    const { data: sessionData, error: signInError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password })

    if (signInError) {
      throw new BadRequestException(signInError.message)
    }

    return {
      user: authData.user,
      session: sessionData.session,
    }
  }

  async login(dto: LoginDto) {
    const { email, password } = dto

    const { data, error } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password })

    if (error) {
      throw new UnauthorizedException('Invalid email or password')
    }

    // Fetch profile
    const { data: profile } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return {
      user: data.user,
      profile,
      session: data.session,
    }
  }

  async logout(accessToken: string) {
    const { error } = await this.supabase
      .getAuthenticatedClient(accessToken)
      .auth.signOut()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { message: 'Logged out successfully' }
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken })

    if (error) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    return { session: data.session }
  }

  async getMe(userId: string) {
    const { data: profile, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new UnauthorizedException('Profile not found')
    }

    return profile
  }
}
