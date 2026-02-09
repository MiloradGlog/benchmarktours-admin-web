import api from './api';
import {
  AIChatSession,
  ChatRequest,
  ChatResponse,
  ApprovalRequest,
  ApprovalResponse,
  ChatContext,
  AIConversationMessage
} from '../types/ai';

class AIService {
  async createSession(tourId?: number): Promise<{ success: boolean; sessionId: string; message: string }> {
    const response = await api.post('/ai/sessions', { tourId });
    return response.data;
  }

  async getSession(sessionId: string): Promise<{ session: AIChatSession }> {
    const response = await api.get(`/ai/sessions/${sessionId}`);
    return response.data;
  }

  async getChatHistory(sessionId: string): Promise<{ messages: AIConversationMessage[] }> {
    const response = await api.get(`/ai/sessions/${sessionId}/messages`);
    return response.data;
  }

  async sendMessage(
    sessionId: string,
    message: string,
    context?: ChatContext,
    tourId?: number
  ): Promise<ChatResponse> {
    const request: ChatRequest = {
      sessionId,
      message,
      context,
      tourId,
    };

    const response = await api.post('/ai/chat', request);
    return response.data;
  }

  async approveChanges(request: ApprovalRequest): Promise<ApprovalResponse> {
    const response = await api.post('/ai/approve', request);
    return response.data;
  }

  async endSession(sessionId: string): Promise<void> {
    const response = await api.post(`/ai/sessions/${sessionId}/end`);
    return response.data;
  }

  async getUserSessions(): Promise<{ sessions: AIChatSession[] }> {
    const response = await api.get('/ai/sessions');
    return response.data;
  }

  async getStatus(): Promise<any> {
    const response = await api.get('/ai/status');
    return response.data;
  }
}

export const aiService = new AIService();