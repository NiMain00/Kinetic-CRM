import apiClient from './api-client';

export const auditService = {
  list: (params?: { action?: string; resourceType?: string; actorId?: string; page?: number; perPage?: number }) =>
    apiClient.get('/audit', { params }),
  get: (id: string) => apiClient.get(`/audit/${id}`),
};
