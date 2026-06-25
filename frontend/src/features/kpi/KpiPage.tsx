import React, { useState } from 'react';
import toast from 'react-hot-toast';
import type { KpiTarget } from '@/types/domain/users';

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

export default function KpiPage() {
  const [kpis] = useState<KpiTarget[]>(INITIAL_KPIS);
  const [periodFilter, setPeriodFilter] = useState('2026 Q2');
  const [activeTab, setActiveTab] = useState<'overview' | 'targets'>('overview');

  const statusConfig = {
    on_track: { label: 'On Track', color: 'bg-success/10 text-success', icon: 'check_circle' },
    at_risk: { label: 'At Risk', color: 'bg-warning/10 text-warning', icon: 'warning' },
    behind: { label: 'Behind', color: 'bg-danger/10 text-danger', icon: 'error' },
    achieved: { label: 'Achieved', color: 'bg-emerald-50 text-emerald-700', icon: 'stars' },
  };

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

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Monitoring</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">KPI Dashboard</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">KPI Dashboard</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Monitor target kinerja utama organisasi secara real-time.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-border shrink-0 self-start sm:self-center">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Overview</button>
          <button onClick={() => { setActiveTab('targets'); toast.success('Mode pengaturan target diaktifkan.'); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'targets' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Target Settings</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Periode:</span>
              <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none">
                <option>2026 Q2</option>
                <option>2026 Q1</option>
                <option>2026 H1</option>
                <option>2025 FY</option>
              </select>
            </div>
            <button onClick={() => toast.success('Laporan KPI sedang diekspor.')} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs">
              <span className="material-symbols-outlined text-[16px]">file_download</span> Export
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.filter(k => k.period === periodFilter || k.period === '2026 H1').map(kpi => (
                  <div key={kpi.id} className={`bg-white border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow ${statusConfig[kpi.status].color.includes('danger') ? 'border-l-4 border-l-danger' : statusConfig[kpi.status].color.includes('warning') ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-success'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${statusConfig[kpi.status].color.split(' ')[0] === 'bg-success/10' ? 'text-success' : statusConfig[kpi.status].color.split(' ')[0] === 'bg-warning/10' ? 'text-warning' : 'text-danger'}`}>{statusConfig[kpi.status].icon}</span>
                        <h4 className="font-bold text-slate-800 text-xs">{kpi.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusConfig[kpi.status].color}`}>{statusConfig[kpi.status].label}</span>
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-2xl font-extrabold text-slate-800">{formatValue(kpi)}</span>
                      <span className="text-xs text-slate-400 mb-1">/ {formatTarget(kpi)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        kpi.status === 'on_track' ? 'bg-success' : kpi.status === 'at_risk' ? 'bg-warning' : 'bg-danger'
                      }`} style={{ width: `${getProgress(kpi)}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">{getProgress(kpi)}% dari target • {kpi.period}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-border rounded-xl p-6 shadow-xs">
                  <h4 className="font-bold text-slate-800 text-xs mb-6">Win Rate Trend (YTD)</h4>
                  <div className="h-56 flex items-end justify-between gap-3 px-2 border-b border-slate-200">
                    {MONTHLY_DATA.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-[85%]">
                          <div className="w-1/3 bg-slate-300 rounded-t-xs transition-all group-hover:brightness-110" style={{ height: `${d.target}%` }} title={`Target: ${d.target}%`}></div>
                          <div className="w-1/3 bg-primary rounded-t-xs transition-all group-hover:brightness-110" style={{ height: `${d.actual}%` }} title={`Actual: ${d.actual}%`}></div>
                        </div>
                        <span className="mt-2 text-[9px] font-bold text-slate-400">{d.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-3 h-3 bg-primary rounded-xs"></span> Actual</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-3 h-3 bg-slate-300 rounded-xs"></span> Target</div>
                  </div>
                </div>
                <div className="lg:col-span-5 bg-white border border-border rounded-xl p-6 shadow-xs">
                  <h4 className="font-bold text-slate-800 text-xs mb-4">Department Performance Scores</h4>
                  <div className="space-y-4">
                    {DEPARTMENT_SCORES.map(d => (
                      <div key={d.dept} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">{d.dept}</span>
                          <span className="font-bold text-slate-800">{d.score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.score >= 90 ? 'bg-success' : d.score >= 80 ? 'bg-primary' : d.score >= 70 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${d.score}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400">{d.projects} active projects</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'targets' && (
            <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 px-6 border-b border-border bg-slate-50">
                <h4 className="text-xs font-bold text-slate-800">KPI Target Configuration</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Atur target KPI untuk setiap kategori dan periode.</p>
              </div>
              <div className="overflow-x-auto table-mobile-compact">
                <table className="w-full text-xs text-left table-auto">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                      <th className="px-6 py-3.5">KPI Name</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5 text-right">Target</th>
                      <th className="px-6 py-3.5 text-right">Actual</th>
                      <th className="px-6 py-3.5 text-center">Progress</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5">Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {kpis.map(kpi => (
                      <tr key={kpi.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{kpi.name}</td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">{kpi.category.replace(/_/g, ' ')}</span></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{formatTarget(kpi)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{formatValue(kpi)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${kpi.status === 'on_track' ? 'bg-success' : kpi.status === 'at_risk' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${getProgress(kpi)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{getProgress(kpi)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${statusConfig[kpi.status].color}`}>{statusConfig[kpi.status].label}</span></td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{kpi.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-border flex justify-end">
                <button onClick={() => toast.success('Target KPI baru dapat ditambahkan di fase berikutnya.')} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-sm">Tambah Target Baru</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
