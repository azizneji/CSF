import { Module } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { ActivitiesController } from './activities.controller'
import { AttendanceService } from './attendance.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  providers: [ActivitiesService, AttendanceService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}