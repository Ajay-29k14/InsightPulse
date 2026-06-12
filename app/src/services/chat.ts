import api from './api';

export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  response: string;
  timestamp: string;
}

export interface ChatHistoryItem {
  role: string;
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryItem[];
}

export const chatApi = {
  sendMessage: (data: ChatMessageRequest) =>
    api.post<ChatMessageResponse>('/chat/', data),

  getHistory: () =>
    api.get<ChatHistoryResponse>('/chat/history'),

  clearHistory: () =>
    api.delete('/chat/history'),
};
