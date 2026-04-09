import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
  ) {}

  async findAll(salonId: string, date?: string, staffId?: string) {
    const where: Prisma.AppointmentWhereInput = { salonId };

    if (date) {
      // Dates are stored as UTC in DB. We use ISO date boundaries.
      where.startsAt = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`),
      };
    }

    if (staffId) where.staffId = staffId;

    return this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
        staff: true,
        services: { include: { service: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        staff: true,
        services: { include: { service: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  /**
   * Creates an appointment.
   * If endsAt is not provided, it is computed from the total duration of the given services.
   */
  async create(dto: CreateAppointmentDto) {
    let endsAt = dto.endsAt;

    if (!endsAt) {
      const services = await this.prisma.service.findMany({
        where: { id: { in: dto.serviceIds } },
        select: { durationMin: true },
      });
      if (services.length === 0) {
        throw new BadRequestException('No valid services found to compute appointment duration');
      }
      const totalMin = services.reduce((acc, s) => acc + s.durationMin, 0);
      endsAt = new Date(new Date(dto.startsAt).getTime() + totalMin * 60 * 1000).toISOString();
    }

    await this.checkConflict(dto.staffId, dto.startsAt, endsAt);

    const appointment = await this.prisma.appointment.create({
      data: {
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(endsAt),
        notes: dto.notes,
        salonId: dto.salonId,
        staffId: dto.staffId,
        clientId: dto.clientId,
        services: {
          create: dto.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: {
        client: true,
        staff: true,
        services: { include: { service: true } },
      },
    });

    // Sync to Google Calendar asynchronously (don't block the response)
    this.googleCalendar.syncAppointment(appointment.id).catch(() => null);

    return appointment;
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async cancel(id: string) {
    const appointment = await this.updateStatus(id, AppointmentStatus.CANCELLED);
    this.googleCalendar.syncAppointment(id).catch(() => null);
    return appointment;
  }

  private async checkConflict(staffId: string, startsAt: string, endsAt: string) {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        staffId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
        OR: [
          {
            startsAt: { lt: new Date(endsAt) },
            endsAt: { gt: new Date(startsAt) },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Staff member already has an appointment in this time slot');
    }
  }
}

// Make endsAt optional in CreateAppointmentDto when using auto-calculation
// (the DTO still accepts it for direct API calls that know the exact time)

