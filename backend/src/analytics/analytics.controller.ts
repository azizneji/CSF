import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get analytics for an organization (admin/manager only)' })
  getOrgAnalytics(@Param('id') orgId: string, @CurrentUser() user: any) {
    return this.service.getOrgAnalytics(orgId, user.id)
  }
}
