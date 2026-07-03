import React, { useMemo } from 'react';
import { Button } from '@/components/ui';
import type { ProcurementAllocation } from '@/types/domain/item';

interface ConsolidationGroup {
  sku: string;
  name: string;
  totalQty: number;
  unit: string;
  projectCount: number;
  allocations: ProcurementAllocation[];
}

interface ProcurementConsolidatorProps {
  groups: ConsolidationGroup[];
  onConsolidate: (sku: string, allocations: ProcurementAllocation[]) => void;
}

export default function ProcurementConsolidator({
  groups,
  onConsolidate,
}: ProcurementConsolidatorProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-secondary text-sm">
        Tidak ada item yang bisa dikonsolidasi.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-on-surface">
          Konsolidasi Pengadaan
        </h4>
        <span className="text-xs text-outline">
          {groups.length} item dari {new Set(groups.flatMap(g => g.allocations.map(a => a.projectId))).size} proyek
        </span>
      </div>

      <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
        {groups.map((group) => (
          <div key={group.sku} className="p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">
                  {group.name}
                </p>
                <p className="text-[11px] text-outline">
                  {group.sku} · {group.projectCount} proyek · @{group.unit}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-on-surface">
                  {group.totalQty}
                </p>
                <p className="text-[10px] text-outline">{group.unit}</p>
              </div>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConsolidate(group.sku, group.allocations)}
                leftIcon={<span className="material-symbols-outlined text-[14px]">merge</span>}
              >
                Gabung ke 1 PO ({group.totalQty} {group.unit})
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
