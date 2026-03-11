import { IsString, IsOptional, IsUrl, IsEnum, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum OrgCategory {
  NGO = 'ngo',
  ASSOCIATION = 'association',
  FOUNDATION = 'foundation',
  COLLECTIVE = 'collective',
  OTHER = 'other',
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Green Tunisia Initiative' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 'We work on environmental awareness across Tunisia.' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({ enum: OrgCategory, default: OrgCategory.OTHER })
  @IsEnum(OrgCategory)
  @IsOptional()
  category?: OrgCategory

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

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ enum: OrgCategory, required: false })
  @IsEnum(OrgCategory)
  @IsOptional()
  category?: OrgCategory

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
