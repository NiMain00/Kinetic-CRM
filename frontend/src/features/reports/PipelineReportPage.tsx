import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useOrgBranches } from '@/hooks/useConfigData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { exportCSV } from '@/utils/export';
import { formatCurrencyShort as formatCurrency } from '@/utils/formatters';

const STAGE_ORDER = ['RKS / Prospek', 'LPHS', 'Negosiasi Harga', 'Management Apprv', 'Final Kontrak'] as const;

const STATUS_TO_STAGE: Record<string, string> = {
  'RKS': 'RKS / Prospek',
  'LPHS/SIOS': 'LPHS',
  'Input Harga': 'Negosiasi Harga',
  'Pemenang': 'Management Apprv',
};

const STAGE_COLORS = [
  'bg-primary',
  'bg-[#1e5494]',
  'bg-[#3c6ca3]',
  'bg-[#5a84b3]',
  'bg-[#789cc2]',
];

interface PipelineRecord {
  id: string;
  name: string;
  branch: string;
  stage: string;
  value: string;
  estClose: string;
}

export default function PipelineReportPage() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const branches = useOrgBranches();
  const branchOptions = useMemo(() => branches.map(b => b.name), [branches]);
  const [viewMode, setViewMode] = useState<'count' | 'value'>('count');
  const [branchFilter, setBranchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { pipelineRecords, funnelSteps, totalPipelineValue, totalActiveProjects, growthForecast, avgAging } = useMemo(() => {
    const pipelineRecords: PipelineRecord[] = projects.map((p) => ({
      id: p.code || p.id,
      name: p.name,
      branch: p.location || '-',
      stage: STATUS_TO_STAGE[p.status] || p.status,
      value: formatCurrency(p.estimatedValue || 0),
      estClose: p.deadlineTender || p.date || '-',
    }));

    const totalPipelineValue = projects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const totalActiveProjects = projects.length;

    // Group by stage
    const stageMap = new Map<string, { count: number; value: number }>();
    STAGE_ORDER.forEach((s) => stageMap.set(s, { count: 0, value: 0 }));
    const otherStage = new Map<string, { count: number; value: number }>();

    projects.forEach((p) => {
      const stage = STATUS_TO_STAGE[p.status] || 'Lainnya';
      const val = p.estimatedValue || 0;
      if (stageMap.has(stage)) {
        const entry = stageMap.get(stage)!;
        entry.count++;
        entry.value += val;
      } else {
        const entry = otherStage.get(stage) || { count: 0, value: 0 };
        entry.count++;
        entry.value += val;
        otherStage.set(stage, entry);
      }
    });

    // Build funnel with all stages that have data (including non-empty)
    const allStages = [...STAGE_ORDER.filter((s) => (stageMap.get(s)?.count || 0) > 0)];
    const maxCount = Math.max(1, ...Array.from(stageMap.values()).map((s) => s.count));
    const maxValue = Math.max(1, ...Array.from(stageMap.values()).map((s) => s.value));
    const maxForScale = viewMode === 'count' ? maxCount : maxValue;

    const funnelSteps = allStages.map((name, i) => {
      const data = stageMap.get(name)!;
      const scaleVal = viewMode === 'count' ? data.count : data.value;
      const scalePct = Math.max(20, Math.round((scaleVal / maxForScale) * 100));
      // Map scalePct (20-100) to tailish width classes
      const scaleClass = scalePct >= 95 ? 'w-full' :
        scalePct >= 80 ? 'w-[90%]' :
        scalePct >= 65 ? 'w-[80%]' :
        scalePct >= 50 ? 'w-[70%]' :
        scalePct >= 35 ? 'w-[60%]' : 'w-[50%]';

      return {
        id: String(i + 1).padStart(2, '0'),
        name,
        count: `${data.count} Project${data.count !== 1 ? 's' : ''}`,
        value: formatCurrency(data.value),
        color: STAGE_COLORS[i] || 'bg-primary',
        scale: scaleClass,
      };
    });

    // Growth forecast: YoY comparison
    const thisYear = projects.filter((p) => new Date(p.date).getFullYear() === 2025).length;
    const lastYear = projects.filter((p) => new Date(p.date).getFullYear() === 2024).length;
    const growthForecast = lastYear > 0 ? `+${Math.round(((thisYear - lastYear) / lastYear) * 100)}%` : '+0%';

    // Average aging: average days since project creation
    const now = new Date();
    const agingDays = projects
      .map((p) => {
        const d = new Date(p.date);
        return isNaN(d.getTime()) ? 0 : Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter((days) => days > 0);
    const avgAging = agingDays.length > 0
      ? `${Math.round(agingDays.reduce((a, b) => a + b, 0) / agingDays.length)} Days`
      : '-';

    return { pipelineRecords, funnelSteps, totalPipelineValue, totalActiveProjects, growthForecast, avgAging };
  }, [projects, viewMode]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return pipelineRecords.filter((r) => {
      const matchBranch = branchFilter === 'All' || r.branch === branchFilter;
      const matchSearch = !q || r.name.toLowerCase().includes(q);
      return matchBranch && matchSearch;
    });
  }, [pipelineRecords, branchFilter, debouncedSearch]);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">Pipeline Report</h1>
            <p className="text-sm text-secondary mt-1">Analisis tahapan pipeline dan distribusi proyek aktif.</p>
          </div>
          <button onClick={() => exportCSV(
            filtered,
            [
              { header: 'Nama Proyek', accessor: (r) => `${r.name} (${r.id})` },
              { header: 'Cabang', accessor: (r) => r.branch },
              { header: 'Stage', accessor: (r) => r.stage },
              { header: 'Nilai', accessor: (r) => r.value },
              { header: 'Est. Close', accessor: (r) => r.estClose },
            ],
            'pipeline_report',
          )} className="px-4 py-2 border border-border/60 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" aria-label="Export CSV">
            <span className="material-symbols-outlined text-[18px] text-primary">file_download</span>
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Pipeline Value</p>
              <p className="font-extrabold text-on-surface text-base">{formatCurrency(totalPipelineValue)}</p>
            </div>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 shrink-0">
              <span className="material-symbols-outlined text-2xl">assignment</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Active Projects</p>
              <p className="font-extrabold text-on-surface text-base">{totalActiveProjects}</p>
            </div>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Growth Forecast</p>
              <p className="font-extrabold text-indigo-600 text-base">{growthForecast}</p>
            </div>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Average Aging</p>
              <p className="font-extrabold text-on-surface text-base font-mono">{avgAging}</p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">filter_center_focus</span>
              Pipeline Stages
            </h3>
            <div className="inline-flex bg-surface-container-low p-1 rounded-lg border border-border">
              <button onClick={() => setViewMode('count')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'count' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary'}`}>By Count</button>
              <button onClick={() => setViewMode('value')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'value' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary'}`}>By Value</button>
            </div>
          </div>
          <div className="p-6 bg-surface-container-low/50 space-y-2 min-h-[240px] flex flex-col justify-center">
            {funnelSteps.map((step) => (
              <div key={step.id} className={`${step.scale} mx-auto transition-all duration-300 hover:-translate-y-0.5`}>
                <div className={`${step.color} hover:bg-primary-light p-3.5 flex justify-between items-center text-white shadow-card rounded-xl cursor-pointer`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-surface/20 flex items-center justify-center font-bold text-[10px]">{step.id}</span>
                    <span className="font-bold text-xs">{step.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">{viewMode === 'count' ? step.count : step.value}</p>
                    <p className="text-[9px] opacity-80 uppercase tracking-wider">{viewMode === 'count' ? `Value: ${step.value}` : `Count: ${step.count}`}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Table */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 px-6 border-b border-border/60 bg-surface-container-low flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="font-bold text-sm text-on-surface">Pipeline Details</h3>
            <div className="flex gap-3">
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="border border-border/60 rounded-xl px-3 py-1.5 text-sm bg-surface outline-none" aria-label="Filter cabang">
                <option value="All">Semua Cabang</option>
                {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-border/60 rounded-xl text-sm bg-surface outline-none focus:ring-1 focus:ring-primary" placeholder="Cari proyek..." aria-label="Cari" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-none table-mobile-compact">
            <table className="w-full text-left text-sm table-auto" aria-label="Pipeline Records">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-3.5 font-semibold">Nama Proyek</th>
                  <th className="px-6 py-3.5 font-semibold">Cabang</th>
                  <th className="px-6 py-3.5 font-semibold">Stage</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Nilai</th>
                  <th className="px-6 py-3.5 font-semibold">Est. Close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-secondary italic">Tidak ada data ditemukan.</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface">{r.name}</p>
                        <p className="text-[10px] text-outline">{r.id}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary">{r.branch}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold badge-compact ${
                          r.stage === 'RKS / Prospek' ? 'bg-primary/10 text-primary' :
                          r.stage === 'LPHS' ? 'bg-status-teal/10 text-status-teal' :
                          r.stage === 'Negosiasi Harga' ? 'bg-gold/10 text-gold' :
                          r.stage === 'Management Apprv' ? 'bg-status-purple/10 text-status-purple' :
                          'bg-success/10 text-success'
                        }`}>{r.stage}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{r.value}</td>
                      <td className="px-6 py-4 text-outline">{r.estClose}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-low border-t border-border text-xs text-secondary text-center">
            Menampilkan {filtered.length} dari {pipelineRecords.length} records
          </div>
        </div>
      </div>
    </div>
  );
}
