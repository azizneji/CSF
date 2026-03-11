import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import { CreatePublicationDto, UpdatePublicationDto } from './dto/knowledge.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Knowledge Base')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private service: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all publications' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'author_type', required: false })
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('author_type') authorType?: string,
    @Query('page') page?: number,
  ) {
    return this.service.findAll(category, search, authorType, page ? +page : 1)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publication by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new document' })
  create(@CurrentUser() user: any, @Body() dto: CreatePublicationDto) {
    return this.service.create(user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a publication' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdatePublicationDto) {
    return this.service.update(id, user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a publication' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id)
  }
}
