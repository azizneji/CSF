import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { OrganizationsService } from './organizations.service'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all organizations' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'domaine', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('domaine') domaine?: string,
  ) {
    return this.orgsService.findAll(search, category, domaine)
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organizations I belong to' })
  getMine(@CurrentUser() user: any) {
    return this.orgsService.getMine(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgsService.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization (admin only)' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete organization (admin only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orgsService.delete(id, user.id)
  }

  @Post(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add member to organization (admin only)' })
  addMember(
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
    @Body('role') role?: string,
  ) {
    return this.orgsService.addMember(orgId, user.id, targetUserId, role)
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member from organization (admin only)' })
  removeMember(
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.orgsService.removeMember(orgId, user.id, targetUserId)
  }
}
