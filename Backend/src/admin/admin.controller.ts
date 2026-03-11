import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SuperadminGuard } from '../common/guards/superadmin.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperadminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics' })
  getStats() { return this.admin.getStats() }

  // ─── Users ────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: number,
  ) { return this.admin.getUsers(search, role, page ? +page : 1) }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role/status' })
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateUser(id, body)
  }

  @Post('users/:id/impersonate')
  @ApiOperation({ summary: 'Impersonate a user (generates magic link)' })
  impersonate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.admin.impersonateUser(id, user.id)
  }

  @Post('users/bulk-create')
  @ApiOperation({ summary: 'Bulk create users from array' })
  bulkCreate(@Body() body: { users: any[] }, @CurrentUser() user: any) {
    return this.admin.bulkCreateUsers(body.users, user.id)
  }

  // ─── Organizations ────────────────────────────────────────────

  @Get('organizations')
  @ApiOperation({ summary: 'List all organizations' })
  getOrgs(
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) { return this.admin.getOrganizations(search, page ? +page : 1) }

  @Delete('organizations/:id')
  @ApiOperation({ summary: 'Delete an organization' })
  deleteOrg(@Param('id') id: string, @CurrentUser() user: any) {
    return this.admin.deleteOrganization(id, user.id)
  }

  // ─── Verification ─────────────────────────────────────────────

  @Get('verifications')
  @ApiOperation({ summary: 'List verification requests' })
  getVerifications(@Query('status') status?: string) {
    return this.admin.getVerificationRequests(status)
  }

  @Patch('verifications/:id')
  @ApiOperation({ summary: 'Approve or reject verification' })
  reviewVerification(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { status: 'approved' | 'rejected'; note?: string },
  ) { return this.admin.reviewVerification(id, user.id, body.status, body.note) }

  // ─── Settings ─────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings' })
  getSettings() { return this.admin.getSettings() }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings' })
  updateSettings(@Body() body: Record<string, string>, @CurrentUser() user: any) {
    return this.admin.updateSettings(body, user.id)
  }

  // ─── Content ──────────────────────────────────────────────────

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete any post' })
  deletePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.admin.deletePost(id, user.id)
  }

  // ─── Logs ─────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Admin activity logs' })
  getLogs(@Query('page') page?: number) {
    return this.admin.getLogs(page ? +page : 1)
  }
}
