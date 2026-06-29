import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { exportCSV } from '@/utils/export';
import { formatCurrencyShort as formatCurrency } from '@/utils/formatters';

function formatCurrencyFull(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

interface WinLossRecord {
  id: string;
  name: string;
  client: string;
  value: number;
  valueFormatted: string;
  result: 'WIN' | 'LOSS';
  competitor: string;
  date: string;
}

export default function WinLossReportPage() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const [dateRange, setDateRange] = useState('Current Month');
  const [searchQuery, setSearchQuery] = useState('');

  const { records, totalWon, totalLost, totalProjects, winRate, totalValueWon, monthlyChart } = useMemo(() => {
    const records: WinLossRecord[] = projects
      .filter((p): p is typeof p & { winnerDetails: NonNullable<typeof p.winnerDetails> } =>
        p.winnerDetails?.outcome === 'menang' || p.winnerDetails?.outcome === 'kalah'
      )
      .map((p) => ({
        id: p.code || p.id,
        name: p.name,
        client: p.client,
        value: p.pricing?.value || p.estimatedValue || 0,
        valueFormatted: formatCurrencyFull(p.pricing?.value || p.estimatedValue || 0),
        result: p.winnerDetails.outcome === 'menang' ? 'WIN' as const : 'LOSS' as const,
        competitor: p.competitors?.map((c) => c.name).join(', ') || '-',
        date: p.date,
      }));

    const totalWon = records.filter((r) => r.result === 'WIN').length;
    const totalLost = records.filter((r) => r.result === 'LOSS').length;
    const totalRecords = records.length;
    const winRate = totalRecords ? Math.round((totalWon / totalRecords) * 100) : 0;
    const totalValueWon = records
      .filter((r) => r.result === 'WIN')
      .reduce((sum, r) => sum + r.value, 0);

    // Monthly chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthMap = new Map<string, { win: number; loss: number }>();
    monthNames.forEach((m) => monthMap.set(m, { win: 0, loss: 0 }));

    projects.forEach((p) => {
      if (!p.winnerDetails?.outcome) return;
      const d = new Date(p.date);
      if (isNaN(d.getTime())) return;
      const monthLabel = monthNames[d.getMonth()];
      const entry = monthMap.get(monthLabel);
      if (entry) {
        if (p.winnerDetails.outcome === 'menang') entry.win++;
        else if (p.winnerDetails.outcome === 'kalah') entry.loss++;
      }
    });

    const maxVal = Math.max(1, ...Array.from(monthMap.values()).flatMap((v) => [v.win, v.loss]));
    const monthlyChart = monthNames
      .filter((m) => {
        const d = monthMap.get(m)!;
        return d.win > 0 || d.loss > 0;
      })
      .map((label) => ({
        label,
        win: Math.round(((monthMap.get(label)?.win || 0) / maxVal) * 100),
        loss: Math.round(((monthMap.get(label)?.loss || 0) / maxVal) * 100),
      }));

    return { records, totalWon, totalLost, totalProjects: totalRecords, winRate, totalValueWon, monthlyChart };
  }, [projects]);

  const filtered = records.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.client.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">Win/Loss Report</h1>
            <p className="text-sm text-secondary mt-1">Analisis performa tender dan proyek yang dimenangkan atau dikalahkan.</p>
          </div>
          <div className="flex gap-2">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border border-border rounded-lg px-4 py-2 text-sm bg-white outline-none" aria-label="Rentang tanggal">
              <option>Current Month</option>
              <option>Last 3 Months</option>
              <option>Year to Date</option>
              <option>Custom Range</option>
            </select>
            <button onClick={() => exportCSV(
              filtered,
              [
                { header: 'Nama Proyek', accessor: (r) => `${r.name} (${r.id})` },
                { header: 'Client', accessor: (r) => r.client },
                { header: 'Nilai', accessor: (r) => r.valueFormatted },
                { header: 'Hasil', accessor: (r) => r.result },
                { header: 'Kompetitor', accessor: (r) => r.competitor },
                { header: 'Tanggal', accessor: (r) => r.date },
              ],
              'win_loss_report',
            )} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-1.5" aria-label="Export CSV">
              <span className="material-symbols-outlined text-[18px] text-primary">file_download</span>
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">trending_up</span>
              </div>
              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${winRate}%` }} />
              </div>
            </div>
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Win Rate</p>
            <h3 className="font-extrabold text-on-surface text-xl mt-1">{winRate}%</h3>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </div>
            </div>
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Won</p>
            <h3 className="font-extrabold text-emerald-600 text-xl mt-1">{totalWon}</h3>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <span className="material-symbols-outlined text-xl">cancel</span>
              </div>
            </div>
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Lost</p>
            <h3 className="font-extrabold text-red-600 text-xl mt-1">{totalLost}</h3>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
            </div>
            <p className="text-outline text-[10px] uppercase font-semibold tracking-wider">Total Value Won</p>
            <h3 className="font-extrabold text-on-surface text-xl mt-1">{formatCurrency(totalValueWon)}</h3>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-on-surface">Monthly Win vs Loss Trends</h3>
            <div className="flex gap-4 text-xs text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-xs" />Win</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-xs" />Loss</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2.5 px-2 border-b border-border">
            {monthlyChart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-[80%]">
                  <div className="w-1/2 bg-primary rounded-t-xs transition-all group-hover:brightness-110" style={{ height: `${d.win}%` }} title={`Win: ${d.win}`} />
                  <div className="w-1/2 bg-red-500 rounded-t-xs transition-all group-hover:brightness-110" style={{ height: `${d.loss}%` }} title={`Loss: ${d.loss}`} />
                </div>
                <span className="mt-2 text-[10px] font-bold text-outline">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-border bg-surface-container-low flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="font-bold text-sm text-on-surface">Detail Records</h3>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-primary" placeholder="Cari proyek atau client..." aria-label="Cari" />
            </div>
          </div>
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-left text-sm table-auto" aria-label="Win/Loss Records">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-3.5 font-semibold">Nama Proyek</th>
                  <th className="px-6 py-3.5 font-semibold">Client</th>
                  <th className="px-6 py-3.5 font-semibold">Nilai</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Hasil</th>
                  <th className="px-6 py-3.5 font-semibold">Kompetitor</th>
                  <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-secondary italic">Tidak ada data ditemukan.</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface">{r.name}</p>
                        <p className="text-[10px] text-outline">{r.id}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary">{r.client}</td>
                      <td className="px-6 py-4 font-mono font-bold text-on-surface">{r.valueFormatted}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold badge-compact ${r.result === 'WIN' ? 'bg-success/10 text-success' : 'bg-red-50 text-red-600'}`}>{r.result}</span>
                      </td>
                      <td className="px-6 py-4 text-secondary">{r.competitor}</td>
                      <td className="px-6 py-4 text-outline">{r.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-low border-t border-border text-xs text-secondary text-center">
            Menampilkan {filtered.length} dari {records.length} records
          </div>
        </div>
      </div>
    </div>
  );
}
