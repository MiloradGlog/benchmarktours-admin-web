import api from './api';
import { User, CreateUserData, UpdateUserData, UserStats, ApiResponse } from '@/types/auth';

export const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.users || [];
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data.user;
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.user;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/users/stats');
    return response.data.stats;
  },

  // Search users
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.users || [];
  },

  // Get users by role
  getUsersByRole: async (role: 'Admin' | 'User' | 'Guide'): Promise<User[]> => {
    const response = await api.get(`/users/role/${role}`);
    return response.data.users || [];
  },

  // Utility function to format user's full name
  getFullName: (user: User): string => {
    return `${user.first_name} ${user.last_name}`;
  },

  // Utility function to get role display name
  getRoleDisplayName: (role: string): string => {
    const roleNames: Record<string, string> = {
      'Admin': 'Administrator',
      'User': 'Participant',
      'Guide': 'Tour Guide'
    };
    return roleNames[role] || role;
  },

  // Utility function to get role color for UI
  getRoleColor: (role: string): string => {
    const roleColors: Record<string, string> = {
      'Admin': 'bg-red-100 text-red-800',
      'User': 'bg-blue-100 text-blue-800',
      'Guide': 'bg-green-100 text-green-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  }
};