// support.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SupportService } from './support.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SuperadminGuard } from '../common/guards/superadmin.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a support ticket (public)' })
  create(
    @Body() body: { category: string; subject: string; message: string; email: string },
    @CurrentUser() user?: any,
  ) {
    return this.supportService.createTicket({ ...body, user_id: user?.id })
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List support tickets (superadmin)' })
  getAll(@Query('status') status?: string) {
    return this.supportService.getTickets(status)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status/note (superadmin)' })
  update(
    @Param('id') id: string,
    @Body() body: { status?: string; admin_note?: string },
  ) {
    return this.supportService.updateTicket(id, body)
  }
}
