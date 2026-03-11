import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { ActivitiesService } from './activities.service'
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private service: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all activities' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'organization_id', required: false })
  @ApiQuery({ name: 'upcoming', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @Query('type') type?: string,
    @Query('organization_id') organizationId?: string,
    @Query('upcoming') upcoming?: string,
    @Query('page') page?: number,
  ) {
    return this.service.findAll(type, organizationId, upcoming === 'true', page ? +page : 1)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an activity (org admin/manager only)' })
  create(@CurrentUser() user: any, @Body() dto: CreateActivityDto) {
    return this.service.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an activity' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateActivityDto) {
    return this.service.update(id, user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an activity' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id)
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an activity' })
  register(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.register(id, user.id)
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get registrations (org admin/manager only)' })
  getRegistrations(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getRegistrations(id, user.id)
  }
}
