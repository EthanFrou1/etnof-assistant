import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateSalonDto {
  @ApiProperty({ example: 'Salon Élégance' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'salon-elegance' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, default: 'Europe/Paris' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
