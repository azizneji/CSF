import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { GroupsService } from './groups.service'
import {
  CreateGroupDto, UpdateGroupDto, CreateGroupPostDto,
  CreateGroupMessageDto, InviteUserDto, RespondJoinRequestDto, UpdateMemberRoleDto,
} from './dto/groups.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard'

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  // ─── GROUPS ─────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Browse public groups' })
  findAll(@Request() req: any, @Query('search') search?: string) {
    return this.groupsService.findAll(req.user?.id, search)
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my groups' })
  findMyGroups(@Request() req: any) {
    return this.groupsService.findMyGroups(req.user.id)
  }

  @Get('invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my pending invites' })
  getMyInvites(@Request() req: any) {
    return this.groupsService.getMyInvites(req.user.id)
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get group by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.findById(id, req.user?.id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a group' })
  create(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update group settings' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, req.user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete group (owner only)' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.delete(id, req.user.id)
  }

  // ─── MEMBERSHIP ─────────────────────────────────────────────

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a group or request to join' })
  join(@Param('id') id: string, @Request() req: any, @Body('message') message?: string) {
    return this.groupsService.join(id, req.user.id, message)
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a group' })
  leave(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.leave(id, req.user.id)
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group members' })
  getMembers(@Param('id') id: string) {
    return this.groupsService.getMembers(id)
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role (owner only)' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(id, userId, req.user.id, dto)
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kick a member (admin/owner)' })
  kickMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.groupsService.kickMember(id, userId, req.user.id)
  }

  // ─── JOIN REQUESTS ──────────────────────────────────────────

  @Get(':id/join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending join requests (admin/owner)' })
  getJoinRequests(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getJoinRequests(id, req.user.id)
  }

  @Patch(':id/join-requests/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject join request' })
  respondJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Request() req: any,
    @Body() dto: RespondJoinRequestDto,
  ) {
    return this.groupsService.respondJoinRequest(id, requestId, req.user.id, dto)
  }

  // ─── INVITES ────────────────────────────────────────────────

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a user to the group' })
  invite(@Param('id') id: string, @Request() req: any, @Body() dto: InviteUserDto) {
    return this.groupsService.invite(id, req.user.id, dto)
  }

  @Post(':id/invites/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or reject an invite' })
  respondInvite(
    @Param('id') id: string,
    @Request() req: any,
    @Body('action') action: 'accepted' | 'rejected',
  ) {
    return this.groupsService.respondInvite(id, req.user.id, action)
  }

  // ─── POSTS ──────────────────────────────────────────────────

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group feed (members only)' })
  getPosts(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getPosts(id, req.user.id)
  }

  @Get(':id/posts/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending posts (admin/owner)' })
  getPendingPosts(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getPendingPosts(id, req.user.id)
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post in the group' })
  createPost(@Param('id') id: string, @Request() req: any, @Body() dto: CreateGroupPostDto) {
    return this.groupsService.createPost(id, req.user.id, dto)
  }

  @Patch(':id/posts/:postId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a pending post' })
  approvePost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Request() req: any,
    @Body('action') action: 'approved' | 'rejected',
  ) {
    return this.groupsService.approvePost(id, postId, req.user.id, action)
  }

  @Delete(':id/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(@Param('id') id: string, @Param('postId') postId: string, @Request() req: any) {
    return this.groupsService.deletePost(id, postId, req.user.id)
  }

  @Post(':id/posts/:postId/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a post' })
  reactPost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Request() req: any,
    @Body('type') type: string = 'like',
  ) {
    return this.groupsService.reactPost(id, postId, req.user.id, type)
  }

  @Post(':id/posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comment on a post' })
  commentPost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Request() req: any,
    @Body('content') content: string,
  ) {
    return this.groupsService.commentPost(id, postId, req.user.id, content)
  }

  // ─── MESSAGES (chat) ────────────────────────────────────────

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get group chat messages' })
  getMessages(@Param('id') id: string, @Request() req: any, @Query('limit') limit?: number) {
    return this.groupsService.getMessages(id, req.user.id, limit)
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in group chat' })
  sendMessage(@Param('id') id: string, @Request() req: any, @Body() dto: CreateGroupMessageDto) {
    return this.groupsService.sendMessage(id, req.user.id, dto)
  }
}
