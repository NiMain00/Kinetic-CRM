import apiClient from './api-client';

export const dashboardService = {
  getSummary: (params?: { periodMonth?: number; periodYear?: number }) =>
    apiClient.get('/dashboard/summary', { params }),
  getPendingApprovals: () => apiClient.get('/dashboard/approvals-pending'),
  getApproachingDeadline: () => apiClient.get('/dashboard/approaching-deadline'),
};
