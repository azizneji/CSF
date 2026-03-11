import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { OpportunitiesService } from './opportunities.service'
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private service: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all opportunities' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return this.service.findAll(type, search, page ? +page : 1)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a new opportunity' })
  create(@CurrentUser() user: any, @Body() dto: CreateOpportunityDto) {
    return this.service.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an opportunity' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateOpportunityDto) {
    return this.service.update(id, user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an opportunity' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id)
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to an opportunity' })
  apply(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('message') message?: string,
  ) {
    return this.service.apply(id, user.id, message)
  }

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get applications for an opportunity (owner only)' })
  getApplications(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getApplications(id, user.id)
  }
}
