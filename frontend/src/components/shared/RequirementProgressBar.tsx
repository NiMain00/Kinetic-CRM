import React from 'react';
import type { ProjectRequirementItem } from '@/types/domain/item';
import { getQuantityPending, getProcurementProgress } from '@/services/itemHandoffService';

interface RequirementProgressBarProps {
  item: ProjectRequirementItem;
  onProcure?: (item: ProjectRequirementItem) => void;
}

export default function RequirementProgressBar({
  item,
  onProcure,
}: RequirementProgressBarProps) {
  const pending = getQuantityPending(item);
  const progress = getProcurementProgress(item);
  const isFullyProcured = item.procurementStatus === 'fully_submitted' || item.procurementStatus === 'received';

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex justify-between items-center text-xs">
        <div className="min-w-0 flex-1">
          <span className="font-medium text-on-surface truncate block">
            {item.item.name}
          </span>
          <span className="text-outline text-[10px]">
            {item.item.sku} · {item.item.unit}
          </span>
        </div>
        <div className="text-right shrink-0 ml-3">
          <span className="font-semibold text-on-surface">
            {item.quantityProcured}
          </span>
          <span className="text-outline">/{item.quantityRequired}</span>
          <span className="text-outline text-[10px] ml-1">{item.item.unit}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFullyProcured
              ? 'bg-success'
              : progress > 0
                ? 'bg-primary'
                : 'bg-outline/30'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Status + action row */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${
          isFullyProcured
            ? 'text-success'
            : progress > 0
              ? 'text-primary'
              : 'text-outline'
        }`}>
          {item.procurementStatus === 'received'
            ? 'Sudah diterima'
            : item.procurementStatus === 'fully_submitted'
              ? 'Sudah diajukan semua'
              : item.procurementStatus === 'partial'
                ? `Sebagian diajukan (${progress}%)`
                : 'Belum diajukan'}
        </span>

        {pending > 0 && onProcure && (
          <button
            type="button"
            onClick={() => onProcure(item)}
            className="text-[10px] font-semibold text-primary hover:text-primary-light hover:underline transition-colors"
          >
            Ajukan {pending} {item.item.unit} ke Pengadaan →
          </button>
        )}
      </div>
    </div>
  );
}
