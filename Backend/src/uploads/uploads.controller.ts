import {
  Controller, Post, Get, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger'
import { UploadsService, UploadBucket } from './uploads.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { SupabaseService } from '../supabase/supabase.service'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private supabase: SupabaseService,
  ) {}

  // ─── Avatar ───────────────────────────────────────────────────
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('No file provided')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only images allowed')

    const result = await this.uploadsService.uploadFile(
      UploadBucket.AVATARS, file.originalname, file.buffer, file.mimetype, user.id,
    )
    await this.supabase.getAdminClient()
      .from('profiles')
      .update({ avatar_url: result.url })
      .eq('id', user.id)
    return { url: result.url }
  }

  // ─── Logo ─────────────────────────────────────────────────────
  @Post('logo/:entityType/:entityId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: 'Upload org or enterprise logo' })
  @ApiConsumes('multipart/form-data')
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Param('entityType') entityType: 'organization' | 'enterprise',
    @Param('entityId') entityId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No file provided')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only images allowed')

    const result = await this.uploadsService.uploadFile(
      UploadBucket.LOGOS, file.originalname, file.buffer, file.mimetype, user.id,
    )
    const table = entityType === 'organization' ? 'organizations' : 'enterprises'
    await this.supabase.getAdminClient()
      .from(table)
      .update({ logo_url: result.url })
      .eq('id', entityId)
    return { url: result.url }
  }

  // ─── Post image ───────────────────────────────────────────────
  @Post('post-image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: 'Upload image for a post' })
  @ApiConsumes('multipart/form-data')
  async uploadPostImage(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('No file provided')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only images allowed')
    const result = await this.uploadsService.uploadFile(
      UploadBucket.POST_IMAGES, file.originalname, file.buffer, file.mimetype, user.id,
    )
    return { url: result.url }
  }

  // ─── Post file ────────────────────────────────────────────────
  @Post('post-file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: 'Upload file attachment for a post' })
  @ApiConsumes('multipart/form-data')
  async uploadPostFile(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('No file provided')
    const result = await this.uploadsService.uploadFile(
      UploadBucket.POST_FILES, file.originalname, file.buffer, file.mimetype, user.id,
    )
    return { url: result.url, name: file.originalname, size: file.size, type: file.mimetype }
  }

  // ─── Publication ──────────────────────────────────────────────
  @Post('publication')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload a publication file (PDF, DOCX...)' })
  @ApiConsumes('multipart/form-data')
  async uploadPublication(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('No file provided')
    const result = await this.uploadsService.uploadFile(
      UploadBucket.PUBLICATIONS, file.originalname, file.buffer, file.mimetype, user.id,
    )
    return { url: result.url, name: file.originalname, size: file.size, type: file.mimetype }
  }

  // ─── Cover ────────────────────────────────────────────────────
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiOperation({ summary: 'Upload a cover image for activities or publications' })
  @ApiConsumes('multipart/form-data')
  async uploadCover(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('No file provided')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only images allowed')
    const result = await this.uploadsService.uploadFile(
      UploadBucket.COVERS, file.originalname, file.buffer, file.mimetype, user.id,
    )
    return { url: result.url }
  }

  // ─── Signed URL ───────────────────────────────────────────────
  // Used by admin panel to open private verification documents.
  // Requires a valid JWT. Returns a 1-hour Supabase signed URL.
  @Get('signed-url')
  @ApiOperation({ summary: 'Resolve a private storage reference to a 1-hour signed URL' })
  @ApiQuery({ name: 'ref', required: true, description: 'The storage-private:// reference from the DB' })
  async getSignedUrl(@Query('ref') ref: string) {
    if (!ref) throw new BadRequestException('ref query param is required')
    const url = await this.uploadsService.resolveUrl(decodeURIComponent(ref), 3600)
    return { url }
  }
}
