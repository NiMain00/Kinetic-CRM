import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Card } from '@/components/ui';
import { PageContainer, PageHeader, StatusBadge, BulkActions } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useProspectStore } from '@/stores/prospectStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useOwnerFilter } from '@/hooks/useOwnerFilter';
import { exportCSV } from '@/utils/export';
import type { Prospect } from '@/types/domain';

interface ProspectsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

type FilterTab = 'All' | 'Butuh Approval' | 'Non Potensial' | 'Potensial' | 'Revision' | 'Approved';

const PAGE_SIZE = 10;

const FILTER_TABS: FilterTab[] = ['All', 'Butuh Approval', 'Non Potensial', 'Potensial', 'Revision', 'Approved'];
const FILTER_LABELS: Record<FilterTab, string> = {
  All: 'Semua',
  'Butuh Approval': 'Butuh Approval',
  'Non Potensial': 'Non Potensial',
  Potensial: 'Potensial',
  Revision: 'Revisi',
  Approved: 'Disetujui',
};

type SortField = 'name' | 'client' | 'status' | 'author' | 'date';

export default function ProspectsView({ onShowNotification, onNavigatePage }: ProspectsViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const prospects = useProspectStore((s) => s.prospects);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const authUser = useAuthStore((s) => s.user);
  const { can } = useAuthz();
  const { isStaffOnly, userId } = useOwnerFilter();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProspect(deleteTarget);
    onShowNotification('Prospek berhasil dihapus.', 'success');
    setDeleteTarget(null);
  };

  const handleBuatProyek = (prospek: typeof prospects[0]) => {
    navigate('/projects/new', {
      state: { fromProspect: prospek },
    });
  };

  const visibleProspects = prospects.filter(p => {
    // Staff: hanya lihat milik sendiri
    if (isStaffOnly && userId && p.ownerUserId && p.ownerUserId !== userId) {
      return false;
    }
    return true;
  });

  const tabCounts = useMemo(() => {
    return FILTER_TABS.map(tab => {
      let count: number;
      if (tab === 'All') {
        count = visibleProspects.length;
      } else if (tab === 'Non Potensial') {
        count = visibleProspects.filter(p => p.status === 'Non Potensial' || p.prospectType === 'non_potensial').length;
      } else if (tab === 'Potensial') {
        count = visibleProspects.filter(p => p.status === 'Potensial' || p.prospectType === 'potensial').length;
      } else if (tab === 'Butuh Approval') {
        count = visibleProspects.filter(p => p.customerData?.needsVerification === true || p.status === 'Waiting PM').length;
      } else {
        count = visibleProspects.filter(p => p.status === tab).length;
      }
      return count;
    });
  }, [visibleProspects]);



  const filteredProspects = visibleProspects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesTab: boolean;
    if (activeFilter === 'All') {
      matchesTab = true;
    } else if (activeFilter === 'Non Potensial') {
      matchesTab = p.status === 'Non Potensial' || p.prospectType === 'non_potensial';
    } else if (activeFilter === 'Potensial') {
      matchesTab = p.status === 'Potensial' || p.prospectType === 'potensial';
    } else if (activeFilter === 'Butuh Approval') {
      matchesTab = p.customerData?.needsVerification === true || p.status === 'Waiting PM';
    } else {
      matchesTab = p.status === activeFilter;
    }
    return matchesSearch && matchesTab;
  });

  const sortedProspects = useMemo(() => {
    if (!sortKey) return filteredProspects;
    return [...filteredProspects].sort((a, b) => {
      const aVal = String(a[sortKey as keyof Prospect] ?? '').toLowerCase();
      const bVal = String(b[sortKey as keyof Prospect] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredProspects, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedProspects.length / PAGE_SIZE);
  const paginatedProspects = sortedProspects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (field: SortField) => {
    setSortKey(prev => prev === field && sortDir === 'asc' ? null : field);
    setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortKey !== field) return 'unfold_more';
    return sortDir === 'asc' ? 'expand_less' : 'expand_more';
  };

  const getSortLabel = (field: SortField, label: string) => {
    if (sortKey !== field) return `Urutkan ${label}`;
    return `Urut ${sortDir === 'asc' ? 'menaik' : 'menurun'} untuk ${label}`;
  };

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedProspects.length && paginatedProspects.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedProspects.map(p => p.id)));
    }
  }, [selectedRows, paginatedProspects]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    selectedRows.forEach(id => deleteProspect(id));
    onShowNotification(`${selectedRows.size} prospek berhasil dihapus.`, 'success');
    setSelectedRows(new Set());
  }, [selectedRows, deleteProspect, onShowNotification]);

  const handleBatchExport = useCallback(() => {
    const selectedData = prospects.filter(p => selectedRows.has(p.id));
    exportCSV(
      selectedData,
      [
        { header: 'Nama Prospek', accessor: (p) => p.name },
        { header: 'Client', accessor: (p) => p.client },
        { header: 'Status', accessor: (p) => p.status },
        { header: 'Nilai Estimasi', accessor: (p) => p.estimatedValue ? `Rp ${p.estimatedValue.toLocaleString('id-ID')}` : '-' },
        { header: 'Author', accessor: (p) => p.author },
        { header: 'Tanggal', accessor: (p) => p.date },
      ],
      'daftar_prospek_terpilih',
    );
  }, [selectedRows, prospects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveFilter(tab);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  return (
    <PageContainer>
      <PageHeader
        title="Prospek"
        description="Daftar Prospek"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}
              onClick={() => exportCSV(
                prospects,
                [
                  { header: 'Nama Prospek', accessor: (p) => p.name },
                  { header: 'Client', accessor: (p) => p.client },
                  { header: 'Status', accessor: (p) => p.status },
                  { header: 'Nilai Estimasi', accessor: (p) => p.estimatedValue ? `Rp ${p.estimatedValue.toLocaleString('id-ID')}` : '-' },
                  { header: 'Author', accessor: (p) => p.author },
                  { header: 'Tanggal', accessor: (p) => p.date },
                ],
                'daftar_prospek',
              )}
            >
              Export CSV
            </Button>
            {can('prospect:write:prospecting') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/prospects/new')}
                leftIcon={<span className="material-symbols-outlined text-[20px]">add</span>}
              >
                Buat Prospek Baru
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/60 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-border/60 flex-wrap shrink-0">
            {FILTER_TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h flex items-center gap-1.5 ${
                  activeFilter === tab
                    ? 'bg-surface text-primary shadow-sm border border-border/60 font-bold'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                {FILTER_LABELS[tab]}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeFilter === tab
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container-high text-secondary'
                }`}>
                  {tabCounts[idx]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {can('prospect:write:prospecting') && (
              <button
                onClick={() => { setSelectionMode(v => !v); setSelectedRows(new Set()); }}
                className={`touch-min flex items-center justify-center p-2 rounded-xl border transition-all ${
                  selectionMode
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface border-border/60 text-secondary hover:bg-surface-container'
                }`}
                title={selectionMode ? 'Tutup mode pilih' : 'Mode pilih'}
                aria-label={selectionMode ? 'Tutup mode pilih' : 'Aktifkan mode pilih'}
              >
                <span className="material-symbols-outlined text-[18px]">checklist</span>
              </button>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-primary w-[260px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Cari prospek atau klien..."
                type="text"
              />
            </div>
          </div>
        </div>
      </div>

      <Card padding="none">
        {selectionMode && selectedRows.size > 0 && (
          <div className="px-4 sm:px-6 pt-4">
            <BulkActions
              selectedCount={selectedRows.size}
              onClearSelection={() => { setSelectedRows(new Set()); setSelectionMode(false); }}
              onBatchDelete={handleBatchDelete}
              onBatchExport={handleBatchExport}
              deleteConfirmMessage={`Apakah Anda yakin ingin menghapus ${selectedRows.size} prospek yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
            />
          </div>
        )}

        {isMobile ? (
          <div className="divide-y divide-border">
            {paginatedProspects.length === 0 ? (
              <div className="px-6 py-12 text-center text-secondary">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                <p>Tidak ada prospek ditemukan</p>
              </div>
            ) : (
              paginatedProspects.map((row, index) => (
                <div key={row.id} className="p-4 space-y-3 active:bg-surface-container-low transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5 shrink-0"
                          aria-label={`Pilih ${row.name}`}
                        />
                      )}
                      <div className="min-w-0">
                        <div
                          onClick={() => navigate(`/prospects/${row.id}`)}
                          title={row.name}
                          className="font-label-sm text-on-surface font-medium text-sm cursor-pointer hover:text-primary transition-colors line-clamp-2"
                        >
                          {row.name}
                        </div>
                        {row.description && (
                          <p className="text-xs text-secondary truncate" title={row.description}>{row.description}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-secondary min-w-0">
                      <span className="material-symbols-outlined text-[14px] shrink-0">business</span>
                      <span className="truncate" title={row.client}>{row.client}</span>
                    </div>
                    <span className="text-secondary shrink-0">{row.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                        {row.author.charAt(0)}
                      </div>
                      <span className="text-on-surface text-xs truncate" title={row.author}>{row.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {row.status === 'Approved' && !row.isConverted && can('project:create') && (
                        <button
                          onClick={() => handleBuatProyek(row)}
                          className="touch-min flex items-center justify-center text-success hover:text-success hover:bg-success/10 rounded-lg transition-all"
                          title="Konversi ke Proyek"
                        >
                          <span className="material-symbols-outlined text-[20px]">add_business</span>
                        </button>
                      )}
                      {can('prospect:write:prospecting') && (
                        <button
                          onClick={() => navigate(`/prospects/${row.id}/edit`)}
                          className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                          title="Sunting Prospek"
                          aria-label="Sunting"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      )}
                      {can('prospect:write:prospecting') && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                          title="Hapus Prospek"
                          aria-label="Hapus"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse text-sm table-fixed">
              <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border/60 sticky top-0 z-10 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]">
                <tr>
                  {selectionMode && (
                    <th className="px-4 py-4 w-[40px]">
                      <input
                        type="checkbox"
                        checked={paginatedProspects.length > 0 && selectedRows.size === paginatedProspects.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        aria-label="Pilih semua"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 font-semibold w-[50px]">No</th>
                  <th
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-primary select-none w-[24%]"
                    onClick={() => handleSort('name')}
                    aria-label={getSortLabel('name', 'Nama Prospek')}
                    aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      Nama Prospek
                      <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon('name')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-primary select-none w-[14%]"
                    onClick={() => handleSort('client')}
                    aria-label={getSortLabel('client', 'Customer')}
                    aria-sort={sortKey === 'client' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      Customer
                      <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon('client')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-primary select-none w-[14%]"
                    onClick={() => handleSort('status')}
                    aria-label={getSortLabel('status', 'Status')}
                    aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon('status')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-primary select-none w-[14%]"
                    onClick={() => handleSort('author')}
                    aria-label={getSortLabel('author', 'Dibuat Oleh')}
                    aria-sort={sortKey === 'author' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      Dibuat Oleh
                      <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon('author')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-primary select-none w-[12%]"
                    onClick={() => handleSort('date')}
                    aria-label={getSortLabel('date', 'Tgl Dibuat')}
                    aria-sort={sortKey === 'date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      Tgl Dibuat
                      <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">{getSortIcon('date')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedProspects.length === 0 ? (
                  <tr>
                    <td colSpan={selectionMode ? 8 : 7} className="px-6 py-12 text-center text-secondary">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                      <p>Tidak ada prospek ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProspects.map((row, index) => {
                    const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
                    return (
                    <tr key={row.id} className="border-b border-border/60 hover:bg-primary/5 transition-colors group">
                      {selectionMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            aria-label={`Pilih ${row.name}`}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 font-mono-data text-mono-data text-outline">{globalIndex}</td>
                      <td className="px-6 py-4 overflow-hidden">
                        <div
                          onClick={() => navigate(`/prospects/${row.id}`)}
                          title={row.name}
                          className="font-label-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer font-medium line-clamp-2"
                        >
                          {row.name}
                        </div>
                        {row.description && (
                          <p className="text-xs text-secondary truncate" title={row.description}>{row.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-secondary truncate overflow-hidden" title={row.client}>{row.client}</td>
                      <td className="px-6 py-4 overflow-hidden">
                      <StatusBadge
                        status={row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                      />
                      </td>
                      <td className="px-6 py-4 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {row.author.charAt(0)}
                          </div>
                          <span className="text-on-surface text-xs truncate" title={row.author}>{row.author}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary truncate overflow-hidden" title={row.date}>{row.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.status === 'Approved' && !row.isConverted && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBuatProyek(row); }}
                              className="touch-min flex items-center justify-center text-success hover:text-success hover:bg-success/10 rounded-lg transition-all"
                              title="Konversi ke Proyek"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_business</span>
                            </button>
                          )}
                          {can('prospect:write:prospecting') && (
                            <button
                              onClick={() => navigate(`/prospects/${row.id}/edit`)}
                              className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                              title="Sunting Prospek"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          )}
                          {can('prospect:write:prospecting') && (
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                              title="Hapus Prospek"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-low text-xs gap-3">
          <span className="text-secondary font-caption-xs">
            Menampilkan <span className="font-bold text-on-surface">{sortedProspects.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, sortedProspects.length)}</span> dari{' '}
            <span className="font-bold text-on-surface">{sortedProspects.length}</span> hasil
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="touch-min flex items-center justify-center px-2 py-1 rounded-lg bg-surface border border-border/60 text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`touch-min flex items-center justify-center px-2.5 py-1 rounded-lg font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-surface border border-border/60 text-secondary hover:bg-surface-container'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="touch-min flex items-center justify-center px-2 py-1 rounded-lg bg-surface border border-border/60 text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus prospek ini dari draf? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </PageContainer>
  );
}
