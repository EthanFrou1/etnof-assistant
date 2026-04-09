import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveSalonId } from '../../common/utils/resolve-salon-id';

@ApiTags('staff')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List staff for a salon' })
  @ApiQuery({ name: 'salonId', required: false, description: 'SUPER_ADMIN only. Other roles use their JWT salonId.' })
  findAll(@CurrentUser() user: any, @Query('salonId') salonId?: string) {
    const resolvedSalonId = resolveSalonId(user, salonId);
    return this.staffService.findAll(resolvedSalonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get staff availability & appointments for a given date' })
  @ApiQuery({ name: 'date', required: true, example: '2025-06-10' })
  getAvailability(@Param('id') id: string, @Query('date') date: string) {
    return this.staffService.getAvailability(id, date);
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff member' })
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateStaffDto>) {
    return this.staffService.update(id, dto);
  }
}
