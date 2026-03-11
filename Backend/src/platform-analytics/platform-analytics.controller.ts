// platform-analytics.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { PlatformAnalyticsService } from './platform-analytics.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SuperadminGuard } from '../common/guards/superadmin.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Platform Analytics')
@Controller('platform-analytics')
@ApiBearerAuth()
export class PlatformAnalyticsController {
  constructor(private service: PlatformAnalyticsService) {}

  // Full dashboard — superadmin only
  @Get()
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  @ApiOperation({ summary: 'Get all platform analytics (superadmin only)' })
  getAllAnalytics() { return this.service.getAllAnalytics() }

  // Individual sections
  @Get('user-growth')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getUserGrowth() { return this.service.getUserGrowth() }

  @Get('engagement')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getEngagement() { return this.service.getUserEngagement() }

  @Get('community')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getCommunity() { return this.service.getCommunityInteraction() }

  @Get('organizations')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getOrganizations() { return this.service.getOrganizationAnalytics() }

  @Get('events')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getEvents() { return this.service.getEventAnalytics() }

  @Get('matching')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getMatching() { return this.service.getMatchingAnalytics() }

  @Get('retention')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  getRetention() { return this.service.getRetentionAnalytics() }

  // Track events — authenticated users (no superadmin needed)
  @Post('track')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track a platform event (client-side beacon)' })
  trackEvent(@Body() body: any, @CurrentUser() user: any) {
    return this.service.trackEvent({ ...body, user_id: user?.id })
  }

  @Post('session/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start or update a session' })
  startSession(@Body() body: any, @CurrentUser() user: any) {
    return this.service.trackSession({ ...body, user_id: user?.id })
  }

  @Post('session/end')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'End a session' })
  endSession(@Body() body: { session_id: string; page_count: number }) {
    return this.service.endSession(body.session_id, body.page_count || 1)
  }
}
