import { IsString, IsOptional, IsEnum, IsArray, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum PublicationCategory {
  STUDY       = 'study',        // Étude
  REPORT      = 'report',       // Rapport
  GUIDE       = 'guide',        // Guide / Manuel
  RESEARCH    = 'research',     // Recherche
  POLICY      = 'policy',       // Note de politique
  NEWSLETTER  = 'newsletter',   // Newsletter
  OTHER       = 'other',
}

export enum AuthorType {
  USER         = 'user',
  ORGANIZATION = 'organization',
  ENTERPRISE   = 'enterprise',
}

export class CreatePublicationDto {
  @ApiProperty({ example: 'État de la société civile tunisienne 2025' })
  @IsString()
  @MinLength(3)
  title: string

  @ApiProperty({ example: 'Ce rapport analyse l\'évolution du tissu associatif...' })
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty({ enum: PublicationCategory })
  @IsEnum(PublicationCategory)
  category: PublicationCategory

  @ApiProperty({ enum: AuthorType })
  @IsEnum(AuthorType)
  author_type: AuthorType

  @ApiProperty()
  @IsString()
  author_id: string

  @ApiProperty({ required: false, description: 'URL of the uploaded file (PDF, DOCX...)' })
  @IsString()
  @IsOptional()
  file_url?: string

  @ApiProperty({ required: false, description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  cover_url?: string

  @ApiProperty({ required: false, type: [String], example: ['société civile', 'Tunisie', '2025'] })
  @IsArray()
  @IsOptional()
  tags?: string[]

  @ApiProperty({ required: false, example: '2025' })
  @IsString()
  @IsOptional()
  year?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string
}

export class UpdatePublicationDto {
  @IsString() @IsOptional() title?: string
  @IsString() @IsOptional() description?: string
  @IsEnum(PublicationCategory) @IsOptional() category?: PublicationCategory
  @IsString() @IsOptional() file_url?: string
  @IsString() @IsOptional() cover_url?: string
  @IsArray() @IsOptional() tags?: string[]
  @IsString() @IsOptional() year?: string
  @IsString() @IsOptional() language?: string
}
