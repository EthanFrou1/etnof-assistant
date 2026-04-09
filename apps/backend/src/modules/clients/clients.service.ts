import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(salonId: string, search?: string) {
    const searchConditions = search ? buildSearchConditions(search) : undefined;
    return this.prisma.client.findMany({
      where: { salonId, isActive: true, ...(searchConditions && { OR: searchConditions }) },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: { services: { include: { service: true } }, staff: true },
          orderBy: { startsAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateClientDto>) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }
}

/**
 * Builds Prisma OR conditions for a search query.
 * For multi-word queries ("Sophie Frou"), uses AND on firstName+lastName to avoid
 * false positives (e.g. "Sophie Bernard" matching a search for "Sophie Frou").
 */
function buildSearchConditions(search: string): Prisma.ClientWhereInput[] {
  const words = search.trim().split(/\s+/).filter(Boolean);
  const conditions: Prisma.ClientWhereInput[] = [
    { phone: { contains: search } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  if (words.length >= 2) {
    // Full name search: firstName AND lastName must both match
    conditions.push({
      AND: [
        { firstName: { contains: words[0], mode: 'insensitive' } },
        { lastName: { contains: words[words.length - 1], mode: 'insensitive' } },
      ],
    });
    // Also try reversed order (Frou Sophie)
    conditions.push({
      AND: [
        { firstName: { contains: words[words.length - 1], mode: 'insensitive' } },
        { lastName: { contains: words[0], mode: 'insensitive' } },
      ],
    });
  } else {
    conditions.push(
      { firstName: { contains: words[0], mode: 'insensitive' } },
      { lastName: { contains: words[0], mode: 'insensitive' } },
    );
  }

  return conditions;
}
