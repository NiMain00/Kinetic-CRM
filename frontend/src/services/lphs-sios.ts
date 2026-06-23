import apiClient from './api-client';

export const lphsSiosService = {
  getByProject: (projectId: string) => apiClient.get(`/projects/${projectId}/lphs-sios`),
  create: (projectId: string, data: { departmentIds: string[]; attachmentIds?: string[] }) =>
    apiClient.post(`/projects/${projectId}/lphs-sios`, data),
  submit: (id: string) => apiClient.post(`/lphs-sios/${id}/submit`),
  departmentApprove: (id: string, deptId: string, data?: { comment?: string }) =>
    apiClient.post(`/lphs-sios/${id}/departments/${deptId}/approve`, data),
  departmentReject: (id: string, deptId: string, data: { comment: string }) =>
    apiClient.post(`/lphs-sios/${id}/departments/${deptId}/reject`, data),
  pmApprove: (id: string) => apiClient.post(`/lphs-sios/${id}/pm-approve`),
  departmentRevise: (id: string, deptId: string, data: { attachmentIds: string[]; note?: string }) =>
    apiClient.post(`/lphs-sios/${id}/departments/${deptId}/revise`, data),
};
