import api from './api';

export interface DashboardStats {
  totalCompanies: number;
  activeTours: number;
  totalUsers: number;
  upcomingTours: number;
}

export interface RecentActivity {
  type: 'user' | 'tour' | 'company' | 'activity' | 'message';
  description: string;
  timestamp: string;
  user_name?: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  const response = await api.get('/dashboard/activity');
  return response.data;
};
