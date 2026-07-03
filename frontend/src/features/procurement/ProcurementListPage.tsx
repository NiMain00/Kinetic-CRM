import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { useProcurementStore } from './procurementStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthz } from '@/hooks/useAuthz';
import { formatCurrency } from '@/utils/formatters';
import type { Procurement, ProcurementStatus } from '@/types/domain/procurement';

const STATUS_COLORS: Record<ProcurementStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  'Purchase Request': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  'Vendor Selection': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  'PO Process': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  Delivery: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800',
  Progress: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  Cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
};

export default function ProcurementListPage() {
  const navigate = useNavigate();
  const procurements = useProcurementStore((s) => s.procurements);
  const { can } = useAuthz();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcurementStatus | 'all'>('all');
  const deleteProcurement = useProcurementStore((s) => s.deleteProcurement);
  const [deleteTarget, setDeleteTarget] = useState<Procurement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filtered = useMemo(() => {
    return procurements
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
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
  }, [procurements, statusFilter, search]);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border/60 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-title text-xl font-bold text-on-surface">
              Proses Pengadaan
            </h1>
            <p className="text-sm text-secondary mt-0.5">
              Kelola seluruh aktivitas pengadaan barang/jasa
            </p>
          </div>
          {can('pengadaan:write') && (
            <button
              onClick={() => navigate('/procurement/new')}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Pengadaan Baru
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengadaan..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs bg-surface text-on-surface"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProcurementStatus | 'all')
            }
            className="px-3 py-2 rounded-lg border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-on-surface"
          >
            <option value="all">Semua Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="text-xs text-secondary">
            {filtered.length} pengadaan
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">
              inventory_2
            </span>
            <h3 className="font-heading-section text-base text-on-surface">
              Belum Ada Pengadaan
            </h3>
            <p className="text-sm text-secondary mt-1 max-w-sm">
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
          <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-container border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-secondary">
                      Nama Proyek
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-secondary">
                      Klien
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-secondary">
                      Nilai Kontrak
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-secondary">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-secondary">
                      Progress
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-secondary">
                      Dibuat
                    </th>
                    {can('pengadaan:write') && (
                      <th className="text-center px-4 py-3 font-semibold text-secondary w-16">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/procurement/${p.id}`)}
                      className="border-b border-border/50 hover:bg-surface-container/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-60">
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
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {p.client}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-data text-on-surface">
                        {formatCurrency(p.contractValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_COLORS[p.status] || ''}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
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
                      <td className="px-4 py-3 text-right text-outline text-[10px]">
                        {new Date(p.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {can('pengadaan:write') && (
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDeleteClick(e, p)}
                            className="p-1.5 rounded-lg text-outline hover:text-danger hover:bg-danger/5 transition-colors"
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
    </div>
  );
}
