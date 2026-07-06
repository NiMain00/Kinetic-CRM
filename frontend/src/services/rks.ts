import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';
import type { RksData } from '@/types/domain';

export interface RksReviewAction {
  action: 'approve' | 'revision';
  notes?: string;
}

export const rksService = {
  getByProject: (projectId: string) => apiClient.get<ApiResponse<RksData>>(`/projects/${projectId}/rks`),
  save: (projectId: string, data: Partial<RksData>) => apiClient.post<ApiResponse<RksData>>(`/projects/${projectId}/rks`, data),
  submit: (projectId: string) => apiClient.post<ApiResponse<void>>(`/projects/${projectId}/rks/submit`),
  review: (projectId: string, action: RksReviewAction) =>
    apiClient.post<ApiResponse<void>>(`/projects/${projectId}/rks/review`, action),
  uploadFile: (projectId: string, file: FormData) =>
    apiClient.post<ApiResponse<{ name: string; size: string }>>(`/projects/${projectId}/rks/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (projectId: string, fileName: string) =>
    apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/rks/files/${encodeURIComponent(fileName)}`),
};
