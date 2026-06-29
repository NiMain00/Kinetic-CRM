import React from 'react';
import { Button } from '@/components/ui';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchDelete?: () => void;
  onBatchUpdate?: () => void;
  onBatchExport?: () => void;
}

export default function BulkActions({
  selectedCount,
  onClearSelection,
  onBatchDelete,
  onBatchUpdate,
  onBatchExport,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
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
            onClick={onBatchDelete}
            className="text-danger hover:text-danger hover:bg-red-50"
            leftIcon={<span className="material-symbols-outlined text-[16px]">delete</span>}
          >
            Hapus
          </Button>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={onClearSelection}
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer px-1"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
