import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { MessagingService, ActorType } from './messaging.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Messaging')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private service: MessagingService) {}

  // Get or create a conversation with another actor
  // POST /messages/conversations
  // Body: { my_type, my_id, their_type, their_id }
  @Post('conversations')
  @ApiOperation({ summary: 'Get or create a direct conversation' })
  getOrCreate(@CurrentUser() user: any, @Body() body: any) {
    return this.service.getOrCreateConversation(
      user.id,
      body.my_type as ActorType, body.my_id,
      body.their_type as ActorType, body.their_id,
    )
  }

  // List all conversations for an actor
  // GET /messages/conversations?actor_type=user&actor_id=xxx
  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for an actor' })
  listConversations(
    @CurrentUser() user: any,
    @Query('actor_type') actorType: ActorType,
    @Query('actor_id') actorId: string,
  ) {
    return this.service.getConversations(user.id, actorType, actorId)
  }

  // Get messages in a conversation
  // GET /messages/conversations/:id?actor_type=user&actor_id=xxx&page=1
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  getMessages(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Query('actor_type') actorType: ActorType,
    @Query('actor_id') actorId: string,
    @Query('page') page?: number,
  ) {
    return this.service.getMessages(user.id, actorType, actorId, conversationId, page ? +page : 1)
  }

  // Send a message
  // POST /messages/conversations/:id
  // Body: { actor_type, actor_id, content }
  @Post('conversations/:id')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Body() body: any,
  ) {
    return this.service.sendMessage(
      user.id,
      body.actor_type as ActorType, body.actor_id,
      conversationId,
      body.content,
    )
  }

  // Get unread message count for navbar badge
  // GET /messages/unread?actor_type=user&actor_id=xxx
  @Get('unread')
  @ApiOperation({ summary: 'Get total unread message count' })
  getUnread(
    @CurrentUser() user: any,
    @Query('actor_type') actorType: ActorType,
    @Query('actor_id') actorId: string,
  ) {
    return this.service.getUnreadCount(user.id, actorType, actorId)
  }
}
