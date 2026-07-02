import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
// NOTE: Cross-store coupling — consider refactoring to event pattern
import { useApprovalStore } from './approvalStore';

interface ProspectState {
  prospects: Prospect[];
  addProspect: (p: Prospect) => void;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
  updateProspectStage: (id: string, stageId: string) => void;
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      prospects: INITIAL_PROSPECTS,
      addProspect: (p) => set((s) => ({ prospects: [...s.prospects, p] })),
      updateProspect: (id, data) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProspect: (id) => {
        // Hapus juga approval terkait
        const approvalStore = useApprovalStore.getState();
        approvalStore.approvals
          .filter((a) => a.entityType === 'prospect' && a.entityId === id)
          .forEach((a) => approvalStore.removeApproval(a.id));
        return set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) }));
      },
      getProspectById: (id) => get().prospects.find((p) => p.id === id),
      updateProspectStage: (id, stageId) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)),
        })),
    }),
    {
      name: 'kinetic-prospects',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 2) {
          // v2: Force re-init with fresh mock data that includes createdByUserId
          return { prospects: INITIAL_PROSPECTS };
        }
        if (version < 3) {
          // v3: Add RBAC fields (currentStageId, departmentId, ownerUserId) with defaults
          return {
            ...current,
            prospects: (current.prospects || []).map((p: any) => ({
              ...p,
              currentStageId: p.currentStageId || 'stage-prospecting',
              departmentId: p.departmentId || 'dept-marketing',
              ownerUserId: p.ownerUserId || p.createdByUserId || '',
            })),
          };
        }
        return current;
      },
    },
  ),
);
