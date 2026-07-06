import React from 'react';
import type { ProcurementItem } from '@/types/domain/item';

interface ProcurementAllocationTableProps {
  items: ProcurementItem[];
}

export default function ProcurementAllocationTable({
  items,
}: ProcurementAllocationTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-secondary text-sm">
        Belum ada alokasi item.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider">Item</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider">Project</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider">Qty</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider">Diterima</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map((item) => {
            const statusColor =
              item.status === 'received'
                ? 'text-success bg-success/10'
                : item.status === 'partial'
                  ? 'text-primary bg-primary/10'
                  : item.status === 'ordered'
                    ? 'text-warning bg-warning/10'
                    : 'text-outline bg-surface-container-high';

            const statusLabel =
              item.status === 'received'
                ? 'Diterima'
                : item.status === 'partial'
                  ? 'Sebagian'
                  : item.status === 'ordered'
                    ? 'Dipesan'
                    : 'Menunggu';

            return (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                <td className="py-2.5 px-3">
                  <div className="text-sm font-medium text-on-surface">{item.item.name}</div>
                  <div className="text-[11px] text-outline">{item.item.sku}</div>
                </td>
                <td className="py-2.5 px-3 align-top">
                  <div className="space-y-1">
                    {item.allocations.map((alloc, idx) => (
                      <div key={idx} className="text-xs text-secondary">
                        {alloc.projectId}: {alloc.quantity} {item.item.unit}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-on-surface">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right text-secondary">{item.quantityReceived}</td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>
                    {statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
