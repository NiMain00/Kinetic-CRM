import React, { useState, useMemo } from 'react';
import { useOrgBranches } from '@/hooks/useConfigData';

interface ReportsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

// Interfaces for structured data
interface WinLossRecord {
  id: string;
  name: string;
  client: string;
  value: string;
  result: 'WIN' | 'LOSS';
  competitor: string;
  date: string;
  description: string;
}

interface PipelineRecord {
  id: string;
  name: string;
  branch: string;
  stage: 'RKS / Prospek' | 'LPHS' | 'Negosiasi Harga' | 'Management Apprv' | 'Final Kontrak';
  value: string;
  estClose: string;
}

const INITIAL_WIN_LOSS_RECORDS: WinLossRecord[] = [
  {
    id: 'PRJ-2023-089',
    name: 'MRT Phase 2B Signaling',
    client: 'Dishub DKI Jakarta',
    value: 'Rp 42.5B',
    result: 'WIN',
    competitor: '-',
    date: '12 Oct 2023',
    description: 'Full signaling implementation for MRT phase 2B starting from Bundaran HI to Ancol region. Features train control integration.'
  },
  {
    id: 'PRJ-2023-102',
    name: 'Digital Tower Control - Medan',
    client: 'Angkasa Pura II',
    value: 'Rp 12.8B',
    result: 'LOSS',
    competitor: 'IndoTech Solutions',
    date: '08 Oct 2023',
    description: 'Full implementation of automated digital tower systems including radio management, VoIP integration, and AI-driven airspace monitoring for Medan Hub.'
  },
  {
    id: 'PRJ-2023-114',
    name: 'Smart City Cloud Integration',
    client: 'Pemkot Surabaya',
    value: 'Rp 7.2B',
    result: 'WIN',
    competitor: '-',
    date: '05 Oct 2023',
    description: 'Multi-tenant cloud platform to consolidate municipal utilities, citizen feedback metrics, and civil state databases.'
  },
  {
    id: 'PRJ-2023-118',
    name: 'Cybersecurity Audit Framework',
    client: 'Bank Mandiri (Persero)',
    value: 'Rp 3.5B',
    result: 'LOSS',
    competitor: 'SecureLine Ltd',
    date: '01 Oct 2023',
    description: 'Vulnerability assessment, penetration testing, and regulatory security audit alignment across 1,200 regional branches.'
  },
  {
    id: 'PRJ-2023-125',
    name: 'Logistics Hub IoT Network',
    client: 'PT Pos Indonesia',
    value: 'Rp 18.9B',
    result: 'WIN',
    competitor: '-',
    date: '28 Sep 2023',
    description: 'Automated telemetry network for container tracking, RFID entry logs, and machine vision weight checkpoints in 5 key warehouses.'
  }
];

const INITIAL_PIPELINE_RECORDS: PipelineRecord[] = [
  { id: 'PRJ-2024-0012', name: 'Modernization Grid - North Site', branch: 'Jakarta Pusat', stage: 'RKS / Prospek', value: 'Rp 42.500.000.000', estClose: '24 Nov 2024' },
  { id: 'PRJ-2024-0089', name: 'Data Center Expansion Phase 2', branch: 'Surabaya Hub', stage: 'Negosiasi Harga', value: 'Rp 128.800.000.000', estClose: '15 Dec 2024' },
  { id: 'PRJ-2024-0105', name: 'IoT Integration Fleet Management', branch: 'Medan Regional', stage: 'LPHS', value: 'Rp 12.450.000.000', estClose: '02 Dec 2024' },
  { id: 'PRJ-2024-0144', name: 'Substation Automation System', branch: 'Jakarta Pusat', stage: 'Management Apprv', value: 'Rp 254.000.000.000', estClose: '10 Jan 2025' }
];

type ReportTab = 'winloss' | 'pipeline';

export default function ReportsView({ onShowNotification }: ReportsViewProps) {
  const branches = useOrgBranches();
  const branchOptions = useMemo(() => branches.map(b => b.name), [branches]);
  const [activeSubTab, setActiveTab] = useState<ReportTab>('winloss');

  // Win/Loss variables and states
  const [winLossFilterDate, setWinLossFilterDate] = useState('Bulan Saat Ini (Okt 2023)');
  const [winLossFilterBranch, setWinLossFilterBranch] = useState('Semua Cabang (Indonesia)');
  const [winLossFilterCategory, setWinLossFilterCategory] = useState('Semua Kategori');
  const [winLossFilterType, setWinLossFilterType] = useState('Semua Tipe');
  const [winLossSearch, setWinLossSearch] = useState('');
  const [selectedWinLoss, setSelectedWinLoss] = useState<WinLossRecord | null>(null);

  // Pipeline variables and states
  const [pipelineFilterBranch, setPipelineFilterBranch] = useState('Semua Cabang Indonesia');
  const [pipelineFilterDivision, setPipelineFilterDivision] = useState('Semua Divisi');
  const [pipelineFilterCategory, setPipelineFilterCategory] = useState('Semua Kategori');
  const [pipelineFilterClose, setPipelineFilterClose] = useState('Q4 2024');
  const [pipelineViewMode, setPipelineViewMode] = useState<'count' | 'value'>('count');
  const [pipelineSearch, setPipelineSearch] = useState('');

  // Win/loss chart monthly dataset
  const winLossChartData = [
    { label: 'Jan', win: 40, loss: 20 },
    { label: 'Feb', win: 55, loss: 25 },
    { label: 'Mar', win: 70, loss: 15 },
    { label: 'Apr', win: 45, loss: 50 },
    { label: 'May', win: 60, loss: 30 },
    { label: 'Jun', win: 65, loss: 20 },
    { label: 'Jul', win: 85, loss: 10 },
    { label: 'Aug', win: 50, loss: 40 },
    { label: 'Sep', win: 55, loss: 35 },
    { label: 'Oct', win: 95, loss: 5 }
  ];

  // Pipeline funnel steps dataset
  const funnelSteps = [
    { id: '01', name: 'RKS / Prospek', count: '482 Proyek', value: 'Rp 1.84T', metric: '482 Proyek', val: 'Rp 1.84T', scale: 'w-full', color: 'bg-primary' },
    { id: '02', name: 'Penyusunan LPHS', count: '315 Proyek', value: 'Rp 1.12T', metric: '315 Proyek', val: 'Rp 1.12T', scale: 'w-[90%]', color: 'bg-[#1e5494]' },
    { id: '03', name: 'Negosiasi Harga', count: '224 Proyek', value: 'Rp 840.5B', metric: '224 Proyek', val: 'Rp 840.5B', scale: 'w-[80%]', color: 'bg-[#3c6ca3]' },
    { id: '04', name: 'Approval Management', count: '186 Proyek', value: 'Rp 425.2B', metric: '186 Proyek', val: 'Rp 425.2B', scale: 'w-[70%]', color: 'bg-[#5a84b3]' },
    { id: '05', name: 'Final Kontrak', count: '41 Proyek', value: 'Rp 54.1B', metric: '41 Proyek', val: 'Rp 54.1B', scale: 'w-[60%]', color: 'bg-[#789cc2]' }
  ];

  const handleResetWinLossFilters = () => {
    setWinLossFilterDate('Bulan Saat Ini (Okt 2023)');
    setWinLossFilterBranch('Semua Cabang (Indonesia)');
    setWinLossFilterCategory('Semua Kategori');
    setWinLossFilterType('Semua Tipe');
    setWinLossSearch('');
    onShowNotification('Filter Laporan Win/Loss telah dikembalikan ke draf semula.', 'success');
  };

  const handleResetPipelineFilters = () => {
    setPipelineFilterBranch('Semua Cabang Indonesia');
    setPipelineFilterDivision('Semua Divisi');
    setPipelineFilterCategory('Semua Kategori');
    setPipelineFilterClose('Q4 2024');
    setPipelineSearch('');
    onShowNotification('Filter Laporan Pipeline telah direset.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      
      {/* Tab Switcher & Page Header bar */}
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">
            {activeSubTab === 'winloss' ? 'Laporan Performa Menang/Kalah' : 'Laporan Siklus Pipeline'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Analisis performa real-time, saringan tender nasional, serta visualisasi funnel regional.</p>
        </div>

        {/* Dynamic header navigation selection switcher based on user HTML requests */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-border shrink-0 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('winloss')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'winloss' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Menang/Kalah
          </button>
          <button
            onClick={() => {
              setActiveTab('pipeline');
              onShowNotification('Visualisasi dinamika pipeline diaktifkan.', 'success');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'pipeline' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Pipeline
          </button>
        </div>
      </div>

      {/* Main Content Workspace Scroll panel */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">

        {/* ======================================================== */}
        {/* ============ VIEW 1: LAPORAN WIN/LOSS (REPT-01) ======== */}
        {/* ======================================================== */}
        {activeSubTab === 'winloss' && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Action Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-slate-800 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-primary font-bold">query_stats</span>
                  Laporan Performa Tender (Analisis Menang/Kalah)
                </h3>
                <p className="text-secondary text-xs mt-0.5">Analisis performa detail kemenangan tender dan kerugian proyek di seluruh cabang.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onShowNotification('Ekspor PDF Laporan Win/Loss sedang disiapkan.', 'success')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
                  Ekspor PDF
                </button>
                <button
                  type="button"
                  onClick={() => onShowNotification('Mengunduh spreadsheet excel berkas Win/Loss...', 'success')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold text-xs cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">table_view</span>
                  Ekspor Excel
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Rentang Tanggal</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">calendar_today</span>
                    <select
                      value={winLossFilterDate}
                      onChange={(e) => setWinLossFilterDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs font-semibold bg-white text-slate-650 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option>Bulan Saat Ini (Okt 2023)</option>
                      <option>3 Bulan Terakhir</option>
                      <option>Tahun Berjalan</option>
                      <option>Kustom</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Cabang</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">location_on</span>
                    <select
                      value={winLossFilterBranch}
                      onChange={(e) => setWinLossFilterBranch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs font-semibold bg-white text-slate-650 focus:outline-none"
                    >
                      <option>Semua Cabang (Indonesia)</option>
                      {branchOptions.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Kategori Proyek</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">category</span>
                    <select
                      value={winLossFilterCategory}
                      onChange={(e) => setWinLossFilterCategory(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs font-semibold bg-white text-slate-650 focus:outline-none"
                    >
                      <option>Semua Kategori</option>
                      <option>Infrastructure</option>
                      <option>Public Sector</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Tipe</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">account_tree</span>
                    <select
                      value={winLossFilterType}
                      onChange={(e) => setWinLossFilterType(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs font-semibold bg-white text-slate-650 focus:outline-none"
                    >
                      <option>Semua Tipe</option>
                      <option>Tender</option>
                      <option>Prospecting</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Reset controls */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleResetWinLossFilters}
                  className="text-primary hover:underline hover:text-primary-container text-xs font-semibold cursor-pointer"
                >
                  Atur Ulang Filter
                </button>
                <button
                  type="button"
                  onClick={() => onShowNotification('Fitur filter kriteria win loss diterapkan.', 'success')}
                  className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>

            {/* Win/Loss Summary Metrics Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">work</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold">+12% vs LY</span>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Total Proyek</p>
                <h3 className="font-extrabold text-slate-750 text-xl mt-1">1,284</h3>
                <p className="text-[10px] text-slate-400 mt-1 italic">Total keseluruhan tender aktif</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold">↑ 8.4%</span>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Menang</p>
                <h3 className="font-extrabold text-emerald-650 text-xl mt-1">842</h3>
                <p className="text-[10px] text-slate-400 mt-1 italic">Pemenang penawaran RKS</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined text-xl">cancel</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-50/50 text-red-650 border border-red-200 font-bold">↓ 2.1%</span>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Kalah</p>
                <h3 className="font-extrabold text-red-600 text-xl mt-1">442</h3>
                <p className="text-[10px] text-slate-400 mt-1 italic">Pemberitahuan sanggahan</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">trending_up</span>
                  </div>
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                    <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Tingkat Kemenangan %</p>
                <h3 className="font-extrabold text-slate-755 text-xl mt-1">65.5%</h3>
                <p className="text-[10px] text-slate-400 mt-1 italic">Komparasi rata-rata kontrak</p>
              </div>

            </div>

            {/* Chart trend comparison vs win factors layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Win/Loss Bar Chart rendering using beautifully aligned CSS columns */}
              <div className="lg:col-span-8 bg-white border border-border rounded-xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Tren Bulanan Menang vs Kalah</h4>
                    <p className="text-[11px] text-slate-400">Perbandingan hasil proyek selama 10 bulan terakhir</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-3 h-3 bg-primary rounded-xs"></span>
                      <span>Menang</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-3 h-3 bg-red-500 rounded-xs"></span>
                      <span>Kalah</span>
                    </div>
                  </div>
                </div>

                {/* Inline responsive Bar design mapping */}
                <div className="h-64 w-full flex items-end justify-between gap-2.5 pt-4 px-2 border-b border-slate-200">
                  {winLossChartData.map((d, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-[80%] hover:scale-105 transition-transform">
                        {/* Win Bar */}
                        <div
                          className="w-1/2 bg-primary rounded-t-xs hover:brightness-115 transition-all cursor-pointer"
                          style={{ height: `${d.win}%` }}
                          title={`Menang: ${d.win}`}
                        ></div>
                        {/* Loss Bar */}
                        <div
                          className="w-1/2 bg-red-500 rounded-t-xs hover:brightness-115 transition-all cursor-pointer"
                          style={{ height: `${d.loss}%` }}
                          title={`Kalah: ${d.loss}`}
                        ></div>
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-slate-400">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factors panel */}
              <div className="lg:col-span-4 bg-white border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Distribusi Faktor Kemenangan Utama</h4>
                  <p className="text-[11px] text-slate-400 mb-6">Faktor krusial yang mempengaruhi hasil tender akhir.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Harga Kompetitif</span>
                        <span className="font-bold text-slate-800">42%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Spesifikasi Teknis</span>
                        <span className="font-bold text-slate-800">28%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Performa Jadwal</span>
                        <span className="font-bold text-slate-800">18%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">Kemitraan Strategis</span>
                        <span className="font-bold text-slate-800">12%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="italic flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span> 14:00 (Sinkron otomatis)
                  </span>
                  <button
                    onClick={() => onShowNotification('Detil matrik faktor performa tender dimuat.', 'success')}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Lihat Analisis
                  </button>
                </div>
              </div>

            </div>

            {/* Drilldown Detailed Project Records */}
            <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 px-6 border-b border-border bg-slate-50 flex flex-col sm:flex-row justified-between sm:items-center gap-3">
                <h4 className="text-xs font-bold text-slate-750">Catatan Proyek Detail</h4>
                
                <div className="relative w-full sm:w-64 size-sm shrink-0 ml-auto">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    placeholder="Filter nama proyek / instansi..."
                    value={winLossSearch}
                    onChange={(e) => setWinLossSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white rounded border border-border focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              {/* Table rendering list */}
              <div className="overflow-x-auto table-mobile-compact">
                <table className="w-full text-xs table-auto">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="p-4">Nama Proyek</th>
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Nilai</th>
                      <th className="p-4 text-center">Hasil</th>
                      <th className="p-4">Pemenang/Pesaing</th>
                      <th className="p-4">Tanggal Tender</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {INITIAL_WIN_LOSS_RECORDS
                      .filter(r => r.name.toLowerCase().includes(winLossSearch.toLowerCase()) || r.client.toLowerCase().includes(winLossSearch.toLowerCase()))
                      .map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedWinLoss(r)}
                          className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                        >
                          <td className="p-4 text-slate-800 font-semibold">
                            <div>{r.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {r.id}</span>
                          </td>
                          <td className="p-4 text-slate-655">{r.client}</td>
                          <td className="p-4 font-mono font-bold text-slate-700">{r.value}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-0.5 rounded-full text-[9px] font-bold border badge-compact ${
                              r.result === 'WIN'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {r.result}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium">{r.competitor}</td>
                          <td className="p-4 text-slate-500">{r.date}</td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              className="p-1 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer btn-compact"
                            >
                              <span className="material-symbols-outlined text-[18px] icon-compact">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination footer */}
              <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-border text-[11px] text-slate-400">
                <p>Menampilkan 1-5 dari 1.284 catatan</p>
                <div className="flex gap-1.5">
                  <button type="button" className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer font-bold">1</button>
                  <button type="button" onClick={() => onShowNotification('Fungsi paginasi disimulasikan.', 'success')} className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer">2</button>
                  <button type="button" onClick={() => onShowNotification('Fungsi paginasi disimulasikan.', 'success')} className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer">3</button>
                </div>
              </div>
            </div>

            {/* Slide Out details drawer panel */}
            {selectedWinLoss && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in transition-opacity">
                <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform animate-slide-in duration-300">
                  
                  <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
                        Detail Analisis Proyek
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">Review detail data penawaran draf {selectedWinLoss.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWinLoss(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto space-y-6 text-left text-xs">
                    
                    <div className="p-4 rounded-lg bg-slate-50 border border-border border-l-4 border-primary">
                      <p className="text-slate-400 uppercase font-mono tracking-wider text-[9px] mb-1">Hasil Analisis Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedWinLoss.result === 'WIN' ? 'bg-success/15 text-success' : 'bg-red-50 text-red-650'
                        }`}>
                          {selectedWinLoss.result}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {selectedWinLoss.result === 'WIN' ? 'Tender berhasil disepakati resmi!' : `Kalah saing dengan ${selectedWinLoss.competitor}`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-border">
                        <p className="text-slate-400 uppercase font-mono tracking-wider text-[9px]">Nilai Kontrak</p>
                        <p className="font-extrabold text-slate-800 text-sm mt-1">{selectedWinLoss.value}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-border">
                        <p className="text-slate-400 uppercase font-mono tracking-wider text-[9px]">Tanggal Tender</p>
                        <p className="font-bold text-slate-800 text-sm mt-1">{selectedWinLoss.date}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Gambaran Deskripsi Proyek</h4>
                      <p className="text-slate-550 leading-relaxed text-xs">{selectedWinLoss.description}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pemilik Terafiliasi</span>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                          {selectedWinLoss.client.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-750">{selectedWinLoss.client}</p>
                          <p className="text-[10px] text-slate-400">Perwakilan Klien Tender Utama</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedWinLoss(null)}
                      className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Tutup Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onShowNotification('Seluruh berkas korespondensi audit sedang ditarik.', 'success');
                        setSelectedWinLoss(null);
                      }}
                      className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors"
                    >
                      Buka RKS Asli
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* ============ VIEW 2: LAPORAN PIPELINE ================== */}
        {/* ======================================================== */}
        {activeSubTab === 'pipeline' && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Action Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-slate-800 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-primary font-bold">filter_center_focus</span>
                  Laporan Tahapan Operasional (Tahapan Siklus Pipeline)
                </h3>
                <p className="text-secondary text-xs mt-0.5">Analisis distribusi kuesioner dan tender aktif rujukan wilayah operasional.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onShowNotification('Mengekspor laporan pipeline PDF...', 'success')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
                  Ekspor PDF
                </button>
                <button
                  type="button"
                  onClick={() => onShowNotification('Spreadsheet pipeline diunduh sistem.', 'success')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold text-xs cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  Ekspor Excel
                </button>
              </div>
            </div>

            {/* Pipeline Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-border p-4 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Total Nilai Pipeline</p>
                  <p className="font-extrabold text-primary text-base">Rp 4.28T</p>
                </div>
              </div>

              <div className="bg-white border border-border p-4 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                  <span className="material-symbols-outlined text-2xl">assignment</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Total Proyek Aktif</p>
                  <p className="font-extrabold text-slate-750 text-base">1,248</p>
                </div>
              </div>

              <div className="bg-white border border-border p-4 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                  <span className="material-symbols-outlined text-2xl">trending_up</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Prakiraan Pertumbuhan (Q4)</p>
                  <p className="font-extrabold text-indigo-650 text-base">+12.4%</p>
                </div>
              </div>

              <div className="bg-white border border-border p-4 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined text-2xl">event_available</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Rata-rata Usia</p>
                  <p className="font-extrabold text-slate-750 text-base font-mono">42 Days</p>
                </div>
              </div>

            </div>

            {/* Pipeline Filter Bar */}
            <div className="bg-slate-50 p-5 rounded-xl border border-border flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5 ml-1">Cabang</label>
                <select
                  value={pipelineFilterBranch}
                  onChange={(e) => setPipelineFilterBranch(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>Semua Cabang Indonesia</option>
                  {branchOptions.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5 ml-1">Divisi</label>
                <select
                  value={pipelineFilterDivision}
                  onChange={(e) => setPipelineFilterDivision(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>Semua Divisi</option>
                  <option>Infrastructure</option>
                  <option>Commercial</option>
                  <option>Digital Solutions</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5 ml-1">Kategori</label>
                <select
                  value={pipelineFilterCategory}
                  onChange={(e) => setPipelineFilterCategory(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>Semua Kategori</option>
                  <option>Strategic Projects</option>
                  <option>Maintenance</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5 ml-1">Estimasi Tutup</label>
                <select
                  value={pipelineFilterClose}
                  onChange={(e) => setPipelineFilterClose(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>Q4 2024</option>
                  <option>Q1 2025</option>
                  <option>H1 2025</option>
                </select>
              </div>

              <div className="flex items-end self-end">
                <button
                  type="button"
                  onClick={handleResetPipelineFilters}
                  className="bg-white border border-border block px-3.5 py-2.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-100 font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Atur Ulang
                </button>
              </div>
            </div>

            {/* Funnel Layout and Conversion Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Funnel Stage Visualization */}
              <div className="lg:col-span-8 bg-white border border-border rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
                
                <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">filter_center_focus</span>
                    <h3 className="text-xs font-bold text-slate-800">Tahapan Siklus Pipeline</h3>
                  </div>

                  {/* Switch button style count vs value */}
                  <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-border shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPipelineViewMode('count');
                        onShowNotification('Format visualisasi pipeline dirubah: Berdasarkan Jumlah Proyek.', 'success');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        pipelineViewMode === 'count' ? 'bg-white shadow-xs text-primary' : 'text-slate-500'
                      }`}
                    >
                      Lihat per Jumlah
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPipelineViewMode('value');
                        onShowNotification('Format visualisasi pipeline dirubah: Berdasarkan Estimasi Nilai Kontrak.', 'success');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        pipelineViewMode === 'value' ? 'bg-white shadow-xs text-primary' : 'text-slate-500'
                      }`}
                    >
                      Lihat per Nilai
                    </button>
                  </div>
                </div>

                {/* Drawn Pipeline Funnel Layout matches user HTML specifications */}
                <div className="p-6 bg-slate-50/50 space-y-2 flex-grow flex flex-col justify-center min-h-[300px]">
                  {funnelSteps.map((step) => (
                    <div key={step.id} className={`${step.scale} mx-auto transition-all duration-300 hover:-translate-y-0.5`}>
                      <div className={`${step.color} hover:brightness-110 p-3.5 flex justify-between items-center text-white shadow-xs rounded-lg cursor-pointer`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">{step.id}</span>
                          <span className="font-bold text-xs">{step.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold">
                            {pipelineViewMode === 'count' ? step.count : step.value}
                          </p>
                          <p className="text-[9px] opacity-80 uppercase tracking-wider">
                            {pipelineViewMode === 'count' ? `Nilai: ${step.value}` : `Jumlah: ${step.count}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Conversion Metrics panel */}
              <div className="lg:col-span-4 bg-white border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-info">query_stats</span>
                    Kecepatan Analitik Tahap
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold uppercase text-slate-455">
                        <span>Rata-rata Tingkat Konversi</span>
                        <span className="text-success">28.4%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-success h-full" style={{ width: '28.4%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold uppercase text-slate-455">
                        <span>Kecepatan (Hari/Tahap)</span>
                        <span className="text-warning">12 Days</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-warning h-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Divisi Teratas per Nilai</p>
                      <ul className="space-y-3">
                        <li className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                            <span>Infrastructure</span>
                          </div>
                          <span className="font-mono text-slate-600">Rp 1.42T</span>
                        </li>
                        <li className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                            <span>Commercial</span>
                          </div>
                          <span className="font-mono text-slate-600">Rp 0.98T</span>
                        </li>
                        <li className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                            <span>Digital Sol.</span>
                          </div>
                          <span className="font-mono text-slate-600">Rp 0.85T</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-xs mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified_user</span> Kesehatan Pipeline
                    </span>
                    <span className="font-mono font-bold text-primary">94.2%</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Pipeline saat ini dalam parameter aman untuk persetujuan eksekutif.</p>
                </div>
              </div>

            </div>

            {/* Drilldown pipeline items list */}
            <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 px-6 border-b border-border bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h4 className="text-xs font-bold text-slate-750">Rincian Proyek</h4>
                
                <div className="relative w-full sm:w-64 size-sm shrink-0 ml-auto">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama proyek..."
                    value={pipelineSearch}
                    onChange={(e) => setPipelineSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white rounded border border-border focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto table-mobile-compact">
                <table className="w-full text-xs table-auto">
                  <thead>
<tr className="bg-slate-50 border-b border-border">
                      <th className="p-4">Nama Proyek</th>
                      <th className="p-4">Cabang</th>
                      <th className="p-4">Tahap</th>
                      <th className="p-4">Estimasi Nilai</th>
                      <th className="p-4">Estimasi Tanggal Tutup</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {INITIAL_PIPELINE_RECORDS
                      .filter(r => r.name.toLowerCase().includes(pipelineSearch.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 cursor-pointer">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{p.branch}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase badge-compact">
                              {p.stage}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">{p.value}</td>
                          <td className="p-4 text-slate-500">{p.estClose}</td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => onShowNotification(`Membuka rincian pipeline proyek ${p.id}`, 'success')}
                              className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors cursor-pointer text-base btn-compact icon-compact"
                            >
                              open_in_new
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-border text-[11px] text-slate-400">
                <p>Menampilkan 1-4 dari 1.248 entri</p>
                <div className="flex gap-1.5">
                  <button type="button" className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer font-bold">1</button>
                  <button type="button" onClick={() => onShowNotification('Penyaringan drill-down pipeline dimuat.', 'success')} className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer">2</button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Tech Footer system info */}
      <div className="bg-slate-50 px-8 py-2 border-t border-border text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>v2.4.0 Kinetic CRM Enterprise | Sistem Stabil</span>
        <div className="flex gap-4">
          <span className="hover:underline cursor-pointer">Bantuan Help Desk</span>
          <span className="hover:underline cursor-pointer">Kepatuhan Keamanan</span>
        </div>
      </div>

    </div>
  );
}
