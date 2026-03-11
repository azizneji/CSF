import { IsString, IsOptional, IsEnum, IsArray, IsUUID, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum ReactionType {
  LIKE      = 'like',       // ❤️ J'aime
  SUPPORT   = 'support',    // 🌱 Soutien
  INSPIRING = 'inspiring',  // 💪 Inspirant
  SOLIDARITY= 'solidarity', // 🤝 Solidaire
  INNOVATIVE= 'innovative', // 💡 Innovant
}

export enum AuthorType {
  USER         = 'user',
  ORGANIZATION = 'organization',
  ENTERPRISE   = 'enterprise',
}

export class CreatePostDto {
  @ApiProperty({ example: 'Notre nouvelle campagne de sensibilisation est lancée !' })
  @IsString()
  @MinLength(1)
  content: string

  @ApiProperty({ enum: AuthorType })
  @IsEnum(AuthorType)
  author_type: AuthorType

  @ApiProperty({ description: 'ID of the author (user, org, or enterprise)' })
  @IsUUID()
  author_id: string

  @ApiProperty({ type: [String], required: false, description: 'Array of image URLs' })
  @IsArray()
  @IsOptional()
  images?: string[]

  @ApiProperty({ type: [String], required: false, description: 'Array of file URLs' })
  @IsArray()
  @IsOptional()
  files?: string[]
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Bravo pour cette initiative !' })
  @IsString()
  @MinLength(1)
  content: string

  @ApiProperty({ enum: AuthorType })
  @IsEnum(AuthorType)
  author_type: AuthorType

  @ApiProperty()
  @IsUUID()
  author_id: string
}

export class CreateReactionDto {
  @ApiProperty({ enum: ReactionType })
  @IsEnum(ReactionType)
  type: ReactionType

  @ApiProperty()
  @IsUUID()
  user_id: string
}
