import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalItem } from '@/types/domain';
import { INITIAL_APPROVALS } from '@/services/mock-data';

interface ApprovalState {
  approvals: ApprovalItem[];
  getPendingCount: () => number;
  getPendingByType: (type: ApprovalItem['type']) => ApprovalItem[];
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  addApproval: (item: ApprovalItem) => void;
  removeApproval: (id: string) => void;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: INITIAL_APPROVALS,

      getPendingCount: () => get().approvals.length,

      getPendingByType: (type) => get().approvals.filter((a) => a.type === type),

      approveItem: (id) =>
        set((s) => ({
          approvals: s.approvals.filter((a) => a.id !== id),
        })),

      rejectItem: (id) =>
        set((s) => ({
          approvals: s.approvals.filter((a) => a.id !== id),
        })),

      addApproval: (item) =>
        set((s) => ({
          approvals: [...s.approvals, item],
        })),

      removeApproval: (id) =>
        set((s) => ({
          approvals: s.approvals.filter((a) => a.id !== id),
        })),
    }),
    { name: 'kinetic-approvals' },
  ),
);
