import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';

export interface AnalyticsKpi {
  averageLeadTimeDays: number;
  medianLeadTimeDays: number;
  fastestProjectDays: number;
  fastestProjectName: string | null;
  slowestProjectDays: number;
  slowestProjectName: string | null;
  projectsOverSla: number;
  projectsOverSlaPercent: number;
  approvalCycleTimeDays: number;
  poWaitingTimeDays: number;
  executionCycleTimeDays: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
}

export interface LeadTimeData {
  month: string;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  projectCount: number;
}

export interface StageDurationData {
  stageKey: string;
  stageLabel: string;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  projectCount: number;
}

export interface BottleneckData {
  stageKey: string;
  stageLabel: string;
  stuckCount: number;
  avgDaysStuck: number;
  maxDaysStuck: number;
  projects: Array<{ id: string; name: string; daysStuck: number }>;
}

export interface HeatmapData {
  stageKey: string;
  stageLabel: string;
  period: string;
  count: number;
  projectCount: number;
}

export interface DashboardAnalytics {
  kpis: AnalyticsKpi;
  leadTime: LeadTimeData[];
  stageDuration: StageDurationData[];
  bottlenecks: BottleneckData[];
  throughput: Array<{ month: string; count: number }>;
  heatmap: HeatmapData[];
  statusDistribution: Array<{ status: string; count: number }>;
}

export interface TransitionDuration {
  eventKey: string;
  eventLabel: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  durationHours: number | null;
  durationDays: number | null;
  isOverSla: boolean;
  slaDays: number | null;
  slaExcessDays: number;
  actorName: string;
}

export interface ProjectTimelineAnalytics {
  projectId: string;
  projectName: string;
  projectCode: string;
  currentStatus: string;
  totalDurationDays: number | null;
  transitions: TransitionDuration[];
  activeStage: string | null;
  slaExceededStages: string[];
}

export const analyticsService = {
  getDashboard: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<DashboardAnalytics>>('/analytics/dashboard', { params }),

  getLeadTime: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<LeadTimeData[]>>('/analytics/lead-time', { params }),

  getStageDuration: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<StageDurationData[]>>('/analytics/stage-duration', { params }),

  getBottlenecks: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<BottleneckData[]>>('/analytics/bottlenecks', { params }),

  getThroughput: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<Array<{ month: string; count: number }>>>('/analytics/throughput', { params }),

  getHeatmap: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<HeatmapData[]>>('/analytics/heatmap', { params }),

  getProjectTimelineAnalytics: (projectId: string) =>
    apiClient.get<ApiResponse<ProjectTimelineAnalytics>>(`/projects/${projectId}/timeline-analytics`),
};
