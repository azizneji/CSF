import { Module } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'
import { UploadsModule } from '../uploads/uploads.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [UploadsModule, NotificationsModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}