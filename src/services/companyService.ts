import api from './api';
import { Company } from '@/types/api';

export const companyService = {
  getAll: async (): Promise<{ companies: Company[] }> => {
    const response = await api.get('/companies');
    return response.data;
  },

  getById: async (id: number): Promise<{ company: Company }> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<{ company: Company }> => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>): Promise<{ company: Company }> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  uploadImage: async (companyId: number, file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`/uploads/company/${companyId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};