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
    try {
      const [statsRes, trendRes, distRes, deadlinesRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getWinLossTrend(),
        dashboardService.getStatusDistribution(),
        dashboardService.getCriticalDeadlines(),
      ]);
      set({
        stats: statsRes.data.data || statsRes.data as any,
        chartData: trendRes.data.data || trendRes.data as any,
        statusDistribution: distRes.data.data || distRes.data as any,
        criticalDeadlines: deadlinesRes.data.data || deadlinesRes.data as any,
        loading: false,
      });
    } catch {
      set({ loading: false, error: 'Gagal memuat data dashboard' });
    }
  },
}));
