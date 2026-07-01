import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Select } from '@/components/ui';
import EmptyState from '@/components/shared/EmptyState';
import type { KpiTarget } from '@/types/domain/users';
import { useMasterPeriods } from '@/hooks/useConfigData';

const INITIAL_KPIS: KpiTarget[] = [
  { id: 'KPI-001', name: 'Win Rate', category: 'win_rate', targetValue: 70, actualValue: 65.5, unit: '%', period: '2026 Q2', status: 'at_risk' },
  { id: 'KPI-002', name: 'Total Revenue', category: 'revenue', targetValue: 500000000000, actualValue: 425000000000, unit: 'IDR', period: '2026 H1', status: 'on_track' },
  { id: 'KPI-003', name: 'Project Completion', category: 'project_count', targetValue: 48, actualValue: 36, unit: 'projects', period: '2026 Q2', status: 'behind' },
  { id: 'KPI-004', name: 'Average Margin', category: 'avg_margin', targetValue: 18, actualValue: 16.2, unit: '%', period: '2026 Q2', status: 'at_risk' },
  { id: 'KPI-005', name: 'SLA Compliance', category: 'sla_compliance', targetValue: 98, actualValue: 94.3, unit: '%', period: '2026 Q2', status: 'at_risk' },
  { id: 'KPI-006', name: 'Customer Satisfaction', category: 'customer_satisfaction', targetValue: 4.5, actualValue: 4.2, unit: '/5', period: '2026 H1', status: 'on_track' },
];

const MONTHLY_DATA = [
  { month: 'Jan', target: 65, actual: 58 },
  { month: 'Feb', target: 66, actual: 62 },
  { month: 'Mar', target: 67, actual: 71 },
  { month: 'Apr', target: 68, actual: 64 },
  { month: 'May', target: 69, actual: 73 },
  { month: 'Jun', target: 70, actual: 65 },
];

const DEPARTMENT_SCORES = [
  { dept: 'Operations', score: 82, projects: 24 },
  { dept: 'Engineering', score: 78, projects: 18 },
  { dept: 'Finance', score: 91, projects: 12 },
  { dept: 'Legal', score: 95, projects: 8 },
  { dept: 'Marketing', score: 74, projects: 6 },
];

const KPI_ICONS: Record<string, string> = {
  win_rate: 'trending_up',
  revenue: 'payments',
  project_count: 'assignment',
  avg_margin: 'pie_chart',
  sla_compliance: 'verified',
  customer_satisfaction: 'star',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger'; icon: string }> = {
  on_track: { label: 'On Track', variant: 'success', icon: 'check_circle' },
  at_risk: { label: 'At Risk', variant: 'warning', icon: 'warning' },
  behind: { label: 'Behind', variant: 'danger', icon: 'error' },
  achieved: { label: 'Achieved', variant: 'success', icon: 'stars' },
};

export default function KPIDashboardPage() {
  const navigate = useNavigate();
  const [kpis] = useState<KpiTarget[]>(INITIAL_KPIS);
  const periods = useMasterPeriods();
  const periodOptions = useMemo(() => periods.map(p => ({ value: p.name, label: p.name })), [periods]);
  const defaultPeriod = periods.find(p => p.is_active)?.name || periods[0]?.name || '';
  const [periodFilter, setPeriodFilter] = useState(defaultPeriod);

  const formatValue = (kpi: KpiTarget) => {
    if (kpi.category === 'revenue') return `Rp ${(kpi.actualValue / 1000000000).toFixed(1)}B`;
    if (kpi.unit === '%') return `${kpi.actualValue}%`;
    if (kpi.unit === '/5') return kpi.actualValue.toFixed(1);
    return kpi.actualValue.toLocaleString();
  };

  const formatTarget = (kpi: KpiTarget) => {
    if (kpi.category === 'revenue') return `Rp ${(kpi.targetValue / 1000000000).toFixed(1)}B`;
    if (kpi.unit === '%') return `${kpi.targetValue}%`;
    if (kpi.unit === '/5') return kpi.targetValue.toFixed(1);
    return kpi.targetValue.toLocaleString();
  };

  const getProgress = (kpi: KpiTarget) => Math.min(100, Math.round((kpi.actualValue / kpi.targetValue) * 100));

  const filteredKpis = kpis.filter(k => k.period === periodFilter);

  const handleExport = () => {
    toast.success('Laporan KPI sedang diekspor.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-white border-b border-border/60 px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-card z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">KPI Dashboard</h2>
          <p className="text-[11px] text-outline mt-0.5">Ringkasan kinerja indikator utama organisasi secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>} onClick={handleExport} aria-label="Export laporan KPI">
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="flex items-center gap-3" role="toolbar" aria-label="Filter periode">
            <span className="text-xs font-semibold text-secondary">Periode:</span>
            <Select
              options={periodOptions}
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="w-40"
              aria-label="Pilih periode"
            />
          </div>

          {filteredKpis.length === 0 ? (
            <EmptyState icon="monitoring" title="Tidak ada KPI" description="Tidak ada data KPI untuk periode yang dipilih." />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Daftar KPI">
            {filteredKpis.map(kpi => {
              const progress = getProgress(kpi);
              const config = STATUS_CONFIG[kpi.status] || STATUS_CONFIG.on_track;
              const borderColor = kpi.status === 'behind' ? 'border-l-danger' : kpi.status === 'at_risk' ? 'border-l-warning' : 'border-l-success';
              return (
                <div key={kpi.id} className={`bg-white border border-border/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow border-l-4 ${borderColor}`} role="listitem" aria-label={`KPI ${kpi.name}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg ${kpi.status === 'behind' ? 'text-danger' : kpi.status === 'at_risk' ? 'text-warning' : 'text-success'}`} aria-hidden="true">{KPI_ICONS[kpi.category] || 'monitoring'}</span>
                      <h4 className="font-bold text-on-surface text-xs">{kpi.name}</h4>
                    </div>
                    <Badge variant={config.variant} size="sm">{config.label}</Badge>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-extrabold text-on-surface">{formatValue(kpi)}</span>
                    <span className="text-xs text-outline mb-1">/ {formatTarget(kpi)}</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress ${kpi.name}: ${progress}%`}>
                    <div className={`h-full rounded-full transition-all duration-500 ${kpi.status === 'on_track' ? 'bg-success' : kpi.status === 'at_risk' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-[10px] text-outline mt-1.5">{progress}% dari target • {kpi.period}</p>
                </div>
              );
            })}
          </div>)}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-border/60 rounded-2xl p-6 shadow-xs">
              <h4 className="font-bold text-on-surface text-xs mb-6">Win Rate Trend (YTD)</h4>
              <div className="h-56 flex items-end justify-between gap-3 px-2 border-b border-border" aria-label="Grafik tren win rate">
                {MONTHLY_DATA.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-[85%]">
                      <div className="w-1/3 bg-surface-container-highest rounded-t-xs transition-all group-hover:bg-primary-light" style={{ height: `${d.target}%` }} title={`Target: ${d.target}%`} role="img" aria-label={`Bulan ${d.month} target ${d.target}%`}></div>
                      <div className="w-1/3 bg-primary rounded-t-xs transition-all group-hover:bg-primary-light" style={{ height: `${d.actual}%` }} title={`Actual: ${d.actual}%`} role="img" aria-label={`Bulan ${d.month} aktual ${d.actual}%`}></div>
                    </div>
                    <span className="mt-2 text-[9px] font-bold text-outline">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5 text-[10px] text-secondary"><span className="w-3 h-3 bg-primary rounded-xs" aria-hidden="true"></span> Actual</div>
                <div className="flex items-center gap-1.5 text-[10px] text-secondary"><span className="w-3 h-3 bg-surface-container-highest rounded-xs" aria-hidden="true"></span> Target</div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-border/60 rounded-2xl p-6 shadow-xs">
              <h4 className="font-bold text-on-surface text-xs mb-4">Department Performance Scores</h4>
              <div className="space-y-4" role="list" aria-label="Skor performa departemen">
                {DEPARTMENT_SCORES.map(d => (
                  <div key={d.dept} className="space-y-1" role="listitem">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-on-surface">{d.dept}</span>
                      <span className="font-bold text-on-surface">{d.score}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={d.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Skor ${d.dept}: ${d.score}%`}>
                      <div className={`h-full rounded-full ${d.score >= 90 ? 'bg-success' : d.score >= 80 ? 'bg-primary' : d.score >= 70 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${d.score}%` }}></div>
                    </div>
                    <p className="text-[9px] text-outline">{d.projects} proyek aktif</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
