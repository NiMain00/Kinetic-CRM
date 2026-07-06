import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';

export interface WinLossReport {
  period: string;
  totalTenders: number;
  won: number;
  lost: number;
  winRate: number;
  totalValue: number;
  wonValue: number;
  topReasons: Array<{ reason: string; count: number }>;
}

export interface PipelineReport {
  stage: string;
  count: number;
  value: number;
  probability: number;
  expectedValue: number;
}

export interface KpiReport {
  kpi: string;
  target: number;
  actual: number;
  achievement: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
}

export const reportService = {
  winLoss: (params?: { period?: string; branch?: string; year?: number }) =>
    apiClient.get<ApiResponse<WinLossReport>>('/reports/win-loss', { params }),
  pipeline: (params?: { branch?: string; status?: string }) =>
    apiClient.get<ApiResponse<PipelineReport[]>>('/reports/pipeline', { params }),
  kpi: (params?: { period?: string; department?: string }) =>
    apiClient.get<ApiResponse<KpiReport[]>>('/reports/kpi', { params }),
  exportXlsx: (reportType: string, params?: Record<string, unknown>) =>
    apiClient.get(`/reports/${reportType}/export`, { params, responseType: 'blob' }),
};
