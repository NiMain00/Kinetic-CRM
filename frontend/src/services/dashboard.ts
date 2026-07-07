import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';

export interface DashboardStats {
  totalActiveProjects: number;
  totalActiveValue: number;
  pendingApprovals: number;
  criticalDeadlines: number;
  winRate: number;
  valueChangePercent: number;
}

export interface ChartDataPoint {
  month: string;
  win: number;
  lose: number;
}

export interface StatusDistribution {
  inProgress: number;
  completed: number;
  postponed: number;
  planning: number;
  total: number;
}

export interface CriticalDeadline {
  id: string;
  name: string;
  client: string;
  daysLeft: number;
  deadline: string;
  severity: 'danger' | 'warning' | 'info';
}

export const dashboardService = {
  getStats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  getWinLossTrend: () => apiClient.get<ApiResponse<ChartDataPoint[]>>('/dashboard/trend-win-loss'),
  getStatusDistribution: () => apiClient.get<ApiResponse<StatusDistribution>>('/dashboard/status-distribution'),
  getCriticalDeadlines: () => apiClient.get<ApiResponse<CriticalDeadline[]>>('/dashboard/critical-deadlines'),
  getApprovalPending: (limit?: number) => apiClient.get<ApiResponse<CriticalDeadline[]>>('/dashboard/approval-pending', { params: { limit } }),
};
