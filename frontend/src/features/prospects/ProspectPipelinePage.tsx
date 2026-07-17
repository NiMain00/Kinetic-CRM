import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/components/ui';
import { PageContainer, PageHeader } from '@/components/shared';
import { useProspectStore } from '@/stores/prospectStore';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useOwnerFilter } from '@/hooks/useOwnerFilter';
import { formatDate } from '@/utils/formatters';
import type { Prospect } from '@/types/domain';

interface Props {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

const HARDCODED_STAGES = [
  { key: 'Lead', label: 'Lead', color: 'bg-indigo-50 border-indigo-300', dot: 'bg-indigo-500' },
  { key: 'Non Potensial', label: 'Non Potensial', color: 'bg-gray-100 border-gray-300', dot: 'bg-gray-400' },
  { key: 'Potensial', label: 'Potensial', color: 'bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500' },
  { key: 'Waiting Supervisor', label: 'Waiting Review', color: 'bg-amber-50 border-amber-300', dot: 'bg-amber-500' },
  { key: 'Revision', label: 'Revision', color: 'bg-rose-50 border-rose-300', dot: 'bg-rose-500' },
  { key: 'Approved', label: 'Approved', color: 'bg-blue-50 border-blue-300', dot: 'bg-blue-500' },
];

const STAGE_COLORS = [
  { color: 'bg-indigo-50 border-indigo-300', dot: 'bg-indigo-500' },
  { color: 'bg-gray-100 border-gray-300', dot: 'bg-gray-400' },
  { color: 'bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500' },
  { color: 'bg-amber-50 border-amber-300', dot: 'bg-amber-500' },
  { color: 'bg-rose-50 border-rose-300', dot: 'bg-rose-500' },
  { color: 'bg-blue-50 border-blue-300', dot: 'bg-blue-500' },
  { color: 'bg-purple-50 border-purple-300', dot: 'bg-purple-500' },
  { color: 'bg-teal-50 border-teal-300', dot: 'bg-teal-500' },
  { color: 'bg-orange-50 border-orange-300', dot: 'bg-orange-500' },
  { color: 'bg-pink-50 border-pink-300', dot: 'bg-pink-500' },
];

function codeToStatusKey(code: string): string {
  return code
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function ProspectCard({
  prospect,
  onDragStart,
  onConvert,
  onEdit,
  onDelete,
  canWrite,
  canCreateProject,
}: {
  prospect: Prospect;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onConvert: (p: Prospect) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canWrite: boolean;
  canCreateProject: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      className="bg-white rounded-xl border border-border/60 p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:shadow-lg group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-on-surface line-clamp-2 leading-snug">
            {prospect.name}
          </p>
        </div>
        <span className="text-[10px] font-mono-data text-outline whitespace-nowrap shrink-0 mt-0.5">
          {formatDate(prospect.date)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-[14px] text-outline">business</span>
        <span className="text-xs text-secondary truncate">{prospect.client}</span>
      </div>

      {prospect.estimatedValue && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-[14px] text-outline">payments</span>
          <span className="text-xs font-semibold text-on-surface">
            Rp {prospect.estimatedValue.toLocaleString('id-ID')}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
            {(prospect.author || '?')[0]}
          </div>
          <span className="text-[10px] text-secondary truncate max-w-[80px]">{prospect.author}</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {prospect.status === 'Approved' && !prospect.isConverted && canCreateProject && (
            <button
              onClick={() => onConvert(prospect)}
              className="p-1 rounded-lg text-success hover:bg-success/10 transition-all"
              title="Buat Proyek"
            >
              <span className="material-symbols-outlined text-[16px]">add_business</span>
            </button>
          )}
          {canWrite && (
            <button
              onClick={() => onEdit(prospect.id)}
              className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-all"
              title="Edit"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {canWrite && (
            <button
              onClick={() => onDelete(prospect.id)}
              className="p-1 rounded-lg text-outline hover:text-danger hover:bg-error-container/20 transition-all"
              title="Hapus"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProspectPipelineView({ onShowNotification }: Props) {
  const navigate = useNavigate();
  const prospects = useProspectStore((s) => s.prospects);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const authUser = useAuthStore((s) => s.user);
  const { can } = useAuthz();
  const { isStaffOnly, userId } = useOwnerFilter();

  const workflowStages = useRbacStore((s) => s.workflowStages);
  const fetchStages = useRbacStore((s) => s.fetchStages);
  const getStagesByModule = useRbacStore((s) => s.getStagesByModule);

  useEffect(() => {
    fetchStages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pipelineStages = useMemo(() => {
    const wfStages = getStagesByModule('prospect');
    if (wfStages.length > 0) {
      return wfStages.map((s, i) => {
        const colors = STAGE_COLORS[i % STAGE_COLORS.length];
        return {
          key: codeToStatusKey(s.code),
          label: s.name,
          color: colors.color,
          dot: colors.dot,
        };
      });
    }
    return HARDCODED_STAGES;
  }, [workflowStages, getStagesByModule]);

  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visibleProspects = prospects.filter((p) => {
    if (isStaffOnly && userId && p.ownerUserId && p.ownerUserId !== userId) return false;
    return true;
  });

  const groupedProspects = pipelineStages.map((stage) => ({
    ...stage,
    prospects: visibleProspects.filter((p) => p.status === stage.key),
  }));

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDragTarget(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: Prospect['status']) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const prospect = visibleProspects.find((p) => p.id === id);
      if (!prospect || prospect.status === status) return;
      updateProspect(id, { status });
      onShowNotification(
        `"${prospect.name}" dipindahkan ke ${status}.`,
        'success',
      );
      setDragTarget(null);
    },
    [visibleProspects, updateProspect, onShowNotification],
  );

  const handleConvert = useCallback(
    (prospect: Prospect) => {
      navigate('/projects/new', { state: { fromProspect: prospect } });
    },
    [navigate],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteProspect(deleteTarget);
      onShowNotification('Prospek berhasil dihapus.', 'success');
      setDeleteTarget(null);
    } catch {
      onShowNotification('Gagal menghapus prospek.', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteProspect, onShowNotification, deleting]);

  const canWrite = can('prospect:write:prospecting');
  const canCreateProject = can('project:create');

  return (
    <PageContainer>
      <PageHeader
        title="Pipeline Prospek"
        description="Drag & drop untuk mengubah status prospek"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[16px]">table_rows</span>}
              onClick={() => navigate('/prospects')}
            >
              Table View
            </Button>
            {canWrite && (
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

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[65vh] scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
        {groupedProspects.map((stage) => (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-[280px] sm:w-[300px] rounded-2xl border-2 ${stage.color} flex flex-col`}
            style={{ scrollSnapAlign: 'start' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.key as Prospect['status'])}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                <h3 className="font-semibold text-sm text-on-surface">{stage.label}</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-secondary">
                {stage.prospects.length}
              </span>
            </div>

            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[200px]">
              {stage.prospects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-2xl text-outline/40 mb-1">inbox</span>
                  <p className="text-xs text-secondary/60">Kosong</p>
                </div>
              ) : (
                stage.prospects.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onDragStart={handleDragStart}
                    onConvert={handleConvert}
                    onEdit={(id) => navigate(`/prospects/${id}/edit`)}
                    onDelete={(id) => setDeleteTarget(id)}
                    canWrite={canWrite}
                    canCreateProject={canCreateProject}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDelete} disabled={deleting} leftIcon={deleting ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> : undefined}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus prospek ini?</p>
        <p className="text-sm text-danger mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Semua proyek yang berasal dari prospek ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </PageContainer>
  );
}
