import { apiClient } from './client';

export const clientsApi = {
  list: (params: { salonId: string; search?: string }) =>
    apiClient.get('/clients', { params }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get(`/clients/${id}`).then((r) => r.data.data),

  create: (payload: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    salonId: string;
  }) => apiClient.post('/clients', payload).then((r) => r.data.data),

  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/clients/${id}`, payload).then((r) => r.data.data),
};
