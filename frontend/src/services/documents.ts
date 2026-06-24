import apiClient from './api-client';

export const documentService = {
  list: (params?: Record<string, unknown>) => apiClient.get('/documents', { params }),
  getByResource: (resourceType: string, resourceId: string) =>
    apiClient.get('/documents/by-resource', { params: { resourceType, resourceId } }),
  getVersions: (resourceType: string, resourceId: string, documentTypeId: string) =>
    apiClient.get('/documents/versions', { params: { resourceType, resourceId, documentTypeId } }),
  upload: (formData: FormData) => apiClient.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};
