import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum PetitionAuthorType {
  USER = 'user',
  ORGANIZATION = 'organization',
}

export class CreatePetitionDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsString()
  objective: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  target_institution?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string

  @ApiProperty({ enum: PetitionAuthorType })
  @IsEnum(PetitionAuthorType)
  author_type: PetitionAuthorType

  @ApiProperty()
  @IsString()
  author_id: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  goal?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string
}

export class UpdatePetitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  target_institution?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_url?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  goal?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deadline?: string
}

export class SignPetitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  share_to_feed?: boolean
}

export class AddPetitionUpdateDto {
  @ApiProperty()
  @IsString()
  content: string
}
