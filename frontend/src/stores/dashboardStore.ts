import { create } from 'zustand';
import { dashboardService } from '@/services/dashboard';
import type { DashboardStats, ChartDataPoint, StatusDistribution, CriticalDeadline } from '@/services/dashboard';

const CACHE_TTL = 2 * 60 * 1000;

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartDataPoint[];
  statusDistribution: StatusDistribution | null;
  criticalDeadlines: CriticalDeadline[];
  loading: boolean;
  error: string | null;
  lastFetched: number;
  fetchAll: (force?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  stats: null,
  chartData: [],
  statusDistribution: null,
  criticalDeadlines: [],
  loading: false,
  error: null,
  lastFetched: 0,

  fetchAll: async (force) => {
    const now = Date.now();
    if (!force && now - get().lastFetched < CACHE_TTL) return;
    set({ loading: true, error: null });

    // Critical: load stats first so stat cards render immediately
    const statsRes = await dashboardService.getStats().catch(() => null);
    const stats = statsRes ? (statsRes.data?.data ?? statsRes.data ?? null) as DashboardStats | null : null;
    set({ stats, loading: !stats }); // keep loading if stats failed, release otherwise

    // Non-critical: load charts + distribution + deadlines in background
    const [trendRes, distRes, deadlinesRes] = await Promise.allSettled([
      dashboardService.getWinLossTrend(),
      dashboardService.getStatusDistribution(),
      dashboardService.getCriticalDeadlines(),
    ]);
    const extract = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? (r.value.data?.data ?? r.value.data ?? null) : null;
    set({
      chartData: (extract(trendRes) as ChartDataPoint[] | null) ?? [],
      statusDistribution: extract(distRes) as StatusDistribution | null,
      criticalDeadlines: (extract(deadlinesRes) as CriticalDeadline[] | null) ?? [],
      loading: false,
      lastFetched: Date.now(),
    });
  },
}));
