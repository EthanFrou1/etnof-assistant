import { apiClient } from './client';

export const staffApi = {
  list: (salonId: string) =>
    apiClient.get('/staff', { params: { salonId } }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get(`/staff/${id}`).then((r) => r.data.data),

  getAvailability: (id: string, date: string) =>
    apiClient.get(`/staff/${id}/availability`, { params: { date } }).then((r) => r.data.data),

  create: (payload: {
    firstName: string;
    lastName: string;
    salonId: string;
    email?: string;
    phone?: string;
    color?: string;
    serviceIds?: string[];
  }) => apiClient.post('/staff', payload).then((r) => r.data.data),

  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/staff/${id}`, payload).then((r) => r.data.data),
};
