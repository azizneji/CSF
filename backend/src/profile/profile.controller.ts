import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ProfileService } from './profile.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get full profile with mini CV, posts, orgs' })
  getProfile(@Param('id') id: string) {
    return this.service.getFullProfile(id)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.service.updateProfile(user.id, body)
  }

  // ─── Experiences ──────────────────────────────────────────────

  @Post('me/experiences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addExperience(@CurrentUser() user: any, @Body() body: any) {
    return this.service.addExperience(user.id, body)
  }

  @Patch('me/experiences/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateExperience(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.updateExperience(id, user.id, body)
  }

  @Delete('me/experiences/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteExperience(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteExperience(id, user.id)
  }

  // ─── Social Links ─────────────────────────────────────────────

  @Patch('me/social-links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set social links for current user' })
  updateSocialLinks(@CurrentUser() user: any, @Body() body: { links: any[] }) {
    return this.service.upsertSocialLinks('user', user.id, body.links)
  }

  @Patch('organizations/:id/social-links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateOrgSocialLinks(@Param('id') id: string, @Body() body: { links: any[] }) {
    return this.service.upsertSocialLinks('organization', id, body.links)
  }

  @Patch('enterprises/:id/social-links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateEntSocialLinks(@Param('id') id: string, @Body() body: { links: any[] }) {
    return this.service.upsertSocialLinks('enterprise', id, body.links)
  }

  // ─── Join Requests ────────────────────────────────────────────

  @Post('organizations/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request to join an organization' })
  requestJoin(@Param('id') orgId: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.requestJoin(user.id, orgId, body.message, body.role_requested)
  }

  @Get('organizations/:id/join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending join requests (admin only)' })
  getJoinRequests(@Param('id') orgId: string, @CurrentUser() user: any) {
    return this.service.getJoinRequests(orgId, user.id)
  }

  @Patch('join-requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or reject a join request' })
  reviewRequest(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: 'accepted' | 'rejected' }) {
    return this.service.reviewJoinRequest(id, user.id, body.status)
  }
}
