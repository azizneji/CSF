import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ServicesService } from './services.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Free Services')
@Controller('services')
export class ServicesController {
  constructor(private service: ServicesService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.service.findAll(category, search)
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findById(id) }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
}
