import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { UploadsService, UploadBucket } from '../uploads/uploads.service'

@Injectable()
export class VerificationService {
  constructor(
    private supabase: SupabaseService,
    private uploads: UploadsService,
  ) {}

  private db() { return this.supabase.getAdminClient() }

  async submitRequest(
    userId: string,
    orgId: string,
    files: {
      patente?: Express.Multer.File
      jort?: Express.Multer.File
      statuts?: Express.Multer.File
      extras?: Express.Multer.File[]
    },
    fields: {
      contact_email?: string
      contact_phone?: string
    } = {},
  ) {
    // Check user is admin of this org
    const { data: mem } = await this.db()
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    if (!mem || mem.role !== 'admin')
      throw new ForbiddenException('Only org admin can request verification')

    // Block if already pending
    const { data: existing } = await this.db()
      .from('verification_requests')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) throw new BadRequestException('Une demande de vérification est déjà en cours')

    // Upload documents
    const upload = async (file?: Express.Multer.File) => {
      if (!file) return null
      const res = await this.uploads.uploadFile(
        UploadBucket.VERIFICATION_DOCS,
        file.originalname, file.buffer, file.mimetype, userId,
        { skipCompression: true },
      )
      return res.url
    }

    const [patente_url, jort_url, statuts_url] = await Promise.all([
      upload(files.patente),
      upload(files.jort),
      upload(files.statuts),
    ])

    const extra_docs = files.extras
      ? await Promise.all(files.extras.map(f => upload(f)))
      : []

    // Save request
    const { data, error } = await this.db()
      .from('verification_requests')
      .insert({
        organization_id: orgId,
        submitted_by: userId,
        patente_url,
        jort_url,
        statuts_url,
        extra_docs: extra_docs.filter(Boolean),
        contact_email: fields.contact_email || null,
        contact_phone: fields.contact_phone || null,
      })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    // Update org contact fields so they're visible on the profile
    if (fields.contact_email || fields.contact_phone) {
      await this.db()
        .from('organizations')
        .update({
          ...(fields.contact_email && { email: fields.contact_email }),
          ...(fields.contact_phone && { phone: fields.contact_phone }),
        })
        .eq('id', orgId)
    }

    return data
  }

  async getOrgVerificationStatus(orgId: string) {
    const { data: org } = await this.db()
      .from('organizations')
      .select('is_verified, verified_at')
      .eq('id', orgId)
      .single()

    const { data: request } = await this.db()
      .from('verification_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return { ...org, latest_request: request || null }
  }
}
