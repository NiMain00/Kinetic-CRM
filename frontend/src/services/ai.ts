import apiClient from './api-client';

export const aiService = {
  tenderSummary: (data: { projectId: string; documentType: string }) =>
    apiClient.post('/ai/tender-summary', data),
  prospectAnalysis: (data: { prospectId: string }) =>
    apiClient.post('/ai/prospect-analysis', data),
  competitorAnalysis: (data: { competitorId: string }) =>
    apiClient.post('/ai/competitor-analysis', data),
  kpiInsight: (data: { branchId?: string; periodId: string }) =>
    apiClient.post('/ai/kpi-insight', data),
  executiveSummary: (data: { periodMonth: number; periodYear: number }) =>
    apiClient.post('/ai/executive-summary', data),
  smartSearch: (params: { query: string; scope?: string }) =>
    apiClient.get('/ai/smart-search', { params }),
};
