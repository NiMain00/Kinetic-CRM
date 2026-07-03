import { useMemo } from 'react';
import { useProjectRequirementStore } from '@/stores/projectRequirementStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';
import { useProcurementItemStore } from '@/stores/procurementItemStore';
import { getQuantityPending } from '@/services/itemHandoffService';

/**
 * Orchestration hook — bukan store merger.
 * Menggabungkan data dari 3 store independent untuk kebutuhan view
 * yang menampilkan relasi Project → Procurement.
 */
export function useProjectRequirementSync(projectId: string) {
  const requirements = useProjectRequirementStore((s) =>
    s.requirements.filter((r) => r.projectId === projectId),
  );
  const procurements = useProcurementStore((s) =>
    s.procurements.filter((p) => p.sourceProjectId === projectId),
  );

  const procurementIds = procurements.map((p) => p.id);
  const procurementItems = useProcurementItemStore((s) =>
    s.items.filter((i) => procurementIds.includes(i.procurementId)),
  );

  return useMemo(
    () => ({
      requirements,
      procurements,

      /** Item yang masih perlu diajukan ke procurement */
      pendingItems: requirements.filter((r) => getQuantityPending(r) > 0),

      /** Item yang sudah fully submitted atau received */
      fulfilledItems: requirements.filter(
        (r) =>
          r.procurementStatus === 'fully_submitted' ||
          r.procurementStatus === 'received',
      ),

      /** Total quantity yang belum diajukan */
      totalPending: requirements.reduce(
        (sum, r) => sum + getQuantityPending(r),
        0,
      ),

      /** Item procurement milik project ini */
      procurementItems,
    }),
    [requirements, procurements, procurementItems],
  );
}

/**
 * Sync helper: setelah procurement dibuat, update status requirement.
 * Panggil dari event handler, bukan dari render.
 */
export function syncRequirementsAfterProcurement(
  projectId: string,
  procurementId: string,
) {
  const requirements = useProjectRequirementStore
    .getState()
    .getByProjectId(projectId);

  const items = useProcurementItemStore
    .getState()
    .getByProcurementId(procurementId);

  for (const item of items) {
    for (const alloc of item.allocations) {
      const req = requirements.find(
        (r) => r.id === alloc.projectRequirementId,
      );
      if (req) {
        useProjectRequirementStore
          .getState()
          .incrementProcured(req.id, alloc.quantity);
      }
    }
  }
}
