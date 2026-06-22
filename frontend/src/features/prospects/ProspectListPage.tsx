import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
import type { Prospect } from '@/types/domain';

const PAGE_SIZE = 5;

export default function ProspectListPage() {
  const navigate = useNavigate();
  const [prospects] = useState<Prospect[]>(INITIAL_PROSPECTS);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Prospecting' | 'Waiting PM' | 'Revision' | 'Approved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = prospects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeFilter === 'All' || p.status === activeFilter;
    return matchSearch && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Prospecting: 'bg-info/10 text-info',
      'Waiting PM': 'bg-warning/10 text-warning',
      Revision: 'bg-status-orange/10 text-status-orange',
      Approved: 'bg-success/10 text-success',
    };
    return map[status] || 'bg-secondary-container/50 text-on-secondary-container';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-outline font-label-sm mb-1">
              <button onClick={() => navigate('/dashboard')} className="hover:text-primary">Dashboard</button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">Daftar Prospek</span>
            </nav>
            <h1 className="text-xl font-extrabold text-on-surface">Prospek</h1>
          </div>
          <button onClick={() => navigate('/prospects/new')} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all" aria-label="Buat Prospek Baru">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Prospect
          </button>
        </div>

        {/* Filter & Search */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-border">
              {(['All', 'Prospecting', 'Waiting PM', 'Revision', 'Approved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-label-sm transition-colors ${
                    activeFilter === tab ? 'bg-white text-primary shadow-sm border border-border font-bold' : 'text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {tab === 'All' ? 'Semua' : tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary w-[260px] outline-none focus:ring-1" placeholder="Cari prospek atau klien..." type="text" aria-label="Cari prospek" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-left border-collapse text-sm table-auto" aria-label="Daftar Prospek">
              <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Prospek</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                      <p>Tidak ada prospek ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id} onClick={() => navigate(`/prospects/${row.id}`)} className="border-b border-border hover:bg-blue-50/30 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-surface group-hover:text-primary transition-colors">{row.name}</div>
                        {row.description && <p className="text-xs text-secondary truncate max-w-md">{row.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-secondary">{row.client}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider badge-compact ${statusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary avatar-compact">{row.author.charAt(0)}</div>
                          <span className="text-on-surface text-xs">{row.author}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary">{row.date}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-on-surface">
                        {row.estimatedValue ? `Rp ${row.estimatedValue.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-container-low text-xs">
            <span className="text-secondary">
              Menampilkan <span className="font-bold text-on-surface">{(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> dari <span className="font-bold text-on-surface">{filtered.length}</span> hasil
            </span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman sebelumnya">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border border-border text-secondary hover:bg-surface-container-low'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman selanjutnya">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
