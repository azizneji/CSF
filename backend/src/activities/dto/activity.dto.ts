import { IsString, IsOptional, IsEnum, IsDateString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum ActivityType {
  TRAINING     = 'training',      // Formation
  HEALTH       = 'health',        // Caravane de santé
  CONFERENCE   = 'conference',    // Conférence
  WORKSHOP     = 'workshop',      // Atelier
  CAMPAIGN     = 'campaign',      // Campagne
  FUNDRAISER   = 'fundraiser',    // Collecte de fonds
  VOLUNTEERING = 'volunteering',  // Bénévolat
  CULTURAL     = 'cultural',      // Culturel
  SPORT        = 'sport',         // Sportif
  OTHER        = 'other',
}

export enum ActivityStatus {
  ACTIVE    = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class CreateActivityDto {
  @ApiProperty({ example: 'Formation en gestion de projet pour les associations' })
  @IsString()
  @MinLength(3)
  title: string

  @ApiProperty({ example: 'Une formation pratique de 2 jours pour renforcer les capacités...' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType

  @ApiProperty({ description: 'Organization ID that hosts this activity' })
  @IsString()
  organization_id: string

  @ApiProperty({ example: '2026-04-15T09:00:00Z' })
  @IsDateString()
  start_date: string

  @ApiProperty({ required: false, example: '2026-04-16T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  end_date?: string

  @ApiProperty({ required: false, example: 'Centre de formation, Tunis' })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ required: false, description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  cover_url?: string

  @ApiProperty({ required: false, example: '50' })
  @IsString()
  @IsOptional()
  max_participants?: string

  @ApiProperty({ required: false, example: 'Gratuit' })
  @IsString()
  @IsOptional()
  price?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  registration_link?: string
}

export class UpdateActivityDto {
  @IsString() @IsOptional() title?: string
  @IsString() @IsOptional() description?: string
  @IsEnum(ActivityType) @IsOptional() type?: ActivityType
  @IsEnum(ActivityStatus) @IsOptional() status?: ActivityStatus
  @IsDateString() @IsOptional() start_date?: string
  @IsDateString() @IsOptional() end_date?: string
  @IsString() @IsOptional() location?: string
  @IsString() @IsOptional() cover_url?: string
  @IsString() @IsOptional() max_participants?: string
  @IsString() @IsOptional() price?: string
  @IsString() @IsOptional() registration_link?: string
}