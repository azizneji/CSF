import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'

@Module({
  providers:   [NotificationsService],
  controllers: [NotificationsController],
  exports:     [NotificationsService],   // ← exported so other modules can inject it
})
export class NotificationsModule {}
