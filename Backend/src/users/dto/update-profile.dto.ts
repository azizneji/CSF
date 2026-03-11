import { IsString, IsOptional, IsUrl } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  full_name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  avatar_url?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  website?: string
}
