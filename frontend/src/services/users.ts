import apiClient from './api-client';

export const userService = {
  list: (params?: { search?: string; role?: string; branchId?: string; isActive?: boolean; page?: number; perPage?: number }) =>
    apiClient.get('/users', { params }),
  get: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: { name: string; username: string; email: string; password: string; role: string; branchId?: string; departmentId?: string }) =>
    apiClient.post('/users', data),
  update: (id: string, data: { name?: string; email?: string; role?: string; branchId?: string; departmentId?: string; isActive?: boolean }) =>
    apiClient.patch(`/users/${id}`, data),
  deactivate: (id: string) => apiClient.delete(`/users/${id}`),
  resetPassword: (id: string, data?: { newPassword?: string }) =>
    apiClient.post(`/users/${id}/reset-password`, data),
  lock: (id: string) => apiClient.post(`/users/${id}/lock`),
  unlock: (id: string) => apiClient.post(`/users/${id}/unlock`),
};
