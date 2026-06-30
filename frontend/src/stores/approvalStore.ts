import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalItem } from '@/types/domain';
import { INITIAL_APPROVALS } from '@/services/mock-data';

interface ApprovalState {
  approvals: ApprovalItem[];
  getPendingCount: () => number;
  getPendingCountByUser: (userId: string) => number;
  getPendingByType: (type: ApprovalItem['type']) => ApprovalItem[];
  getPendingByUser: (userId: string) => ApprovalItem[];
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  addApproval: (item: ApprovalItem) => void;
  removeApproval: (id: string) => void;
}

const removeById = (id: string) => (s: { approvals: ApprovalItem[] }) => ({
  approvals: s.approvals.filter((a) => a.id !== id),
});

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: INITIAL_APPROVALS,

      getPendingCount: () => get().approvals.length,

      getPendingCountByUser: (userId) => get().approvals.filter((a) => a.assigneeUserId === userId).length,

      getPendingByType: (type) => get().approvals.filter((a) => a.type === type),

      getPendingByUser: (userId) => get().approvals.filter((a) => a.assigneeUserId === userId),

      approveItem: (id) => set(removeById(id)),

      rejectItem: (id) => set(removeById(id)),

      addApproval: (item) =>
        set((s) => ({
          approvals: [...s.approvals, item],
        })),

      removeApproval: (id) => set(removeById(id)),
    }),
    {
      name: 'kinetic-approvals',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 2) {
          // v2: Force re-init with fresh mock data
          return { ...current, approvals: INITIAL_APPROVALS } as ApprovalState;
        }
        return current as ApprovalState;
      },
    },
  ),
);
