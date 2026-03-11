import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ example: 'Ahmed Ben Ali' })
  @IsString()
  full_name: string

  @ApiProperty({ example: 'Tunis, Tunisia', required: false })
  @IsString()
  @IsOptional()
  location?: string

  @ApiProperty({ example: 'Passionate about civic engagement', required: false })
  @IsString()
  @IsOptional()
  bio?: string
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string
}
