import { apiClient } from './client';

export const servicesApi = {
  list: (salonId: string) =>
    apiClient.get('/services', { params: { salonId } }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get(`/services/${id}`).then((r) => r.data.data),

  create: (payload: {
    name: string;
    durationMin: number;
    price: number;
    salonId: string;
    description?: string;
  }) => apiClient.post('/services', payload).then((r) => r.data.data),

  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/services/${id}`, payload).then((r) => r.data.data),

  deactivate: (id: string) =>
    apiClient.delete(`/services/${id}`).then((r) => r.data.data),
};
