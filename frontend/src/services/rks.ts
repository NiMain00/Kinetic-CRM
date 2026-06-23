import apiClient from './api-client';

export const rksService = {
  getByProject: (projectId: string) => apiClient.get(`/projects/${projectId}/rks`),
  create: (projectId: string, data: { content: string; attachmentIds?: string[] }) =>
    apiClient.post(`/projects/${projectId}/rks`, data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/rks/${id}`, data),
  submit: (id: string) => apiClient.post(`/rks/${id}/submit`),
  approve: (id: string, data?: { comment?: string }) => apiClient.post(`/rks/${id}/approve`, data),
  reject: (id: string, data: { comment: string }) => apiClient.post(`/rks/${id}/reject`, data),
};
