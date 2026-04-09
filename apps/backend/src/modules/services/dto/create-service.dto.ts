import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Coupe homme' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @IsPositive()
  durationMin: number;

  @ApiProperty({ example: 25.00 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty()
  @IsString()
  salonId: string;
}
