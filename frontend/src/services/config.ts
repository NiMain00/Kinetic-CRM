import apiClient from './api-client';

export const configService = {
  getOrganization: () => apiClient.get('/config/organization'),
  updateOrganization: (data: unknown) => apiClient.put('/config/organization', data),

  getWorkflow: () => apiClient.get('/config/workflow'),
  updateWorkflow: (data: unknown) => apiClient.put('/config/workflow', data),

  getSla: () => apiClient.get('/config/sla'),
  updateSla: (data: unknown) => apiClient.put('/config/sla', data),

  getNotificationTemplates: () => apiClient.get('/config/notifications'),
  updateNotificationTemplate: (eventCode: string, data: unknown) =>
    apiClient.put(`/config/notifications/${eventCode}`, data),

  getQuestionTypes: () => apiClient.get('/config/question-types'),
  createQuestionType: (data: { code: string; label: string; options?: string[] }) =>
    apiClient.post('/config/question-types', data),

  getUploadPolicy: () => apiClient.get('/config/upload-policy'),
  updateUploadPolicy: (code: string, data: unknown) =>
    apiClient.put(`/config/upload-policy/${code}`, data),

  getIntegrations: () => apiClient.get('/config/integrations'),
  updateIntegration: (key: string, data: { value: string }) =>
    apiClient.put(`/config/integrations/${key}`, data),

  getRoles: () => apiClient.get('/config/roles'),
  createRole: (data: { code: string; name: string; description?: string }) =>
    apiClient.post('/config/roles', data),
  updateRole: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch(`/config/roles/${id}`, data),

  getRolePermissions: (id: string) => apiClient.get(`/config/roles/${id}/permissions`),
  updateRolePermissions: (id: string, data: { permissions: string[] }) =>
    apiClient.put(`/config/roles/${id}/permissions`, data),

  getPermissions: () => apiClient.get('/config/permissions'),
};
