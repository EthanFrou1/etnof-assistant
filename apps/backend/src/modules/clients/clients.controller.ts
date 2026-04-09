import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveSalonId } from '../../common/utils/resolve-salon-id';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients for a salon' })
  @ApiQuery({ name: 'salonId', required: false, description: 'SUPER_ADMIN only. Other roles use their JWT salonId.' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@CurrentUser() user: any, @Query('salonId') salonId?: string, @Query('search') search?: string) {
    const resolvedSalonId = resolveSalonId(user, salonId);
    return this.clientsService.findAll(resolvedSalonId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client with appointment history' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  create(@CurrentUser() user: any, @Body() dto: CreateClientDto) {
    const resolvedSalonId = resolveSalonId(user, dto.salonId);
    return this.clientsService.create({ ...dto, salonId: resolvedSalonId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>) {
    return this.clientsService.update(id, dto);
  }
}
