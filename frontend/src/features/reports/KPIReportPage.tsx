import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/stores/projectStore';
import type { KpiTarget } from '@/types/domain/users';

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function getKpiStatus(actual: number, target: number): KpiTarget['status'] {
  const ratio = target > 0 ? actual / target : 0;
  if (ratio >= 1.0) return 'achieved';
  if (ratio >= 0.9) return 'on_track';
  if (ratio >= 0.75) return 'at_risk';
  return 'behind';
}

const statusConfig: Record<string, { label: string; class: string; barClass: string }> = {
  achieved: { label: 'Tercapai', class: 'bg-success/10 text-success', barClass: 'bg-success' },
  on_track: { label: 'On Track', class: 'bg-info/10 text-info', barClass: 'bg-primary' },
  at_risk: { label: 'At Risk', class: 'bg-warning/10 text-warning', barClass: 'bg-warning' },
  behind: { label: 'Behind', class: 'bg-danger/10 text-danger', barClass: 'bg-danger' },
};

const formatValue = (kpi: KpiTarget) => {
  if (kpi.unit === 'Rp') return formatCurrency(kpi.actualValue);
  if (kpi.unit === '/5') return kpi.actualValue.toFixed(1);
  if (kpi.unit === '%') return `${kpi.actualValue}%`;
  return `${kpi.actualValue}${kpi.unit}`;
};

const formatTarget = (kpi: KpiTarget) => {
  if (kpi.unit === 'Rp') return formatCurrency(kpi.targetValue);
  if (kpi.unit === '/5') return kpi.targetValue.toFixed(1);
  if (kpi.unit === '%') return `${kpi.targetValue}%`;
  return `${kpi.targetValue}${kpi.unit}`;
};

const getPercent = (actual: number, target: number) => Math.min(100, Math.round((actual / target) * 100));

export default function KPIReportPage() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const [period, setPeriod] = useState('2024');

  const kpiData = useMemo((): KpiTarget[] => {
    const won = projects.filter((p) => p.winnerDetails?.outcome === 'menang').length;
    const lost = projects.filter((p) => p.winnerDetails?.outcome === 'kalah').length;
    const totalDecided = won + lost;
    const winRate = totalDecided > 0 ? Math.round((won / totalDecided) * 100) : 0;

    const totalRevenue = projects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const totalProjects = projects.length;

    const projectsWithMargin = projects.filter((p) => p.pricing?.margin != null);
    const avgMargin = projectsWithMargin.length > 0
      ? Math.round((projectsWithMargin.reduce((sum, p) => sum + (p.pricing?.margin || 0), 0) / projectsWithMargin.length) * 10) / 10
      : 0;

    const projectsWithDelivery = projects.filter((p) => p.delivery?.milestones && p.delivery.milestones.length > 0);
    const slaCompliant = projectsWithDelivery.filter((p) =>
      p.delivery!.milestones!.every((m) => m.completed)
    ).length;
    const slaRate = projectsWithDelivery.length > 0
      ? Math.round((slaCompliant / projectsWithDelivery.length) * 100)
      : 0;

    const onTrack = projects.filter((p) => p.status === 'Executing' || p.status === 'Target Delivery').length;
    const onTrackPct = totalProjects > 0 ? Math.round((onTrack / totalProjects) * 100) : 0;

    return [
      {
        id: 'kpi-1',
        name: 'Win Rate',
        category: 'win_rate',
        targetValue: 75,
        actualValue: winRate,
        unit: '%',
        period,
        status: getKpiStatus(winRate, 75),
      },
      {
        id: 'kpi-2',
        name: 'Total Pipeline Revenue',
        category: 'revenue',
        targetValue: Math.max(totalRevenue, 500_000_000_000),
        actualValue: totalRevenue,
        unit: 'Rp',
        period,
        status: totalRevenue >= 500_000_000_000 ? 'on_track' : 'at_risk',
      },
      {
        id: 'kpi-3',
        name: 'Project Count',
        category: 'project_count',
        targetValue: Math.max(totalProjects, 50),
        actualValue: totalProjects,
        unit: ' proyek',
        period,
        status: totalProjects >= 10 ? 'on_track' : totalProjects >= 5 ? 'at_risk' : 'behind',
      },
      {
        id: 'kpi-4',
        name: 'Average Margin',
        category: 'avg_margin',
        targetValue: 20,
        actualValue: avgMargin,
        unit: '%',
        period,
        status: getKpiStatus(avgMargin, 20),
      },
      {
        id: 'kpi-5',
        name: 'SLA Compliance',
        category: 'sla_compliance',
        targetValue: 98,
        actualValue: slaRate,
        unit: '%',
        period,
        status: getKpiStatus(slaRate, 98),
      },
      {
        id: 'kpi-6',
        name: 'On Track Projects',
        category: 'customer_satisfaction',
        targetValue: Math.max(totalProjects, 10),
        actualValue: onTrackPct,
        unit: '%',
        period,
        status: getKpiStatus(onTrackPct, 80),
      },
    ];
  }, [projects, period]);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/reports')} className="hover:text-primary">Laporan</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">KPI Report</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">KPI Report</h1>
            <p className="text-sm text-secondary mt-1">Key Performance Indicators - Target vs Realisasi.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border border-border rounded-lg px-4 py-2 text-sm bg-white outline-none" aria-label="Periode">
              <option>2024</option>
              <option>2025</option>
              <option>2026</option>
            </select>
            <button onClick={() => toast.success('Export KPI Report sedang diproses.')} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5" aria-label="Export">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.slice(0, 4).map((kpi) => {
            const cfg = statusConfig[kpi.status] || statusConfig.on_track;
            return (
              <div key={kpi.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">{kpi.name}</p>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${cfg.class}`}>{cfg.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-on-surface">{formatValue(kpi)}</span>
                  <span className="text-xs text-outline">/ {formatTarget(kpi)}</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${cfg.barClass} h-full rounded-full transition-all`} style={{ width: `${getPercent(kpi.actualValue, kpi.targetValue)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Full KPI Table */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-sm text-on-surface">Detail KPI Metrics</h3>
          </div>
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-left text-sm table-auto" aria-label="KPI Metrics">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-3.5 font-semibold">KPI</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Target</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actual</th>
                  <th className="px-6 py-3.5 font-semibold">Progress</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kpiData.map((kpi) => {
                  const cfg = statusConfig[kpi.status] || statusConfig.on_track;
                  const pct = getPercent(kpi.actualValue, kpi.targetValue);
                  return (
                    <tr key={kpi.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-semibold text-on-surface">{kpi.name}</td>
                      <td className="px-6 py-4 text-right font-mono text-secondary">{formatTarget(kpi)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-on-surface">{formatValue(kpi)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[200px]">
                            <div className={`${cfg.barClass} h-full rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-secondary w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold badge-compact ${cfg.class}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-low border-t border-border text-xs text-secondary text-center">
            Periode: {period} — {kpiData.length} KPI metrics
          </div>
        </div>
      </div>
    </div>
  );
}
