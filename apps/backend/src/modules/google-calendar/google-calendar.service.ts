import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3, Auth } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  getOAuthClient(): Auth.OAuth2Client {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(salonId: string): string {
    const oauth2Client = this.getOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: salonId,
    });
  }

  async handleCallback(code: string, salonId: string): Promise<void> {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await this.prisma.salon.update({
      where: { id: salonId },
      data: { googleRefreshToken: tokens.refresh_token ?? undefined },
    });
    this.logger.log(`Google Calendar connected for salon ${salonId}`);
  }

  async disconnect(salonId: string): Promise<void> {
    await this.prisma.salon.update({
      where: { id: salonId },
      data: { googleRefreshToken: null, googleCalendarId: null },
    });
  }

  async isConnected(salonId: string): Promise<boolean> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: { googleRefreshToken: true },
    });
    return !!salon?.googleRefreshToken;
  }

  private async getCalendar(salonId: string): Promise<{ calendar: calendar_v3.Calendar; calendarId: string } | null> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: { googleRefreshToken: true, googleCalendarId: true, name: true },
    });
    if (!salon?.googleRefreshToken) return null;

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: salon.googleRefreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create dedicated calendar for the salon if not yet done
    let calendarId = salon.googleCalendarId;
    if (!calendarId) {
      const cal = await calendar.calendars.insert({
        requestBody: { summary: salon.name, timeZone: 'Europe/Paris' },
      });
      calendarId = cal.data.id!;
      await this.prisma.salon.update({
        where: { id: salonId },
        data: { googleCalendarId: calendarId },
      });
    }

    return { calendar, calendarId };
  }

  async syncAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        staff: true,
        services: { include: { service: true } },
        salon: true,
      },
    });
    if (!appointment) return;

    const ctx = await this.getCalendar(appointment.salonId);
    if (!ctx) return;

    const { calendar, calendarId } = ctx;
    const serviceNames = appointment.services.map((s) => s.service.name).join(', ');
    const title = `${appointment.client.firstName} ${appointment.client.lastName} — ${serviceNames}`;
    const description = `Coiffeur : ${appointment.staff.firstName} ${appointment.staff.lastName}`;

    const event: calendar_v3.Schema$Event = {
      summary: title,
      description,
      start: { dateTime: appointment.startsAt.toISOString(), timeZone: appointment.salon.timezone },
      end: { dateTime: appointment.endsAt.toISOString(), timeZone: appointment.salon.timezone },
      extendedProperties: { private: { appointmentId } },
    };

    try {
      // Check if event already exists
      const existing = await calendar.events.list({
        calendarId,
        privateExtendedProperty: [`appointmentId=${appointmentId}`],
        maxResults: 1,
      });

      if (existing.data.items?.length) {
        const eventId = existing.data.items[0].id!;
        if (appointment.status === 'CANCELLED') {
          await calendar.events.delete({ calendarId, eventId });
          this.logger.log(`Deleted Google Calendar event for appointment ${appointmentId}`);
        } else {
          await calendar.events.update({ calendarId, eventId, requestBody: event });
          this.logger.log(`Updated Google Calendar event for appointment ${appointmentId}`);
        }
      } else if (appointment.status !== 'CANCELLED') {
        await calendar.events.insert({ calendarId, requestBody: event });
        this.logger.log(`Created Google Calendar event for appointment ${appointmentId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync appointment ${appointmentId} to Google Calendar`, error);
    }
  }
}
