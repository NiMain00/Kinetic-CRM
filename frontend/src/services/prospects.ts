import apiClient from './api-client';

export const prospectService = {
  list: (params?: unknown) => apiClient.get('/prospects', { params }),
  get: (id: string) => apiClient.get(`/prospects/${id}`),
  create: (data: unknown) => apiClient.post('/prospects', data),
  update: (id: string, data: unknown) => apiClient.put(`/prospects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/prospects/${id}`),
};
