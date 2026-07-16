import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { StatusBadge, BulkActions, PageContainer, PageHeader } from '@/components/shared';
import { useProcurementStore } from './procurementStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCurrency } from '@/utils/formatters';
import type { Procurement, ProcurementStatus } from '@/types/domain/procurement';

const STATUS_COLORS: Record<ProcurementStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  'Vendor Selection': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  Delivery: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800',
  Progress: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  Cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
};

export default function ProcurementListPage() {
  const navigate = useNavigate();
  const procurements = useProcurementStore((s) => s.procurements);
  const loading = useProcurementStore((s) => s.loading);
  const fetchProcurements = useProcurementStore((s) => s.fetchProcurements);
  const { can } = useAuthz();

  useEffect(() => {
    fetchProcurements();
  }, [fetchProcurements]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<ProcurementStatus | 'all'>('all');
  const deleteProcurement = useProcurementStore((s) => s.deleteProcurement);
  const [deleteTarget, setDeleteTarget] = useState<Procurement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return procurements
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          const projectName = getProjectName(p);
          return (
            p.code.toLowerCase().includes(q) ||
            p.client.toLowerCase().includes(q) ||
            p.prNumber?.toLowerCase().includes(q) ||
            p.poNumber?.toLowerCase().includes(q) ||
            projectName?.toLowerCase().includes(q) ||
            p.sourceProjectCode?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [procurements, statusFilter, debouncedSearch]);

  const projects = useProjectStore((s) => s.projects);
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.id) map.set(p.id, p.name);
      if (p.code) map.set(p.code, p.name);
    });
    return map;
  }, [projects]);

  const getProjectName = (p: { sourceProjectId?: string; sourceProjectCode?: string; sourceProjectName?: string }): string | undefined => {
    return p.sourceProjectName
      || (p.sourceProjectId && projectNameMap.get(p.sourceProjectId))
      || (p.sourceProjectCode && projectNameMap.get(p.sourceProjectCode));
  };

  const handleDeleteClick = (e: React.MouseEvent, p: Procurement) => {
    e.stopPropagation();
    setDeleteTarget(p);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProcurement(deleteTarget.id);
    toast.success(`Pengadaan ${deleteTarget.code} berhasil dihapus`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleBatchDelete = useCallback(() => {
    selectedRows.forEach(id => deleteProcurement(id));
    toast.success(`${selectedRows.size} pengadaan berhasil dihapus.`);
    setSelectedRows(new Set());
    setSelectionMode(false);
  }, [selectedRows, deleteProcurement]);

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === filtered.length && filtered.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map(p => p.id)));
    }
  }, [selectedRows, filtered]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Proses Pengadaan"
        description="Kelola seluruh aktivitas pengadaan barang/jasa"
        actions={
          can('pengadaan:write') ? (
            <button
              onClick={() => navigate('/procurement/new')}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Pengadaan Baru
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/60 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengadaan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-surface text-on-surface"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProcurementStatus | 'all')
            }
            className="px-3 py-2 rounded-xl border border-border/60 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-on-surface"
          >
            <option value="all">Semua Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {can('pengadaan:write') && (
            <button
              onClick={() => { setSelectionMode(v => !v); setSelectedRows(new Set()); }}
              className={`p-2 rounded-xl border transition-all ${
                selectionMode
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border/60 text-secondary hover:bg-surface-container'
              }`}
              title={selectionMode ? 'Tutup mode pilih' : 'Mode pilih'}
              aria-label={selectionMode ? 'Tutup mode pilih' : 'Aktifkan mode pilih'}
            >
              <span className="material-symbols-outlined text-[18px]">checklist</span>
            </button>
          )}
          <span className="text-xs text-secondary">
            {filtered.length} pengadaan
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border/60 shadow-card overflow-hidden">
        {selectionMode && selectedRows.size > 0 && (
          <div className="px-4 sm:px-6 pt-4">
            <BulkActions
              selectedCount={selectedRows.size}
              onClearSelection={() => { setSelectedRows(new Set()); setSelectionMode(false); }}
              onBatchDelete={handleBatchDelete}
              deleteConfirmMessage={`Apakah Anda yakin ingin menghapus ${selectedRows.size} pengadaan yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
            />
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-secondary">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 block">inventory_2</span>
            <p className="text-on-surface font-semibold">Belum Ada Pengadaan</p>
            <p className="text-xs text-outline mt-1">
              {search || statusFilter !== 'all'
                ? 'Tidak ada pengadaan yang sesuai filter.'
                : 'Pengadaan akan muncul setelah proyek dinyatakan MENANG, atau Anda dapat membuat manual.'}
            </p>
            {can('pengadaan:write') && !search && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/procurement/new')}
                className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold"
              >
                Buat Pengadaan Baru
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border/60">
                    {selectionMode && (
                      <th className="px-4 py-3 sm:py-4 w-10">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedRows.size === filtered.length}
                          onChange={toggleAllRows}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          aria-label="Pilih semua"
                        />
                      </th>
                    )}
                    <th className="text-left px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Nama Proyek
                    </th>
                    <th className="text-left px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Klien
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Nilai Kontrak
                    </th>
                    <th className="text-center px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="text-right px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">
                      Dibuat
                    </th>
                    {can('pengadaan:write') && (
                      <th className="text-center px-4 sm:px-6 py-3 sm:py-4 font-label-sm text-xs text-secondary uppercase tracking-wider w-16">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => { if (!selectionMode) navigate(`/procurement/${p.id}`); }}
                      className="border-b border-border/60 hover:bg-surface-container cursor-pointer transition-colors"
                    >
                      {selectionMode && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(p.id)}
                            onChange={() => toggleRow(p.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            aria-label={`Pilih ${p.code}`}
                          />
                        </td>
                      )}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-on-surface-variant">
                        <Link to={`/procurement/${p.id}`} className="block truncate max-w-60">
                          {(() => {
                            const projectName = getProjectName(p);
                            return projectName ? (
                              <span className="text-on-surface font-medium leading-tight">{projectName}</span>
                            ) : p.sourceProjectCode ? (
                              <span className="text-outline italic">{p.sourceProjectCode}</span>
                            ) : (
                              <span className="text-outline italic">Manual</span>
                            );
                          })()}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-on-surface-variant text-xs">
                        {p.client}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-mono-data text-on-surface text-xs">
                        {formatCurrency(p.contractValue)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center align-middle">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono-data text-secondary">
                            {p.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-outline text-xs">
                        {new Date(p.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {can('pengadaan:write') && (
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDeleteClick(e, p)}
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-outline hover:text-danger hover:bg-danger/10 transition-all"
                            title="Hapus pengadaan"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
              Batal
            </Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Apakah Anda yakin ingin menghapus pengadaan <strong>{deleteTarget?.code}</strong>?
        </p>
      </Modal>
    </PageContainer>
  );
}
