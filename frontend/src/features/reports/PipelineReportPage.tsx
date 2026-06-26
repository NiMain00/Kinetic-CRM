import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOrgBranches } from '@/hooks/useConfigData';

interface PipelineRecord {
  id: string;
  name: string;
  branch: string;
  stage: string;
  value: string;
  estClose: string;
}

const PIPELINE_RECORDS: PipelineRecord[] = [
  { id: 'PRJ-2024-0012', name: 'Modernization Grid - North Site', branch: 'Jakarta Pusat', stage: 'RKS / Prospek', value: 'Rp 42.500.000.000', estClose: '24 Nov 2024' },
  { id: 'PRJ-2024-0089', name: 'Data Center Expansion Phase 2', branch: 'Surabaya Hub', stage: 'Negosiasi Harga', value: 'Rp 128.800.000.000', estClose: '15 Dec 2024' },
  { id: 'PRJ-2024-0105', name: 'IoT Integration Fleet Management', branch: 'Medan Regional', stage: 'LPHS', value: 'Rp 12.450.000.000', estClose: '02 Dec 2024' },
  { id: 'PRJ-2024-0144', name: 'Substation Automation System', branch: 'Jakarta Pusat', stage: 'Management Apprv', value: 'Rp 254.000.000.000', estClose: '10 Jan 2025' },
  { id: 'PRJ-2024-0167', name: 'Fiber Optic Backhaul - Kalimantan', branch: 'Balikpapan Base', stage: 'RKS / Prospek', value: 'Rp 87.300.000.000', estClose: '20 Jan 2025' },
  { id: 'PRJ-2024-0198', name: 'Smart Traffic System - Bandung', branch: 'Bandung Utara', stage: 'Final Kontrak', value: 'Rp 22.100.000.000', estClose: '05 Dec 2024' },
];

const funnelSteps = [
  { id: '01', name: 'RKS / Prospek', count: '482 Projects', value: 'Rp 1.84T', color: 'bg-primary', scale: 'w-full' },
  { id: '02', name: 'LPHS', count: '315 Projects', value: 'Rp 1.12T', color: 'bg-[#1e5494]', scale: 'w-[90%]' },
  { id: '03', name: 'Negosiasi Harga', count: '224 Projects', value: 'Rp 840.5B', color: 'bg-[#3c6ca3]', scale: 'w-[80%]' },
  { id: '04', name: 'Management Apprv', count: '186 Projects', value: 'Rp 425.2B', color: 'bg-[#5a84b3]', scale: 'w-[70%]' },
  { id: '05', name: 'Final Kontrak', count: '41 Projects', value: 'Rp 54.1B', color: 'bg-[#789cc2]', scale: 'w-[60%]' },
];

export default function PipelineReportPage() {
  const navigate = useNavigate();
  const branches = useOrgBranches();
  const branchOptions = useMemo(() => branches.map(b => b.name), [branches]);
  const [viewMode, setViewMode] = useState<'count' | 'value'>('count');
  const [branchFilter, setBranchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PIPELINE_RECORDS.filter((r) => {
    const matchBranch = branchFilter === 'All' || r.branch === branchFilter;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBranch && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/reports')} className="hover:text-primary">Laporan</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Pipeline Report</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">Pipeline Report</h1>
            <p className="text-sm text-secondary mt-1">Analisis tahapan pipeline dan distribusi proyek aktif.</p>
          </div>
          <button onClick={() => toast.success('Export PDF sedang diproses.')} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-1.5" aria-label="Export PDF">
            <span className="material-symbols-outlined text-[18px] text-danger">picture_as_pdf</span>
            Export
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Pipeline Value</p>
              <p className="font-extrabold text-on-surface text-base">Rp 4.28T</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <span className="material-symbols-outlined text-2xl">assignment</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Active Projects</p>
              <p className="font-extrabold text-on-surface text-base">1,248</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Growth Forecast</p>
              <p className="font-extrabold text-indigo-600 text-base">+12.4%</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <div>
              <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Average Aging</p>
              <p className="font-extrabold text-on-surface text-base font-mono">42 Days</p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">filter_center_focus</span>
              Pipeline Stages
            </h3>
            <div className="inline-flex bg-surface-container-low p-1 rounded-lg border border-border">
              <button onClick={() => setViewMode('count')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'count' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}>By Count</button>
              <button onClick={() => setViewMode('value')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'value' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}>By Value</button>
            </div>
          </div>
          <div className="p-6 bg-surface-container-low/50 space-y-2 min-h-[240px] flex flex-col justify-center">
            {funnelSteps.map((step) => (
              <div key={step.id} className={`${step.scale} mx-auto transition-all duration-300 hover:-translate-y-0.5`}>
                <div className={`${step.color} hover:brightness-110 p-3.5 flex justify-between items-center text-white shadow-sm rounded-lg cursor-pointer`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">{step.id}</span>
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
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-border bg-surface-container-low flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="font-bold text-sm text-on-surface">Pipeline Details</h3>
            <div className="flex gap-3">
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white outline-none" aria-label="Filter cabang">
                <option value="All">Semua Cabang</option>
                {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-primary" placeholder="Cari proyek..." aria-label="Cari" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto table-mobile-compact">
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
                    <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface">{r.name}</p>
                        <p className="text-[10px] text-outline">{r.id}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary">{r.branch}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold badge-compact ${
                          r.stage === 'RKS / Prospek' ? 'bg-primary/10 text-primary' :
                          r.stage === 'LPHS' ? 'bg-status-teal/10 text-status-teal' :
                          r.stage === 'Negosiasi Harga' ? 'bg-warning/10 text-warning' :
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
            Menampilkan {filtered.length} dari {PIPELINE_RECORDS.length} records
          </div>
        </div>
      </div>
    </div>
  );
}
