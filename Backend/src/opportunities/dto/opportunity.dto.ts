import { IsString, IsOptional, IsEnum, IsDateString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum OpportunityType {
  JOB          = 'job',           // Offre d'emploi
  CONSULTANT   = 'consultant',    // Appel à consultants
  TENDER       = 'tender',        // Appel d'offres
  VOLUNTEER    = 'volunteer',     // Bénévolat
  INTERNSHIP   = 'internship',    // Stage
  GRANT        = 'grant',         // Appel à projets / subvention
}

export enum PosterType {
  ORGANIZATION = 'organization',
  ENTERPRISE   = 'enterprise',
}

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Coordinateur de projet – Eau & Assainissement' })
  @IsString()
  @MinLength(3)
  title: string

  @ApiProperty({ example: 'Nous recherchons un coordinateur expérimenté...' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({ enum: OpportunityType })
  @IsEnum(OpportunityType)
  type: OpportunityType

  @ApiProperty({ enum: PosterType })
  @IsEnum(PosterType)
  poster_type: PosterType

  @ApiProperty({ description: 'ID of the posting org or enterprise' })
  @IsString()
  poster_id: string

  @ApiProperty({ required: false, example: 'Tunis, Tunisie' })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ required: false, example: '2026-04-30' })
  @IsDateString()
  @IsOptional()
  deadline?: string

  @ApiProperty({ required: false, example: '1500-2000 TND' })
  @IsString()
  @IsOptional()
  salary_range?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requirements?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contact_email?: string
}

export class UpdateOpportunityDto {
  @IsString() @IsOptional() title?: string
  @IsString() @IsOptional() description?: string
  @IsEnum(OpportunityType) @IsOptional() type?: OpportunityType
  @IsString() @IsOptional() location?: string
  @IsDateString() @IsOptional() deadline?: string
  @IsString() @IsOptional() salary_range?: string
  @IsString() @IsOptional() requirements?: string
  @IsString() @IsOptional() contact_email?: string
}
