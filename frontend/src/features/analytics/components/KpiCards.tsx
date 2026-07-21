import type { AnalyticsKpi } from '@/services/analytics';

interface KpiCardsProps {
  kpis: AnalyticsKpi | undefined;
  loading: boolean;
}

function fmt(val: number): string {
  if (!Number.isFinite(val)) return '0';
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
}

export default function KpiCards({ kpis, loading }: KpiCardsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border/60 shadow-card p-4 animate-pulse">
            <div className="h-3 w-20 bg-surface-container-high rounded mb-2" />
            <div className="h-6 w-16 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: 'Rata-rata Lead Time', value: `${fmt(kpis.averageLeadTimeDays)} hari`, icon: 'timeline', color: 'text-primary' },
    { label: 'Median Lead Time', value: `${fmt(kpis.medianLeadTimeDays)} hari`, icon: 'sort', color: 'text-info' },
    { label: 'Proyek Tercepat', value: `${fmt(kpis.fastestProjectDays)} hari`, icon: 'speed', color: 'text-success' },
    { label: 'Proyek Terlama', value: `${fmt(kpis.slowestProjectDays)} hari`, icon: 'slow_motion_video', color: 'text-danger' },
    { label: 'Over SLA', value: `${kpis.projectsOverSla} (${fmt(kpis.projectsOverSlaPercent)}%)`, icon: 'warning', color: 'text-warning' },
    { label: 'Approval Cycle', value: `${fmt(kpis.approvalCycleTimeDays)} hari`, icon: 'fact_check', color: 'text-primary' },
    { label: 'PO Waiting', value: `${fmt(kpis.poWaitingTimeDays)} hari`, icon: 'hourglass_empty', color: 'text-status-orange' },
    { label: 'Execution Cycle', value: `${fmt(kpis.executionCycleTimeDays)} hari`, icon: 'construction', color: 'text-status-teal' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-surface rounded-xl border border-border/60 shadow-card p-4 hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
            <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">{item.label}</span>
          </div>
          <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
