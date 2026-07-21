import type { HeatmapData } from '@/services/analytics';

interface HeatmapChartProps {
  data: HeatmapData[] | undefined;
  loading: boolean;
}

export default function HeatmapChart({ data, loading }: HeatmapChartProps) {
  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
        <div className="h-4 w-40 bg-surface-container-high rounded animate-pulse mb-4" />
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-container-high rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5">
        <h4 className="font-heading-section text-sm font-bold mb-1">Heatmap Kemacetan</h4>
        <p className="text-xs text-secondary">Belum ada data heatmap.</p>
      </div>
    );
  }

  // Group by stage and period
  const stageKeys = [...new Set(data.map((d) => d.stageKey))];
  const periods = [...new Set(data.map((d) => d.period))].sort();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-surface-container-high';
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-danger';
    if (intensity > 0.4) return 'bg-warning';
    return 'bg-warning/40';
  };

  const getCount = (stageKey: string, period: string): number => {
    const cell = data.find((d) => d.stageKey === stageKey && d.period === period);
    return cell?.count || 0;
  };

  return (
    <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-heading-section text-sm font-bold">Heatmap Kemacetan</h4>
          <p className="text-[10px] text-secondary">Pola kemacetan per tahap per bulan</p>
        </div>
      </div>

      <div className="min-w-[400px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `160px repeat(${periods.length}, 1fr)` }}>
          {/* Header */}
          <div className="text-[10px] text-secondary font-semibold px-2 py-1">Tahap</div>
          {periods.map((p) => (
            <div key={p} className="text-[10px] text-secondary font-semibold text-center px-1 py-1">
              {p}
            </div>
          ))}

          {/* Rows */}
          {stageKeys.map((stageKey) => (
            <>
              <div key={`label-${stageKey}`} className="text-xs text-on-surface truncate px-2 py-2">
                {data.find((d) => d.stageKey === stageKey)?.stageLabel || stageKey}
              </div>
              {periods.map((period) => {
                const count = getCount(stageKey, period);
                return (
                  <div
                    key={`${stageKey}-${period}`}
                    className={`aspect-square rounded ${getCellColor(count)} flex items-center justify-center cursor-default transition-colors group relative`}
                    title={`${data.find((d) => d.stageKey === stageKey)?.stageLabel || stageKey}: ${count} proyek (${period})`}
                  >
                    <span className="text-[9px] font-mono-data font-bold text-on-surface/70">
                      {count || ''}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-container-lowest border border-border/60 shadow-lg rounded-lg px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {data.find((d) => d.stageKey === stageKey)?.stageLabel || stageKey}: {count} proyek
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-end">
          <span className="text-[9px] text-secondary">Rendah</span>
          <div className="w-3 h-3 rounded bg-surface-container-high" />
          <div className="w-3 h-3 rounded bg-warning/40" />
          <div className="w-3 h-3 rounded bg-warning" />
          <div className="w-3 h-3 rounded bg-danger" />
          <span className="text-[9px] text-secondary">Tinggi</span>
        </div>
      </div>
    </div>
  );
}
