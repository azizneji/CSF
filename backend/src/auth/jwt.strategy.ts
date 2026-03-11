import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../supabase/supabase.service'
import { passportJwtSecret } from 'jwks-rsa'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    const supabaseUrl = config.get('SUPABASE_URL')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256', 'RS256'],
    })
  }

  async validate(payload: any) {
    const { data: profile, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single()

    if (error || !profile) {
      throw new UnauthorizedException('User profile not found')
    }

    return {
      id: payload.sub,
      email: payload.email,
      profile,
    }
  }
}