// Domain types for the frontend.
// These mirror the shapes returned by the backend API.
// Source of truth for the DB schema is apps/backend/prisma/schema.prisma.
// When @etnof/shared is properly wired into the build pipeline, import from there instead.

export type UserRole = 'SUPER_ADMIN' | 'SALON_OWNER' | 'RECEPTIONIST' | 'STAFF';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  salonId: string | null;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  color?: string;
  isActive: boolean;
  salonId: string;
  services?: Array<{ service: Service }>;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price: string;
  isActive: boolean;
  salonId: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  salonId: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string;
  salonId: string;
  staffId: string;
  clientId: string;
  staff?: Staff;
  client?: Client;
  services?: Array<{ service: Service }>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
