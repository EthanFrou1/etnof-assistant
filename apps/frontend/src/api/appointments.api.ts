import { apiClient } from './client';

export const appointmentsApi = {
  list: (params: { salonId: string; date?: string; staffId?: string }) =>
    apiClient.get('/appointments', { params }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get(`/appointments/${id}`).then((r) => r.data.data),

  create: (payload: {
    salonId: string;
    staffId: string;
    clientId: string;
    serviceIds: string[];
    startsAt: string;
    endsAt: string;
    notes?: string;
  }) => apiClient.post('/appointments', payload).then((r) => r.data.data),

  cancel: (id: string) =>
    apiClient.patch(`/appointments/${id}/cancel`).then((r) => r.data.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/appointments/${id}/status`, null, { params: { status } }).then((r) => r.data.data),
};
