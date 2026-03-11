import { Module } from '@nestjs/common'
import { VerificationService } from './verification.service'
import { VerificationController } from './verification.controller'
import { UploadsModule } from '../uploads/uploads.module'

@Module({
  imports: [UploadsModule],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}