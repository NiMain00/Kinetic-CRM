import { create } from 'zustand';
import { dashboardService } from '@/services/dashboard';
import type { DashboardStats, ChartDataPoint, StatusDistribution, CriticalDeadline } from '@/services/dashboard';

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartDataPoint[];
  statusDistribution: StatusDistribution | null;
  criticalDeadlines: CriticalDeadline[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  stats: null,
  chartData: [],
  statusDistribution: null,
  criticalDeadlines: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const [statsRes, trendRes, distRes, deadlinesRes] = await Promise.allSettled([
      dashboardService.getStats(),
      dashboardService.getWinLossTrend(),
      dashboardService.getStatusDistribution(),
      dashboardService.getCriticalDeadlines(),
    ]);
    const extract = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value.data?.data ?? r.value.data ?? null) : null;
    set({
      stats: extract(statsRes) as DashboardStats | null,
      chartData: (extract(trendRes) as ChartDataPoint[] | null) ?? [],
      statusDistribution: extract(distRes) as StatusDistribution | null,
      criticalDeadlines: (extract(deadlinesRes) as CriticalDeadline[] | null) ?? [],
      loading: false,
    });
  },
}));
