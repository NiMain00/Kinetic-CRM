import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';
import type { LphsData, LphsDepartmentApproval } from '@/types/domain';

export const lphsSiosService = {
  getByProject: (projectId: string) => apiClient.get<ApiResponse<LphsData>>(`/projects/${projectId}/lphs`),
  save: (projectId: string, data: Partial<LphsData>) => apiClient.post<ApiResponse<LphsData>>(`/projects/${projectId}/lphs`, data),
  submit: (projectId: string) => apiClient.post<ApiResponse<void>>(`/projects/${projectId}/lphs/submit`),
  reviewDepartment: (projectId: string, approval: LphsDepartmentApproval) =>
    apiClient.post<ApiResponse<void>>(`/projects/${projectId}/lphs/review-department`, approval),
  reviewPm: (projectId: string, action: 'approve' | 'revision', notes?: string) =>
    apiClient.post<ApiResponse<void>>(`/projects/${projectId}/lphs/review-pm`, { action, notes }),
  reviewMgmt: (projectId: string, action: 'approve' | 'revision', notes?: string) =>
    apiClient.post<ApiResponse<void>>(`/projects/${projectId}/lphs/review-mgmt`, { action, notes }),
  uploadLphs: (projectId: string, file: FormData) =>
    apiClient.post<ApiResponse<{ fileName: string; fileSize: string }>>(`/projects/${projectId}/lphs/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadSios: (projectId: string, file: FormData) =>
    apiClient.post<ApiResponse<{ fileName: string; fileSize: string }>>(`/projects/${projectId}/lphs/upload-sios`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
