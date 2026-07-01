import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Select, Table } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { KpiTarget } from '@/types/domain/users';
import { useMasterPeriods } from '@/hooks/useConfigData';

interface KpiProgressRow extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  period: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  progress: number;
  status: KpiTarget['status'];
  trend: number[];
}

interface DepartmentBreakdown {
  department: string;
  kpiCount: number;
  avgProgress: number;
  onTrack: number;
  atRisk: number;
  behind: number;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'project_count', label: 'Project Count' },
  { value: 'avg_margin', label: 'Average Margin' },
  { value: 'sla_compliance', label: 'SLA Compliance' },
  { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
];

// PERIOD_OPTIONS now built dynamically in the component via useMasterPeriods()

const CATEGORY_LABELS: Record<string, string> = {
  win_rate: 'Win Rate',
  revenue: 'Revenue',
  project_count: 'Project Count',
  avg_margin: 'Average Margin',
  sla_compliance: 'SLA Compliance',
  customer_satisfaction: 'Customer Satisfaction',
};

const PROGRESS_DATA: KpiProgressRow[] = [
  { id: 'KPI-001', name: 'Win Rate', category: 'win_rate', categoryLabel: 'Win Rate', period: '2026 Q2', targetValue: 70, actualValue: 65.5, unit: '%', progress: 94, status: 'at_risk', trend: [58, 62, 71, 64, 73, 65] },
  { id: 'KPI-002', name: 'Total Revenue', category: 'revenue', categoryLabel: 'Revenue', period: '2026 H1', targetValue: 500000000000, actualValue: 425000000000, unit: 'IDR', progress: 85, status: 'on_track', trend: [310, 345, 370, 390, 410, 425] },
  { id: 'KPI-003', name: 'Project Completion', category: 'project_count', categoryLabel: 'Project Count', period: '2026 Q2', targetValue: 48, actualValue: 36, unit: 'projects', progress: 75, status: 'behind', trend: [5, 11, 17, 23, 29, 36] },
  { id: 'KPI-004', name: 'Average Margin', category: 'avg_margin', categoryLabel: 'Average Margin', period: '2026 Q2', targetValue: 18, actualValue: 16.2, unit: '%', progress: 90, status: 'at_risk', trend: [14.2, 14.8, 15.5, 15.8, 16.0, 16.2] },
  { id: 'KPI-005', name: 'SLA Compliance', category: 'sla_compliance', categoryLabel: 'SLA Compliance', period: '2026 Q2', targetValue: 98, actualValue: 94.3, unit: '%', progress: 96, status: 'at_risk', trend: [91, 92.5, 93, 93.8, 94.1, 94.3] },
  { id: 'KPI-006', name: 'Customer Satisfaction', category: 'customer_satisfaction', categoryLabel: 'Customer Satisfaction', period: '2026 H1', targetValue: 4.5, actualValue: 4.2, unit: '/5', progress: 93, status: 'on_track', trend: [3.8, 3.9, 4.0, 4.1, 4.2, 4.2] },
];

const DEPARTMENT_BREAKDOWNS: DepartmentBreakdown[] = [
  { department: 'Operations', kpiCount: 3, avgProgress: 83, onTrack: 1, atRisk: 1, behind: 1 },
  { department: 'Engineering', kpiCount: 2, avgProgress: 79, onTrack: 0, atRisk: 2, behind: 0 },
  { department: 'Finance', kpiCount: 1, avgProgress: 92, onTrack: 1, atRisk: 0, behind: 0 },
  { department: 'Legal', kpiCount: 1, avgProgress: 96, onTrack: 1, atRisk: 0, behind: 0 },
  { department: 'Marketing', kpiCount: 1, avgProgress: 75, onTrack: 0, atRisk: 0, behind: 1 },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  on_track: 'success',
  at_risk: 'warning',
  behind: 'danger',
  achieved: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  behind: 'Behind',
  achieved: 'Achieved',
};

const CATEGORY_ICONS: Record<string, string> = {
  win_rate: 'trending_up',
  revenue: 'payments',
  project_count: 'assignment',
  avg_margin: 'pie_chart',
  sla_compliance: 'verified',
  customer_satisfaction: 'star',
};

function TrendSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  const isUp = data[data.length - 1] >= data[0];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Tren: ${isUp ? 'meningkat' : 'menurun'}`}>
      <svg width={width} height={height} className="overflow-visible" role="img" aria-hidden="true">
        <polyline points={points} fill="none" stroke={isUp ? '#16a34a' : '#dc2626'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="2" fill={isUp ? '#16a34a' : '#dc2626'} />
      </svg>
      <span className={`text-[10px] font-bold ${isUp ? 'text-success' : 'text-danger'}`}>
        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{isUp ? 'trending_up' : 'trending_down'}</span>
      </span>
    </div>
  );
}

export default function KPIProgressPage() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const periods = useMasterPeriods();
  const periodOptions = useMemo(() => [
    { value: 'all', label: 'Semua Periode' },
    ...periods.map(p => ({ value: p.name, label: p.name })),
  ], [periods]);
  const [periodFilter, setPeriodFilter] = useState('all');

  const filteredData = PROGRESS_DATA.filter(row => {
    const matchCategory = categoryFilter === 'all' || row.category === categoryFilter;
    const matchPeriod = periodFilter === 'all' || row.period === periodFilter;
    return matchCategory && matchPeriod;
  });

  const formatTarget = (row: KpiProgressRow) => {
    if (row.category === 'revenue') return `Rp ${(row.targetValue / 1000000000).toFixed(1)}B`;
    if (row.unit === '%') return `${row.targetValue}%`;
    if (row.unit === '/5') return row.targetValue.toFixed(1);
    return row.targetValue.toLocaleString();
  };

  const formatActual = (row: KpiProgressRow) => {
    if (row.category === 'revenue') return `Rp ${(row.actualValue / 1000000000).toFixed(1)}B`;
    if (row.unit === '%') return `${row.actualValue}%`;
    if (row.unit === '/5') return row.actualValue.toFixed(1);
    return row.actualValue.toLocaleString();
  };

  const columns: Column<KpiProgressRow>[] = [
    {
      key: 'name',
      header: 'KPI Name',
      render: row => (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline" aria-hidden="true">{CATEGORY_ICONS[row.category] || 'monitoring'}</span>
          <span className="font-bold text-on-surface text-xs">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'categoryLabel',
      header: 'Category',
      render: row => <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-semibold text-on-surface-variant">{row.categoryLabel}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      render: row => <span className="text-outline font-mono text-[10px]">{row.period}</span>,
    },
    {
      key: 'targetValue',
      header: 'Target',
      align: 'right',
      render: row => <span className="font-mono font-bold text-on-surface text-xs">{formatTarget(row)}</span>,
    },
    {
      key: 'actualValue',
      header: 'Actual',
      align: 'right',
      render: row => <span className="font-mono font-bold text-on-surface text-xs">{formatActual(row)}</span>,
    },
    {
      key: 'progress',
      header: 'Progress',
      align: 'center',
      render: row => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden" role="progressbar" aria-valuenow={row.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress ${row.name}: ${row.progress}%`}>
            <div className={`h-full rounded-full ${row.status === 'on_track' ? 'bg-success' : row.status === 'at_risk' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${row.progress}%` }}></div>
          </div>
          <span className="text-[10px] font-bold text-secondary w-8 text-right">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: row => <Badge variant={STATUS_VARIANT[row.status]} size="sm">{STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: 'trend',
      header: 'Trend',
      align: 'center',
      render: row => <TrendSparkline data={row.trend} />,
    },
  ];

  const progressTrend = filteredData.length > 0
    ? filteredData.reduce((s, r) => s + r.progress, 0) / filteredData.length
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-white border-b border-border/60 px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-card z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">KPI Progress Monitoring</h2>
          <p className="text-[11px] text-outline mt-0.5">Pantau perkembangan KPI secara detail per kategori dan periode.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>} onClick={() => toast.success('Laporan progress sedang diekspor.')} aria-label="Export data progress">
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Select
                label="Kategori"
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                aria-label="Filter kategori KPI"
              />
            </div>
            <div>
              <Select
                label="Periode"
                options={periodOptions}
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value)}
                aria-label="Filter periode KPI"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCategoryFilter('all'); setPeriodFilter('all'); toast.success('Filter direset.'); }}
                aria-label="Reset filter"
              >
                Reset Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">speed</span>
                <span className="text-[10px] font-semibold text-secondary">Avg Progress</span>
              </div>
              <p className="text-xl font-extrabold text-on-surface">{progressTrend.toFixed(0)}%</p>
              <p className="text-[10px] text-outline">{filteredData.length} KPI aktif</p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-success" aria-hidden="true">check_circle</span>
                <span className="text-[10px] font-semibold text-secondary">On Track</span>
              </div>
              <p className="text-xl font-extrabold text-success">{filteredData.filter(r => r.status === 'on_track').length}</p>
              <p className="text-[10px] text-outline">KPI sesuai target</p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-warning" aria-hidden="true">warning</span>
                <span className="text-[10px] font-semibold text-secondary">At Risk</span>
              </div>
              <p className="text-xl font-extrabold text-warning">{filteredData.filter(r => r.status === 'at_risk').length}</p>
              <p className="text-[10px] text-outline">Perlu perhatian</p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-danger" aria-hidden="true">error</span>
                <span className="text-[10px] font-semibold text-secondary">Behind</span>
              </div>
              <p className="text-xl font-extrabold text-danger">{filteredData.filter(r => r.status === 'behind').length}</p>
              <p className="text-[10px] text-outline">Butuh tindakan segera</p>
            </Card>
          </div>

          <Card padding="none" header={
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-on-surface text-xs">Detail Progress KPI</h4>
              <span className="text-[10px] text-outline">{filteredData.length} items</span>
            </div>
          }>
            <Table<KpiProgressRow>
              columns={columns}
              data={filteredData}
              keyExtractor={row => row.id}
              emptyState={
                <div className="space-y-2">
                  <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">search_off</span>
                  <p className="text-sm">Tidak ada data KPI ditemukan.</p>
                </div>
              }
            />
          </Card>

          <div className="bg-white border border-border/60 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border">
              <h4 className="font-bold text-on-surface text-xs">Department Breakdown</h4>
              <p className="text-[10px] text-outline mt-0.5">Rincian progress KPI per departemen</p>
            </div>
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" aria-label="Tabel breakdown departemen">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-secondary uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5 text-center">Total KPI</th>
                    <th className="px-6 py-3.5 text-center">Avg Progress</th>
                    <th className="px-6 py-3.5 text-center">On Track</th>
                    <th className="px-6 py-3.5 text-center">At Risk</th>
                    <th className="px-6 py-3.5 text-center">Behind</th>
                    <th className="px-6 py-3.5">Progress Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {DEPARTMENT_BREAKDOWNS.map(d => (
                    <tr key={d.department} className="hover:bg-surface-container-low/65 transition-colors">
                      <td className="px-6 py-4 font-bold text-on-surface">{d.department}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-on-surface-variant">{d.kpiCount}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-on-surface-variant">{d.avgProgress}%</td>
                      <td className="px-6 py-4 text-center"><span className="text-success font-bold">{d.onTrack}</span></td>
                      <td className="px-6 py-4 text-center"><span className="text-warning font-bold">{d.atRisk}</span></td>
                      <td className="px-6 py-4 text-center"><span className="text-danger font-bold">{d.behind}</span></td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden" role="progressbar" aria-valuenow={d.avgProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress ${d.department}: ${d.avgProgress}%`}>
                          <div className={`h-full rounded-full ${d.avgProgress >= 90 ? 'bg-success' : d.avgProgress >= 80 ? 'bg-primary' : d.avgProgress >= 70 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${d.avgProgress}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
