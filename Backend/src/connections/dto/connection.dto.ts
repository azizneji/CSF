import { IsString, IsEnum, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum ActorType {
  USER = 'user',
  ORGANIZATION = 'organization',
  ENTERPRISE = 'enterprise',
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export class CreateConnectionDto {
  @ApiProperty({ enum: ActorType, description: 'Type of the requester' })
  @IsEnum(ActorType)
  requester_type: ActorType

  @ApiProperty({ description: 'ID of the requester (user, org, or enterprise)' })
  @IsUUID()
  requester_id: string

  @ApiProperty({ enum: ActorType, description: 'Type of the target' })
  @IsEnum(ActorType)
  target_type: ActorType

  @ApiProperty({ description: 'ID of the target (user, org, or enterprise)' })
  @IsUUID()
  target_id: string
}

export class UpdateConnectionDto {
  @ApiProperty({ enum: [ConnectionStatus.ACCEPTED, ConnectionStatus.REJECTED] })
  @IsEnum(ConnectionStatus)
  status: ConnectionStatus.ACCEPTED | ConnectionStatus.REJECTED
}
