import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2025-06-10T14:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    example: '2025-06-10T14:30:00.000Z',
    required: false,
    description: 'If omitted, computed from the total duration of the provided services.',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty()
  @IsString()
  salonId: string;

  @ApiProperty()
  @IsString()
  staffId: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  serviceIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
