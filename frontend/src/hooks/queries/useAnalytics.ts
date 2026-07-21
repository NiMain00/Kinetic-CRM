import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { unwrap } from '@/services/api-client';
import type {
  DashboardAnalytics,
  ProjectTimelineAnalytics,
} from '@/services/analytics';

export function useAnalyticsDashboard(params?: Record<string, any>) {
  return useQuery<DashboardAnalytics>({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: async () => {
      const res = await analyticsService.getDashboard(params);
      return unwrap<DashboardAnalytics>(res);
    },
  });
}

export function useProjectTimelineAnalytics(projectId: string | undefined) {
  return useQuery<ProjectTimelineAnalytics>({
    queryKey: ['analytics', 'project-timeline', projectId],
    queryFn: async () => {
      const res = await analyticsService.getProjectTimelineAnalytics(projectId!);
      return unwrap<ProjectTimelineAnalytics>(res);
    },
    enabled: !!projectId,
  });
}

export function useLeadTime(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['analytics', 'lead-time', params],
    queryFn: async () => {
      const res = await analyticsService.getLeadTime(params);
      return unwrap(res);
    },
  });
}

export function useStageDuration(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['analytics', 'stage-duration', params],
    queryFn: async () => {
      const res = await analyticsService.getStageDuration(params);
      return unwrap(res);
    },
  });
}

export function useBottlenecks(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['analytics', 'bottlenecks', params],
    queryFn: async () => {
      const res = await analyticsService.getBottlenecks(params);
      return unwrap(res);
    },
  });
}

export function useHeatmap(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', params],
    queryFn: async () => {
      const res = await analyticsService.getHeatmap(params);
      return unwrap(res);
    },
  });
}
