import { Injectable, BadRequestException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CompressionService } from '../compression/compression.service'

export enum UploadBucket {
  AVATARS           = 'avatars',
  LOGOS             = 'logos',
  POST_IMAGES       = 'post-images',
  POST_FILES        = 'post-files',
  PUBLICATIONS      = 'publications',
  COVERS            = 'covers',
  VERIFICATION_DOCS = 'verification-docs',
  PLATFORM_ASSETS   = 'platform-assets',
}

// Buckets configured as private (public: false) in Supabase storage
// getPublicUrl() does NOT work for these — must use signed URLs
const PRIVATE_BUCKETS: string[] = [UploadBucket.VERIFICATION_DOCS]

@Injectable()
export class UploadsService {
  constructor(
    private supabase: SupabaseService,
    private compression: CompressionService,
  ) {}

  async uploadFile(
    bucket: UploadBucket,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    userId: string,
    options?: { skipCompression?: boolean },
  ): Promise<{ url: string; originalSize: number; finalSize: number; savedPercent: number }> {
    const db = this.supabase.getAdminClient()
    const originalSize = fileBuffer.length

    let finalBuffer = fileBuffer
    let savedPercent = 0

    if (!options?.skipCompression) {
      const result = await this.compression.compress(fileBuffer, mimeType, fileName)
      finalBuffer  = result.buffer
      savedPercent = result.savedPercent
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${userId}/${Date.now()}-${safeName}`

    const { error } = await db.storage
      .from(bucket)
      .upload(filePath, finalBuffer, { contentType: mimeType, upsert: false })

    if (error) throw new BadRequestException(`Upload failed: ${error.message}`)

    // Private buckets: store a path reference, generate signed URLs on demand
    // Public buckets: return a permanent public URL
    if (PRIVATE_BUCKETS.includes(bucket)) {
      return {
        url:          `storage-private://${bucket}/${filePath}`,
        originalSize,
        finalSize:    finalBuffer.length,
        savedPercent,
      }
    }

    const { data } = db.storage.from(bucket).getPublicUrl(filePath)
    return {
      url:          data.publicUrl,
      originalSize,
      finalSize:    finalBuffer.length,
      savedPercent,
    }
  }

  /**
   * Resolve any stored URL to a URL the browser can open.
   * - storage-private://bucket/path  → generates a 1-hour Supabase signed URL
   * - https://...                    → returns unchanged (already a public URL)
   */
  async resolveUrl(storedUrl: string, expiresInSeconds = 3600): Promise<string> {
    if (!storedUrl) return ''
    if (!storedUrl.startsWith('storage-private://')) return storedUrl

    const withoutScheme = storedUrl.replace('storage-private://', '')
    const firstSlash    = withoutScheme.indexOf('/')
    const bucket        = withoutScheme.substring(0, firstSlash)
    const filePath      = withoutScheme.substring(firstSlash + 1)

    const db = this.supabase.getAdminClient()
    const { data, error } = await db.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds)

    if (error || !data?.signedUrl)
      throw new BadRequestException(`Signed URL generation failed: ${error?.message}`)

    return data.signedUrl
  }

  async deleteFile(bucket: UploadBucket, fileUrl: string) {
    const db = this.supabase.getAdminClient()

    let filePath: string
    if (fileUrl.startsWith('storage-private://')) {
      const withoutScheme = fileUrl.replace('storage-private://', '')
      filePath = withoutScheme.substring(withoutScheme.indexOf('/') + 1)
    } else {
      const url = new URL(fileUrl)
      filePath  = url.pathname.split(`/storage/v1/object/public/${bucket}/`)[1]
    }

    if (!filePath) throw new BadRequestException('Invalid file URL')
    const { error } = await db.storage.from(bucket).remove([filePath])
    if (error) throw new BadRequestException(`Delete failed: ${error.message}`)
    return { message: 'File deleted' }
  }
}
