import apiClient from './api-client';

export const approvalService = {
  list: (params?: { status?: string; resourceType?: string; page?: number; perPage?: number }) =>
    apiClient.get('/approvals', { params }),
  get: (id: string) => apiClient.get(`/approvals/${id}`),
  decide: (id: string, data: { decision: 'approved' | 'rejected'; comment?: string }) =>
    apiClient.post(`/approvals/${id}/decide`, data),
  reassign: (id: string, data: { newAssigneeUserId: string; reason: string }) =>
    apiClient.post(`/approvals/${id}/reassign`, data),
};
