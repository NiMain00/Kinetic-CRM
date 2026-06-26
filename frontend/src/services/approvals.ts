import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';
import type { ApprovalItem } from '@/types/domain';

export const approvalService = {
  list: (params?: { type?: string; status?: string }) =>
    apiClient.get<ApiResponse<ApprovalItem[]>>('/approvals', { params }),
  get: (id: string) => apiClient.get<ApiResponse<ApprovalItem>>(`/approvals/${id}`),
  approve: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<void>>(`/approvals/${id}/approve`, { notes }),
  reject: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<void>>(`/approvals/${id}/reject`, { notes }),
  addReview: (id: string, data: { reviewNotes: string; status: 'approved' | 'revision' }) =>
    apiClient.post<ApiResponse<void>>(`/approvals/${id}/review`, data),
};
