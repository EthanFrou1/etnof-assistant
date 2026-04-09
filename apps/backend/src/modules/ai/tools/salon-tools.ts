import { ToolDefinition } from '../providers/ai-provider.interface';

export const SALON_TOOLS: ToolDefinition[] = [
  {
    name: 'getAvailabilities',
    description:
      'Get available time slots for a staff member or all staff on a given date. Use this when asked about availability, free slots, or who is available.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        time: {
          type: 'string',
          description: 'Optional time in HH:mm format (e.g. "14:00"). If provided, only staff available at this exact time are returned.',
        },
        staffId: {
          type: 'string',
          description: 'Optional staff member ID. If omitted, returns availability for all staff.',
        },
        durationMin: {
          type: 'number',
          description: 'Duration of the service in minutes. Used to check if a slot is long enough.',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'createAppointment',
    description:
      'Create a new appointment. Use this when the user explicitly asks to book or schedule an appointment.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
        staffId: { type: 'string', description: 'Staff member ID' },
        serviceNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of service names (e.g. ["Coupe femme", "Brushing"])',
        },
        startsAt: {
          type: 'string',
          description: 'Start datetime in ISO 8601 format',
        },
        notes: { type: 'string', description: 'Optional notes' },
      },
      required: ['clientId', 'staffId', 'serviceNames', 'startsAt'],
    },
  },
  {
    name: 'cancelAppointment',
    description: 'Cancel an existing appointment by ID.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ID to cancel' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'getAppointments',
    description:
      'Get appointments for a salon, optionally filtered by date or staff member.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        staffId: { type: 'string', description: 'Filter by staff member ID' },
        clientId: { type: 'string', description: 'Filter by client ID' },
      },
    },
  },
  {
    name: 'getServices',
    description: 'Get the list of services offered by the salon with their duration and price.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional search term to filter services' },
      },
    },
  },
  {
    name: 'findClient',
    description:
      'Search for an existing client by name or phone number.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name, phone, or email to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'createClient',
    description: 'Create a new client profile.',
    parameters: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['firstName', 'lastName'],
    },
  },
];
