import api from './api';
import { Activity } from '@/types/api';

export const activityService = {
  getAllActivities: async (): Promise<{ activities: Activity[] }> => {
    const response = await api.get('/activities');
    return response.data;
  },
};
