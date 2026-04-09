import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.salon.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');
    return salon;
  }

  async create(dto: CreateSalonDto) {
    const existing = await this.prisma.salon.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already in use');
    return this.prisma.salon.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateSalonDto>) {
    await this.findOne(id);
    return this.prisma.salon.update({ where: { id }, data: dto });
  }
}
