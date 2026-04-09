import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const aiApi = {
  chat: (payload: {
    salonId: string;
    messages: ChatMessage[];
    sessionId?: string;
  }) => apiClient.post<{ data: { content: string; sessionId?: string } }>('/ai/chat', payload)
      .then((r) => r.data.data),
};
