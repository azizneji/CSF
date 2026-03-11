import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { PetitionsService } from './petitions.service'
import {
  CreatePetitionDto, UpdatePetitionDto, SignPetitionDto, AddPetitionUpdateDto,
} from './dto/petitions.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'

@ApiTags('Petitions')
@Controller('petitions')
export class PetitionsController {
  constructor(private petitionsService: PetitionsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Browse petitions' })
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return this.petitionsService.findAll({ status, search, page })
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get petition by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.petitionsService.findById(id, req.user?.id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a petition' })
  create(@Request() req: any, @Body() dto: CreatePetitionDto) {
    return this.petitionsService.create(req.user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a petition' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdatePetitionDto) {
    return this.petitionsService.update(id, req.user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a petition' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.petitionsService.delete(id, req.user.id)
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a petition manually' })
  close(@Param('id') id: string, @Request() req: any) {
    return this.petitionsService.close(id, req.user.id)
  }

  @Post(':id/sign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign a petition' })
  sign(@Param('id') id: string, @Request() req: any, @Body() dto: SignPetitionDto) {
    return this.petitionsService.sign(id, req.user.id, dto)
  }

  @Delete(':id/sign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove signature' })
  unsign(@Param('id') id: string, @Request() req: any) {
    return this.petitionsService.unsign(id, req.user.id)
  }

  @Get(':id/signatures')
  @ApiOperation({ summary: 'Get signatures list' })
  getSignatures(@Param('id') id: string, @Query('page') page?: number) {
    return this.petitionsService.getSignatures(id, page)
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add update to petition' })
  addUpdate(@Param('id') id: string, @Request() req: any, @Body() dto: AddPetitionUpdateDto) {
    return this.petitionsService.addUpdate(id, req.user.id, dto)
  }

  @Post('cron/close-expired')
  @ApiOperation({ summary: 'Cron: close expired petitions' })
  closeExpired() {
    return this.petitionsService.closeExpiredPetitions()
  }
}
