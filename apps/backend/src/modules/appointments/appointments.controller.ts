import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveSalonId } from '../../common/utils/resolve-salon-id';

@ApiTags('appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments for a salon' })
  @ApiQuery({ name: 'salonId', required: false, description: 'SUPER_ADMIN only. Other roles use their JWT salonId.' })
  @ApiQuery({ name: 'date', required: false, example: '2025-06-10' })
  @ApiQuery({ name: 'staffId', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('salonId') salonId?: string,
    @Query('date') date?: string,
    @Query('staffId') staffId?: string,
  ) {
    const resolvedSalonId = resolveSalonId(user, salonId);
    return this.appointmentsService.findAll(resolvedSalonId, date, staffId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an appointment' })
  create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    const resolvedSalonId = resolveSalonId(user, dto.salonId);
    return this.appointmentsService.create({ ...dto, salonId: resolvedSalonId });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(@Param('id') id: string, @Query('status') status: AppointmentStatus) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
