import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(salonId: string) {
    return this.prisma.staff.findMany({
      where: { salonId, isActive: true },
      include: {
        services: { include: { service: true } },
        availability: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        availability: true,
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const { serviceIds, ...data } = dto;
    return this.prisma.staff.create({
      data: {
        ...data,
        services: serviceIds
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
      include: { services: { include: { service: true } } },
    });
  }

  async update(id: string, dto: Partial<CreateStaffDto>) {
    await this.findOne(id);
    const { serviceIds, ...data } = dto;
    return this.prisma.staff.update({
      where: { id },
      data,
    });
  }

  async getAvailability(staffId: string, date: string, tzOffset = '+00:00', durationMin = 0, requestedTime?: string) {
    const staff = await this.findOne(staffId);
    const targetDate = new Date(`${date}T00:00:00${tzOffset}`);
    const dayOfWeek = targetDate.getDay();

    const workSlots = staff.availability.filter(
      (a) => a.dayOfWeek === dayOfWeek && a.isActive,
    );

    if (workSlots.length === 0) {
      return {
        staffId,
        name: `${staff.firstName} ${staff.lastName}`,
        date,
        worksThisDay: false,
        freeSlots: [],
        bookedSlots: [],
      };
    }

    const dayStart = new Date(`${date}T00:00:00${tzOffset}`);
    const dayEnd = new Date(`${date}T23:59:59${tzOffset}`);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        staffId,
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED'] },
      },
      include: { client: true, services: { include: { service: true } } },
      orderBy: { startsAt: 'asc' },
    });

    // Compute free slots by subtracting booked time from work schedule
    const freeSlots: { from: string; to: string }[] = [];
    for (const slot of workSlots) {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      let cursor = sh * 60 + sm;
      const end = eh * 60 + em;

      for (const apt of appointments) {
        const aptStart = toLocalMinutes(apt.startsAt, tzOffset);
        const aptEnd = toLocalMinutes(apt.endsAt, tzOffset);
        if (aptStart > cursor) {
          freeSlots.push({ from: minsToTime(cursor), to: minsToTime(aptStart) });
        }
        cursor = Math.max(cursor, aptEnd);
      }
      if (cursor < end) {
        freeSlots.push({ from: minsToTime(cursor), to: minsToTime(end) });
      }
    }

    // Filter slots that can accommodate the requested duration
    const availableSlots = durationMin > 0
      ? freeSlots.filter((s) => {
          const [fh, fm] = s.from.split(':').map(Number);
          const [th, tm] = s.to.split(':').map(Number);
          return (th * 60 + tm) - (fh * 60 + fm) >= durationMin;
        })
      : freeSlots;

    // Check if staff is available at a specific requested time
    let availableAtRequestedTime: boolean | undefined;
    if (requestedTime) {
      const [rh, rm] = requestedTime.split(':').map(Number);
      const requestedMins = rh * 60 + rm;
      availableAtRequestedTime = freeSlots.some((s) => {
        const [fh, fm] = s.from.split(':').map(Number);
        const [th, tm] = s.to.split(':').map(Number);
        const slotStart = fh * 60 + fm;
        const slotEnd = th * 60 + tm;
        return requestedMins >= slotStart && (requestedMins + Math.max(durationMin, 1)) <= slotEnd;
      });
    }

    return {
      staffId,
      name: `${staff.firstName} ${staff.lastName}`,
      color: staff.color,
      date,
      worksThisDay: true,
      workHours: workSlots.map((s) => `${s.startTime}-${s.endTime}`),
      ...(requestedTime !== undefined && { availableAt: availableAtRequestedTime }),
      freeSlots: availableSlots,
      bookedSlots: appointments.map((a) => ({
        from: minsToTime(toLocalMinutes(a.startsAt, tzOffset)),
        to: minsToTime(toLocalMinutes(a.endsAt, tzOffset)),
        client: `${a.client.firstName} ${a.client.lastName}`,
      })),
    };
  }
}

function toLocalMinutes(date: Date, tzOffset: string): number {
  const sign = tzOffset.startsWith('-') ? -1 : 1;
  const [h, m] = tzOffset.slice(1).split(':').map(Number);
  const offsetMin = sign * (h * 60 + m);
  const local = new Date(date.getTime() + offsetMin * 60000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
