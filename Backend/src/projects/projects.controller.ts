import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ProjectsService } from './projects.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Get('organization/:orgId')
  @ApiOperation({ summary: 'Get all projects for an organization' })
  findByOrg(@Param('orgId') orgId: string, @Query('status') status?: string) {
    return this.service.findByOrg(orgId, status)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a project (org admin/manager)' })
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.id, body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.service.update(id, user.id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id)
  }

  @Post(':id/activities/:activityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link an activity to a project' })
  linkActivity(@Param('id') id: string, @Param('activityId') activityId: string, @CurrentUser() user: any) {
    return this.service.linkActivity(id, activityId, user.id)
  }
}
