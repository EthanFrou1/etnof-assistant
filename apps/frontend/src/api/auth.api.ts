import { apiClient } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    salonId: string | null;
  };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', payload).then((r) => r.data.data),

  me: () =>
    apiClient.get('/auth/me').then((r) => r.data.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
};
