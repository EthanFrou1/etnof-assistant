import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('salons')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all salons' })
  findAll() {
    return this.salonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a salon by ID' })
  findOne(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a salon' })
  create(@Body() dto: CreateSalonDto) {
    return this.salonsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SALON_OWNER)
  @ApiOperation({ summary: 'Update a salon' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateSalonDto>) {
    return this.salonsService.update(id, dto);
  }
}
