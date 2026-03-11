import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ConnectionsService } from './connections.service'
import { CreateConnectionDto, UpdateConnectionDto } from './dto/connection.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Connections')
@Controller('connections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private connectionsService: ConnectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a connection request' })
  request(@Body() dto: CreateConnectionDto) {
    return this.connectionsService.requestConnection(dto)
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or reject a connection request' })
  respond(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.connectionsService.respondToConnection(id, user.id, dto)
  }

  @Get('actor/:actorId')
  @ApiOperation({ summary: 'Get all accepted connections for an actor' })
  getConnections(@Param('actorId') actorId: string) {
    return this.connectionsService.getConnectionsForActor(actorId)
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending connection requests for current user' })
  getPending(@CurrentUser() user: any) {
    return this.connectionsService.getPendingConnections(user.id)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a connection' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.connectionsService.deleteConnection(id, user.id)
  }
}
