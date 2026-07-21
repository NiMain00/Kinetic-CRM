import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/shared';
import { useAnalyticsDashboard } from '@/hooks/queries/useAnalytics';
import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import BottleneckChart from './components/BottleneckChart';
import HeatmapChart from './components/HeatmapChart';

export default function AnalyticsDashboardPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    branchId: '',
    departmentId: '',
    ownerUserId: '',
    status: '',
  });

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.branchId) p.branchId = filters.branchId;
    if (filters.departmentId) p.departmentId = filters.departmentId;
    if (filters.status) p.status = filters.status;
    return p;
  }, [filters]);

  const { data, isLoading, error } = useAnalyticsDashboard(apiParams);

  const maxLeadDays = useMemo(() => {
    if (!data?.leadTime?.length) return 100;
    return Math.max(...data.leadTime.map((l) => l.averageDays), 1);
  }, [data?.leadTime]);

  const maxThrougput = useMemo(() => {
    if (!data?.throughput?.length) return 10;
    return Math.max(...data.throughput.map((t) => t.count), 1);
  }, [data?.throughput]);

  const maxStageDays = useMemo(() => {
    if (!data?.stageDuration?.length) return 10;
    return Math.max(...data.stageDuration.map((s) => s.averageDays), 1);
  }, [data?.stageDuration]);

  const stageDurationSorted = useMemo(() => {
    if (!data?.stageDuration) return [];
    return [...data.stageDuration].sort((a, b) => b.averageDays - a.averageDays);
  }, [data?.stageDuration]);

  return (
    <PageContainer>
      {/* Header */}
      <div className="rounded-2xl bg-surface border border-border/60 shadow-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-title text-display-title text-on-surface">
              Analytics & Dashboard
            </h1>
            <p className="text-sm text-secondary mt-1">
              Timeline analytics, bottleneck detection, dan KPI proyek
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-light px-3.5 py-1.5 text-xs rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span>
            Daftar Proyek
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar values={filters} onChange={setFilters} />

      {/* Error State */}
      {error && (
        <div className="bg-danger-container rounded-2xl border border-danger/30 p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-danger">error_outline</span>
          <p className="text-sm font-semibold text-danger mt-2">Gagal memuat data analytics</p>
          <p className="text-xs text-secondary mt-1">Silakan coba lagi atau hubungi administrator.</p>
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards kpis={data?.kpis} loading={isLoading} />

      {/* Charts Row 1: Lead Time + Stage Duration */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {/* Lead Time Line Chart */}
        <div className="col-span-12 lg:col-span-7 bg-surface rounded-2xl border border-border/60 shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-heading-section text-sm font-bold">Lead Time Rata-rata</h4>
              <p className="text-[10px] text-secondary">Rata-rata hari dari prospek ke selesai per bulan</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-48 bg-surface-container-high rounded animate-pulse" />
          ) : !data?.leadTime?.length ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary">Belum ada data</div>
          ) : (
            <div className="flex gap-3 h-48">
              <div className="flex flex-col justify-between text-[9px] text-secondary font-mono-data pb-6">
                <span>{Math.ceil(maxLeadDays)}</span>
                <span>{Math.ceil(maxLeadDays / 2)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 flex items-end justify-between gap-2 pb-6 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pb-6">
                  <div className="border-t border-border/30" />
                  <div className="border-t border-border/30" />
                  <div className="border-t border-border/30" />
                </div>
                {data.leadTime.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1 z-10">
                    <div className="w-full flex justify-center">
                      <div
                        className="w-full max-w-[32px] bg-primary rounded-t transition-all duration-700 hover:brightness-110"
                        style={{ height: `${(item.averageDays / maxLeadDays) * 160}px` }}
                        title={`${item.month}: ${item.averageDays} hari`}
                      />
                    </div>
                    <span className="text-[9px] text-secondary font-mono-data">{item.month.slice(-2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Throughput Bar Chart */}
        <div className="col-span-12 lg:col-span-5 bg-surface rounded-2xl border border-border/60 shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-heading-section text-sm font-bold">Throughput</h4>
              <p className="text-[10px] text-secondary">Proyek selesai per bulan</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-48 bg-surface-container-high rounded animate-pulse" />
          ) : !data?.throughput?.length ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary">Belum ada data</div>
          ) : (
            <div className="flex gap-2 h-48">
              <div className="flex flex-col justify-between text-[9px] text-secondary font-mono-data pb-6">
                <span>{maxThrougput}</span>
                <span>{Math.ceil(maxThrougput / 2)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 flex items-end justify-between gap-1.5 pb-6">
                {data.throughput.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex justify-center">
                      <div
                        className="w-full max-w-[28px] bg-success rounded-t transition-all duration-700"
                        style={{ height: `${(item.count / maxThrougput) * 160}px` }}
                        title={`${item.month}: ${item.count} proyek`}
                      />
                    </div>
                    <span className="text-[9px] text-secondary font-mono-data">{item.month.slice(-2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Stage Duration + Distribution */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {/* Stage Duration Horizontal Bar */}
        <div className="col-span-12 lg:col-span-7 bg-surface rounded-2xl border border-border/60 shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-heading-section text-sm font-bold">Durasi per Tahap</h4>
              <p className="text-[10px] text-secondary">Rata-rata hari per tahap (diurutkan dari terlama)</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 bg-surface-container-high rounded animate-pulse" />
              ))}
            </div>
          ) : !stageDurationSorted?.length ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary">Belum ada data</div>
          ) : (
            <div className="space-y-3">
              {stageDurationSorted.map((item) => (
                <div key={item.stageKey}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface font-medium truncate">{item.stageLabel}</span>
                    <span className="text-secondary font-mono-data shrink-0 ml-2">{item.averageDays} hari</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-info transition-all duration-700"
                      style={{ width: `${(item.averageDays / maxStageDays) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Distribution Donut */}
        <div className="col-span-12 lg:col-span-5 bg-surface rounded-2xl border border-border/60 shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-heading-section text-sm font-bold">Distribusi Proyek</h4>
              <p className="text-[10px] text-secondary">Berdasarkan status saat ini</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-48 bg-surface-container-high rounded animate-pulse" />
          ) : !data?.statusDistribution?.length ? (
            <div className="h-48 flex items-center justify-center text-xs text-secondary">Belum ada data</div>
          ) : (
            <div className="flex items-center gap-4">
              {/* SVG Donut */}
              <div className="relative shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  {(() => {
                    const total = data.statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1;
                    const colors = ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-danger)', 'var(--color-status-purple)', 'var(--color-status-teal)'];
                    const circumference = 2 * Math.PI * 48;
                    let offset = 0;
                    return data.statusDistribution.map((item, i) => {
                      const pct = item.count / total;
                      const dashLen = circumference * pct;
                      const dashOffset = -offset;
                      offset += dashLen;
                      return (
                        <circle
                          key={item.status}
                          cx="60" cy="60" r="48"
                          fill="transparent"
                          stroke={colors[i % colors.length]}
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-on-surface">{data.statusDistribution.reduce((s, i) => s + i.count, 0)}</span>
                  <span className="text-[9px] text-secondary uppercase tracking-wider">Total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-1.5">
                {data.statusDistribution.map((item, i) => {
                  const colors = ['bg-primary', 'bg-info', 'bg-warning', 'bg-success', 'bg-danger', 'bg-status-purple', 'bg-status-teal'];
                  const total = data.statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1;
                  return (
                    <div key={item.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                        <span className="text-secondary truncate">{item.status}</span>
                      </div>
                      <span className="font-mono-data font-bold shrink-0 ml-2">{item.count} ({Math.round((item.count / total) * 100)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 3: Bottleneck + Heatmap */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        <div className="col-span-12 lg:col-span-5">
          <BottleneckChart data={data?.bottlenecks} loading={isLoading} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <HeatmapChart data={data?.heatmap} loading={isLoading} />
        </div>
      </div>
    </PageContainer>
  );
}
