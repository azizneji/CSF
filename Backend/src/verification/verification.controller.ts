import { Controller, Get, Post, Param, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { VerificationService } from './verification.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Verification')
@Controller('verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private service: VerificationService) {}

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get verification status for an organization' })
  getStatus(@Param('id') id: string) {
    return this.service.getOrgVerificationStatus(id)
  }

  @Post('organizations/:id/submit')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'patente', maxCount: 1 },
    { name: 'jort',    maxCount: 1 },
    { name: 'statuts', maxCount: 1 },
    { name: 'extras',  maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Submit verification request with documents and contact info' })
  @ApiConsumes('multipart/form-data')
  submitRequest(
    @Param('id') orgId: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: any,
    @Body() body: { contact_email?: string; contact_phone?: string },
  ) {
    return this.service.submitRequest(
      user.id,
      orgId,
      {
        patente: files?.patente?.[0],
        jort:    files?.jort?.[0],
        statuts: files?.statuts?.[0],
        extras:  files?.extras || [],
      },
      {
        contact_email: body?.contact_email,
        contact_phone: body?.contact_phone,
      },
    )
  }
}
