import { Module } from '@nestjs/common'
import { PetitionsController } from './petitions.controller'
import { PetitionsService } from './petitions.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [SupabaseModule, NotificationsModule],
  controllers: [PetitionsController],
  providers: [PetitionsService],
  exports: [PetitionsService],
})
export class PetitionsModule {}
