import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveSalonId } from '../../common/utils/resolve-salon-id';

@ApiTags('services')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List services for a salon' })
  @ApiQuery({ name: 'salonId', required: false, description: 'SUPER_ADMIN only. Other roles use their JWT salonId.' })
  findAll(@CurrentUser() user: any, @Query('salonId') salonId?: string) {
    const resolvedSalonId = resolveSalonId(user, salonId);
    return this.servicesService.findAll(resolvedSalonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a service' })
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    const resolvedSalonId = resolveSalonId(user, dto.salonId);
    return this.servicesService.create({ ...dto, salonId: resolvedSalonId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateServiceDto>) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a service' })
  deactivate(@Param('id') id: string) {
    return this.servicesService.deactivate(id);
  }
}
