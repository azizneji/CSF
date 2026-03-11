import { Module } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { OrganizationsController } from './organizations.controller'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}