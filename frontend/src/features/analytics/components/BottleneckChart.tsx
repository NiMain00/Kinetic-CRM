import type { BottleneckData } from '@/services/analytics';

interface BottleneckChartProps {
  data: BottleneckData[] | undefined;
  loading: boolean;
}

const MAX_BAR_WIDTH = 100;

export default function BottleneckChart({ data, loading }: BottleneckChartProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
        <div className="h-4 w-40 bg-surface-container-high rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-surface-container-high rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
        <h4 className="font-heading-section text-sm font-bold mb-1">Top Bottleneck Stages</h4>
        <p className="text-xs text-secondary">Belum ada data bottleneck yang terdeteksi.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.stuckCount), 1);

  const getBarColor = (avgDays: number) => {
    if (avgDays > 14) return 'bg-danger';
    if (avgDays > 10) return 'bg-warning';
    return 'bg-status-orange';
  };

  return (
    <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-heading-section text-sm font-bold">Top Bottleneck Stages</h4>
          <p className="text-[10px] text-secondary">Tahap dengan proyek terbanyak yang macet</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const widthPct = (item.stuckCount / maxCount) * MAX_BAR_WIDTH;
          const barColor = getBarColor(item.avgDaysStuck);

          return (
            <div key={item.stageKey}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-on-surface">{item.stageLabel}</span>
                <span className="text-[10px] text-secondary">
                  {item.stuckCount} proyek · rata-rata {item.avgDaysStuck} hari
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {item.projects.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.projects.slice(0, 3).map((p) => (
                    <span key={p.id} className="text-[9px] text-secondary bg-surface-container-low px-1.5 py-0.5 rounded">
                      {p.name} ({p.daysStuck}h)
                    </span>
                  ))}
                  {item.projects.length > 3 && (
                    <span className="text-[9px] text-outline">+{item.projects.length - 3} lagi</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
