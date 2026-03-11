import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  APPROVAL = 'approval',
  HIDDEN = 'hidden',
}

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string

  @ApiPropertyOptional({ enum: GroupVisibility })
  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility = GroupVisibility.PUBLIC

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  post_approval?: boolean = false
}

export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string

  @ApiPropertyOptional({ enum: GroupVisibility })
  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  post_approval?: boolean
}

export class CreateGroupPostDto {
  @ApiProperty()
  @IsString()
  content: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_url?: string
}

export class CreateGroupMessageDto {
  @ApiProperty()
  @IsString()
  content: string
}

export class InviteUserDto {
  @ApiProperty()
  @IsUUID()
  user_id: string
}

export class RespondJoinRequestDto {
  @ApiProperty({ enum: ['accepted', 'rejected'] })
  @IsEnum(['accepted', 'rejected'])
  action: 'accepted' | 'rejected'
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['admin', 'member'] })
  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member'
}
