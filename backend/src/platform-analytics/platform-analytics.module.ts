import { Module } from '@nestjs/common'
import { PlatformAnalyticsService } from './platform-analytics.service'
import { PlatformAnalyticsController } from './platform-analytics.controller'

@Module({
  providers: [PlatformAnalyticsService],
  controllers: [PlatformAnalyticsController],
  exports: [PlatformAnalyticsService],
})
export class PlatformAnalyticsModule {}
