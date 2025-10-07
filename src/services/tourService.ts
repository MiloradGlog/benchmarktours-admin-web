import api from './api';
import { Tour, Activity, CreateActivityData, User, TourParticipant, TourStatus } from '@/types/api';

export const tourService = {
  getAll: async (): Promise<{ tours: Tour[] }> => {
    const response = await api.get('/tours');
    return response.data;
  },

  getById: async (id: number): Promise<{ tour: Tour }> => {
    const response = await api.get(`/tours/${id}`);
    return response.data;
  },

  create: async (data: Omit<Tour, 'id' | 'created_at' | 'updated_at'>): Promise<{ tour: Tour }> => {
    const response = await api.post('/tours', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Tour, 'id' | 'created_at' | 'updated_at'>>): Promise<{ tour: Tour }> => {
    const response = await api.put(`/tours/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tours/${id}`);
  },

  updateStatus: async (id: number, status: TourStatus): Promise<{ tour: Tour }> => {
    const response = await api.patch(`/tours/${id}/status`, { status });
    return response.data;
  },

  // Activities
  getActivities: async (tourId: number): Promise<{ activities: Activity[] }> => {
    const response = await api.get(`/tours/${tourId}/activities`);
    return response.data;
  },

  createActivity: async (tourId: number, data: CreateActivityData): Promise<{ activity: Activity }> => {
    const response = await api.post(`/tours/${tourId}/activities`, data);
    return response.data;
  },

  updateActivity: async (tourId: number, activityId: number, data: Partial<CreateActivityData>): Promise<{ activity: Activity }> => {
    const response = await api.put(`/tours/${tourId}/activities/${activityId}`, data);
    return response.data;
  },

  deleteActivity: async (tourId: number, activityId: number): Promise<void> => {
    await api.delete(`/tours/${tourId}/activities/${activityId}`);
  },

  // Participants
  getParticipants: async (tourId: number): Promise<{ participants: TourParticipant[] }> => {
    const response = await api.get(`/tours/${tourId}/participants`);
    return response.data;
  },

  assignUser: async (tourId: number, userId: string): Promise<{ participant: TourParticipant }> => {
    const response = await api.post(`/tours/${tourId}/participants`, { userId });
    return response.data;
  },

  unassignUser: async (tourId: number, userId: string): Promise<void> => {
    await api.delete(`/tours/${tourId}/participants/${userId}`);
  },

  uploadLogo: async (tourId: number, file: File): Promise<{ tour: Tour; upload: any }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/tours/${tourId}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const userService = {
  getAll: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },
};