import apiClient from './api-client';

export const reportService = {
  getWinLoss: (params?: { periodId?: string; branchId?: string; categoryId?: string }) =>
    apiClient.get('/reports/win-loss', { params }),
  getPipeline: () => apiClient.get('/reports/pipeline'),
  getProgressVsTarget: () => apiClient.get('/reports/progress-vs-target'),
  export: (reportType: string, data: { format: 'xlsx' | 'pdf'; filters?: Record<string, unknown> }) =>
    apiClient.post(`/reports/${reportType}/export`, data),
};
