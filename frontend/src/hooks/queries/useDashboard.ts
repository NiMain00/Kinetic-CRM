import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardStats, type ChartDataPoint, type StatusDistribution, type CriticalDeadline } from '@/services/dashboard';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await dashboardService.getStats();
      return res.data.data;
    },
  });
}

export function useWinLossTrend() {
  return useQuery<ChartDataPoint[]>({
    queryKey: ['dashboard', 'trend'],
    queryFn: async () => {
      const res = await dashboardService.getWinLossTrend();
      return res.data.data;
    },
  });
}

export function useStatusDistribution() {
  return useQuery<StatusDistribution>({
    queryKey: ['dashboard', 'status-distribution'],
    queryFn: async () => {
      const res = await dashboardService.getStatusDistribution();
      return res.data.data;
    },
  });
}

export function useCriticalDeadlines() {
  return useQuery<CriticalDeadline[]>({
    queryKey: ['dashboard', 'deadlines'],
    queryFn: async () => {
      const res = await dashboardService.getCriticalDeadlines();
      return res.data.data;
    },
  });
}
