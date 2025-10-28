import api from './api';
import { PasswordResetRequest } from '@/types/auth';

interface CompleteResetResponse {
  setup_code: string;
  message: string;
}

interface RegenerateSetupCodeResponse {
  setup_code: string;
  expires_at: string;
  message: string;
}

export const passwordResetService = {
  // Get all password reset requests (optionally filter by status)
  getPasswordResets: async (status?: 'pending' | 'completed' | 'dismissed'): Promise<PasswordResetRequest[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/password-resets${params}`);
    return response.data.requests || [];
  },

  // Complete a password reset request (generates new setup code)
  completeResetRequest: async (requestId: string, notes?: string): Promise<CompleteResetResponse> => {
    const response = await api.post(`/admin/password-resets/${requestId}/complete`, { notes });
    return response.data;
  },

  // Dismiss a password reset request
  dismissResetRequest: async (requestId: string, notes?: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/password-resets/${requestId}/dismiss`, { notes });
    return response.data;
  },

  // Regenerate setup code for a user (admin can do this directly)
  regenerateSetupCode: async (userId: string): Promise<RegenerateSetupCodeResponse> => {
    const response = await api.post(`/admin/users/${userId}/regenerate-setup-code`);
    return response.data;
  },
};
