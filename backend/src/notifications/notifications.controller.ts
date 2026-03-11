import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SuperadminGuard } from '../common/guards/superadmin.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  getMyNotifications(@CurrentUser() user: any) {
    return this.service.getForUser(user.id)
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markRead(id, user.id)
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.id)
  }

  // ─── Admin broadcast ──────────────────────────────────────────
  @Post('admin/broadcast')
  @UseGuards(SuperadminGuard)
  @ApiOperation({ summary: 'Superadmin: broadcast a notification to all or specific users' })
  adminBroadcast(
    @CurrentUser() admin: any,
    @Body() body: { message: string; link?: string; user_ids?: string[] }
  ) {
    return this.service.adminBroadcast(admin.id, body.message, body.link, body.user_ids)
  }

  // ─── Cron endpoint (called by a scheduler or Supabase cron) ───
  @Post('cron/event-reminders')
  @UseGuards(SuperadminGuard)
  @ApiOperation({ summary: 'Trigger event reminder notifications (run every 5 min via cron)' })
  sendEventReminders() {
    return this.service.sendEventReminders()
  }
}
