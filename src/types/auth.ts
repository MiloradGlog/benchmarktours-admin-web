export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'User' | 'Guide';
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'User' | 'Guide';
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'User' | 'Guide';
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'Admin' | 'User' | 'Guide';
  password?: string;
}

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  users?: User[];
  user?: User;
  stats?: UserStats;
  message?: string;
  error?: string;
}