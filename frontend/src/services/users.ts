import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';
import type { User } from '@/types/domain/users';

export interface CreateUserPayload {
  username: string;
  fullName: string;
  email: string;
  role: string;
  branch: string;
  department: string;
  phone: string;
  password?: string;
}

export const userService = {
  list: (params?: { page?: number; perPage?: number; role?: string; status?: string; branch?: string }) =>
    apiClient.get<ApiResponse<User[]>>('/users', { params }),
  get: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: CreateUserPayload) => apiClient.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) => apiClient.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/users/${id}`),
  toggleStatus: (id: string) => apiClient.patch<ApiResponse<User>>(`/users/${id}/toggle-status`),
  resetPassword: (id: string, newPassword: string) => apiClient.post<ApiResponse<void>>(`/users/${id}/reset-password`, { newPassword }),
};
