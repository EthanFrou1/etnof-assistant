// Shared API types used by both frontend and backend consumers

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Domain types (mirror of Prisma models — source of truth stays in schema.prisma)

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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  salonId: string | null;
  isActive: boolean;
  createdAt: string;
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
