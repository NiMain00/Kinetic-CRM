import React, { useMemo } from 'react';
import { Button, Modal } from '@/components/ui';
import { useProspectStore } from '@/stores/prospectStore';
import { findDuplicates, mergeProspectData, type DuplicateGroup } from '@/utils/duplicateDetection';
import type { Prospect } from '@/types/domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function DuplicateDetectionPanel({ isOpen, onClose, onShowNotification }: Props) {
  const prospects = useProspectStore((s) => s.prospects);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);

  const duplicateGroups = useMemo(() => findDuplicates(prospects), [prospects]);

  const handleMerge = (group: DuplicateGroup) => {
    group.duplicates.forEach((dup) => {
      const merged = mergeProspectData(group.original, dup);
      updateProspect(group.original.id, merged);
      deleteProspect(dup.id);
    });
    onShowNotification(
      `${group.duplicates.length} duplikat berhasil digabung ke "${group.original.name}".`,
      'success',
    );
  };

  const handleDeleteDuplicate = (id: string) => {
    deleteProspect(id);
    onShowNotification('Duplikat berhasil dihapus.', 'success');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deteksi Duplikat (${duplicateGroups.length} grup ditemukan)`}
      footer={
        <Button variant="secondary" size="md" onClick={onClose}>Tutup</Button>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {duplicateGroups.length === 0 ? (
          <div className="text-center py-8 text-secondary">
            <span className="material-symbols-outlined text-4xl text-success mb-2">check_circle</span>
            <p className="font-semibold text-on-surface">Tidak ada duplikat ditemukan</p>
            <p className="text-sm">Semua prospek sudah unik.</p>
          </div>
        ) : (
          duplicateGroups.map((group, idx) => (
            <div key={idx} className="border border-border/60 rounded-xl p-4 bg-surface-container-low">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning text-[20px]">warning</span>
                  <span className="font-semibold text-sm text-on-surface">
                    Duplikat Terdeteksi
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {group.score}% mirip
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="border border-border/40 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">star</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Primary</span>
                  </div>
                  <p className="font-semibold text-sm text-on-surface mb-1">{group.original.name}</p>
                  <p className="text-xs text-secondary">{group.original.client}</p>
                  {group.original.estimatedValue && (
                    <p className="text-xs text-secondary mt-0.5">
                      Rp {group.original.estimatedValue.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {group.duplicates.map((dup) => (
                    <div key={dup.id} className="border border-border/40 rounded-lg p-3 bg-white flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-on-surface mb-0.5">{dup.name}</p>
                        <p className="text-xs text-secondary">{dup.client}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDuplicate(dup.id)}
                        className="p-1 rounded-lg text-outline hover:text-danger hover:bg-error-container/20 transition-all shrink-0"
                        title="Hapus duplikat"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {group.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {group.reasons.map((reason, ri) => (
                    <span key={ri} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-secondary">
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleMerge(group)}
                leftIcon={<span className="material-symbols-outlined text-[14px]">merge</span>}
              >
                Gabung {group.duplicates.length} duplikat ke primary
              </Button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
