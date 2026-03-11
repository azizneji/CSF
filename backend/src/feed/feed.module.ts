import { Module } from '@nestjs/common'
import { FeedService } from './feed.service'
import { FeedController } from './feed.controller'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}