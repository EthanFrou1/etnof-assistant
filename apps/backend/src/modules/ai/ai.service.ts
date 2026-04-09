import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IAIProvider, ChatMessage, ToolCall } from './providers/ai-provider.interface';
import { AI_PROVIDER_TOKEN } from './ai.tokens';
import { SALON_TOOLS } from './tools/salon-tools';
import { buildSystemPrompt } from './prompts/system.prompt';
import { ChatRequestDto } from './dto/chat.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private readonly provider: IAIProvider,
    private appointmentsService: AppointmentsService,
    private clientsService: ClientsService,
    private servicesService: ServicesService,
    private staffService: StaffService,
  ) {}

  async chat(dto: ChatRequestDto): Promise<{ content: string; sessionId?: string }> {
    const [salon, aiConfig] = await Promise.all([
      this.prisma.salon.findUnique({ where: { id: dto.salonId } }),
      this.prisma.aiConfig.findUnique({ where: { salonId: dto.salonId } }),
    ]);

    if (aiConfig && !aiConfig.isEnabled) {
      return { content: 'L\'assistant IA est désactivé pour ce salon.', sessionId: dto.sessionId };
    }

    const salonName = salon?.name ?? 'Salon';
    const salonTimezone = salon?.timezone ?? 'Europe/Paris';
    const now = new Date();
    const currentDate = now.toLocaleString('fr-FR', { timeZone: salonTimezone });
    const currentIsoDate = now.toLocaleDateString('en-CA', { timeZone: salonTimezone }); // YYYY-MM-DD
    const tzOffset = getTimezoneOffset(salonTimezone, now);

    // Use salon-specific system prompt if configured, otherwise use the default
    const systemPrompt = aiConfig?.systemPrompt ?? buildSystemPrompt(salonName, currentDate, currentIsoDate, tzOffset);
    const messages: ChatMessage[] = dto.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Agentic loop — max 5 iterations to prevent infinite tool calls
    let iteration = 0;
    const MAX_ITERATIONS = 5;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      this.logger.debug(`AI loop iteration ${iteration}`);

      const response = await this.provider.complete({
        messages,
        tools: SALON_TOOLS,
        systemPrompt,
      });

      if (response.finishReason === 'stop' || !response.toolCalls.length) {
        return { content: response.content ?? '', sessionId: dto.sessionId };
      }

      // Process tool calls
      messages.push({
        role: 'assistant',
        content: response.content ?? '',
        toolCalls: response.toolCalls,
      });

      for (const toolCall of response.toolCalls) {
        const result = await this.executeTool(toolCall, dto.salonId, tzOffset);
        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });
      }
    }

    return {
      content: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
      sessionId: dto.sessionId,
    };
  }

  private async executeTool(toolCall: ToolCall, salonId: string, tzOffset = '+00:00'): Promise<unknown> {
    const args = JSON.parse(toolCall.function.arguments);
    this.logger.debug(`Executing tool: ${toolCall.function.name}`, args);

    try {
      switch (toolCall.function.name) {
        case 'getAvailabilities': {
          const durationMin: number = args.durationMin ?? 0;
          const requestedTime: string | undefined = args.time;
          if (!args.staffId) {
            const allStaff = await this.staffService.findAll(salonId);
            if (!args.date) return allStaff;
            return await Promise.all(
              allStaff.map((s) => this.staffService.getAvailability(s.id, args.date, tzOffset, durationMin, requestedTime)),
            );
          }
          return await this.staffService.getAvailability(args.staffId, args.date, tzOffset, durationMin, requestedTime);
        }

        case 'createAppointment': {
          if (!args.clientId) {
            return { error: 'clientId est obligatoire. Demande le nom du client avant de créer le rendez-vous.' };
          }
          const serviceNames: string[] = args.serviceNames ?? [];
          const services = await this.prisma.service.findMany({
            where: {
              salonId,
              isActive: true,
              OR: serviceNames.map((name) => ({ name: { contains: name, mode: 'insensitive' as const } })),
            },
            select: { id: true, name: true },
          });
          if (!services.length) {
            return { error: `Aucun service trouvé pour : ${serviceNames.join(', ')}` };
          }

          // Resolve staffId by name if not a UUID
          let staffId: string = args.staffId;
          if (staffId && !staffId.includes('-')) {
            const staff = await this.prisma.staff.findFirst({
              where: {
                salonId,
                OR: [
                  { firstName: { contains: staffId, mode: 'insensitive' } },
                  { lastName: { contains: staffId, mode: 'insensitive' } },
                ],
              },
              select: { id: true },
            });
            if (!staff) return { error: `Coiffeur introuvable : ${staffId}` };
            staffId = staff.id;
          }

          // Resolve clientId by name if not a UUID
          let clientId: string = args.clientId;
          if (clientId && !clientId.includes('-')) {
            const words = clientId.trim().split(/\s+/);
            const client = await this.prisma.client.findFirst({
              where: {
                salonId,
                AND: words.length >= 2
                  ? [
                      { firstName: { contains: words[0], mode: 'insensitive' } },
                      { lastName: { contains: words[words.length - 1], mode: 'insensitive' } },
                    ]
                  : [{ OR: [
                      { firstName: { contains: words[0], mode: 'insensitive' } },
                      { lastName: { contains: words[0], mode: 'insensitive' } },
                    ]}],
              },
              select: { id: true },
            });
            if (!client) return { error: `Client introuvable : ${clientId}` };
            clientId = client.id;
          }

          return await this.appointmentsService.create({
            salonId,
            staffId,
            clientId,
            serviceIds: services.map((s) => s.id),
            startsAt: args.startsAt,
            notes: args.notes,
          });
        }

        case 'cancelAppointment':
          return await this.appointmentsService.cancel(args.appointmentId);

        case 'getAppointments':
          return await this.appointmentsService.findAll(salonId, args.date, args.staffId);

        case 'getServices':
          return await this.servicesService.findAll(salonId);

        case 'findClient':
          return await this.clientsService.findAll(salonId, args.query);

        case 'createClient':
          return await this.clientsService.create({ ...args, salonId });

        default:
          return { error: `Unknown tool: ${toolCall.function.name}` };
      }
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolCall.function.name}`, error);
      return { error: (error as Error).message };
    }
  }
}

/** Returns the UTC offset string (e.g. "+02:00") for a given IANA timezone at a given date. */
function getTimezoneOffset(timezone: string, date: Date): string {
  const utcMs = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const tzMs = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTime();
  const diffMin = Math.round((tzMs - utcMs) / 60000);
  const sign = diffMin >= 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `${sign}${h}:${m}`;
}
