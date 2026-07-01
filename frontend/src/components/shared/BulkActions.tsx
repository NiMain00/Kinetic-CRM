import React, { useState } from 'react';
import { Button, Modal } from '@/components/ui';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchDelete?: () => void;
  onBatchUpdate?: () => void;
  onBatchExport?: () => void;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
}

export default function BulkActions({
  selectedCount,
  onClearSelection,
  onBatchDelete,
  onBatchUpdate,
  onBatchExport,
  deleteConfirmTitle = 'Konfirmasi Hapus',
  deleteConfirmMessage,
}: BulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onBatchDelete?.();
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 animate-fade-in">
        <span className="text-xs font-semibold text-primary whitespace-nowrap">
          {selectedCount} terpilih
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          {onBatchUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchUpdate}
              leftIcon={<span className="material-symbols-outlined text-[16px]">edit_note</span>}
            >
              Update Status
            </Button>
          )}
          {onBatchExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchExport}
              leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}
            >
              Export
            </Button>
          )}
          {onBatchDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="text-danger hover:text-danger hover:bg-danger/10"
              leftIcon={<span className="material-symbols-outlined text-[16px]">delete</span>}
            >
              Hapus
            </Button>
          )}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={onClearSelection}
            className="text-[11px] font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer px-1"
          >
            Batal
          </button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={deleteConfirmTitle}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
            <Button variant="danger" size="md" onClick={handleConfirmDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          {deleteConfirmMessage || `Apakah Anda yakin ingin menghapus ${selectedCount} item yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        </p>
      </Modal>
    </>
  );
}
