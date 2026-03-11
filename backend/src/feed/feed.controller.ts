import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { FeedService } from './feed.service'
import { CreatePostDto, CreateCommentDto, CreateReactionDto } from './dto/feed.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get the main feed (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFeed(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.feedService.getFeed(page ? +page : 1, limit ? +limit : 20)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post with reactions and comments' })
  getPost(@Param('id') id: string) {
    return this.feedService.getPostById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.feedService.createPost(user.id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feedService.deletePost(id, user.id)
  }

  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'React to a post (toggle)' })
  react(@Param('id') id: string, @Body() dto: CreateReactionDto) {
    return this.feedService.reactToPost(id, dto)
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  addComment(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    return this.feedService.addComment(id, user.id, dto)
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.feedService.deleteComment(commentId, user.id)
  }
}
