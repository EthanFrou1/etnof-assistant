import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Leblanc' })
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty()
  @IsString()
  salonId: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  serviceIds?: string[];
}
