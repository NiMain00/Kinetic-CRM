import apiClient from './api-client';

export const projectService = {
  list: (params?: unknown) => apiClient.get('/projects', { params }),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: unknown) => apiClient.post('/projects', data),
  update: (id: string, data: unknown) => apiClient.put(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};
