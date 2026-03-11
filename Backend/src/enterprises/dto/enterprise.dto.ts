import { IsString, IsOptional, IsUrl, IsEnum, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum EnterpriseSize {
  STARTUP = 'startup',
  SME = 'sme',
  LARGE = 'large',
  MULTINATIONAL = 'multinational',
}

export enum EnterpriseSector {
  TECH = 'tech',
  FINANCE = 'finance',
  ENERGY = 'energy',
  HEALTH = 'health',
  EDUCATION = 'education',
  AGRICULTURE = 'agriculture',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  SERVICES = 'services',
  OTHER = 'other',
}

export class CreateEnterpriseDto {
  @ApiProperty({ example: 'Innovatech Tunisia' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 'Leading tech company focused on digital transformation.' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({ enum: EnterpriseSector, default: EnterpriseSector.OTHER })
  @IsEnum(EnterpriseSector)
  @IsOptional()
  sector?: EnterpriseSector

  @ApiProperty({ enum: EnterpriseSize, default: EnterpriseSize.SME })
  @IsEnum(EnterpriseSize)
  @IsOptional()
  size?: EnterpriseSize

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  website?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  logo_url?: string
}

export class UpdateEnterpriseDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ enum: EnterpriseSector, required: false })
  @IsEnum(EnterpriseSector)
  @IsOptional()
  sector?: EnterpriseSector

  @ApiProperty({ enum: EnterpriseSize, required: false })
  @IsEnum(EnterpriseSize)
  @IsOptional()
  size?: EnterpriseSize

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  website?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  logo_url?: string
}
