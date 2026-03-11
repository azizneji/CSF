// ─── Auth ────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface AuthResponse {
  user: AuthUser
  profile: Profile
  session: Session
}

// ─── Profile ─────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  bio?: string
  location?: string
  avatar_url?: string
  phone?: string
  website?: string
  job_title?: string
  interests?: string[]
  skills?: string[]
  role: 'user' | 'moderator' | 'superadmin'
  is_verified?: boolean
  is_suspended?: boolean
  created_at: string
  updated_at: string
}

// ─── Organization ─────────────────────────────────────────────
export type OrgCategory = 'ngo' | 'association' | 'foundation' | 'collective' | 'other'

export interface Organization {
  id: string
  name: string
  description: string
  category: OrgCategory
  location?: string
  website?: string
  logo_url?: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  members?: OrgMember[]
  members_count?: { count: number }[]
}

export interface OrgMember {
  role: 'admin' | 'manager' | 'member'
  joined_at: string
  user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

// ─── Enterprise ───────────────────────────────────────────────
export type EnterpriseSector = 'tech' | 'finance' | 'energy' | 'health' | 'education' | 'agriculture' | 'retail' | 'manufacturing' | 'services' | 'other'
export type EnterpriseSize = 'startup' | 'sme' | 'large' | 'multinational'

export interface Enterprise {
  id: string
  name: string
  description: string
  sector: EnterpriseSector
  size: EnterpriseSize
  location?: string
  website?: string
  logo_url?: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

// ─── Connection ───────────────────────────────────────────────
export type ActorType = 'user' | 'organization' | 'enterprise'
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'

export interface Connection {
  id: string
  requester_type: ActorType
  requester_id: string
  target_type: ActorType
  target_id: string
  status: ConnectionStatus
  created_at: string
  updated_at: string
}

// ─── API ──────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
