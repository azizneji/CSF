import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { EnterprisesService } from './enterprises.service'
import { CreateEnterpriseDto, UpdateEnterpriseDto } from './dto/enterprise.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Enterprises')
@Controller('enterprises')
export class EnterprisesController {
  constructor(private enterprisesService: EnterprisesService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all enterprises' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sector', required: false })
  findAll(@Query('search') search?: string, @Query('sector') sector?: string) {
    return this.enterprisesService.findAll(search, sector)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enterprise by ID' })
  findOne(@Param('id') id: string) {
    return this.enterprisesService.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new enterprise' })
  create(@CurrentUser() user: any, @Body() dto: CreateEnterpriseDto) {
    return this.enterprisesService.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update enterprise (owner only)' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateEnterpriseDto) {
    return this.enterprisesService.update(id, user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete enterprise (owner only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.enterprisesService.delete(id, user.id)
  }
}
