import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalItem } from '@/types/domain';
import { INITIAL_APPROVALS } from '@/services/mock-data';

export interface ApprovalHistoryItem extends ApprovalItem {
  resolvedAt: string;
  action: 'approved' | 'rejected';
}

interface ApprovalState {
  approvals: ApprovalItem[];
  approvalHistory: ApprovalHistoryItem[];
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
      approvalHistory: [],

      getPendingCount: () => get().approvals.length,

      getPendingCountByUser: (userId) => get().approvals.filter((a) => a.assigneeUserId === userId).length,

      getPendingByType: (type) => get().approvals.filter((a) => a.type === type),

      getPendingByUser: (userId) => get().approvals.filter((a) => a.assigneeUserId === userId),

      approveItem: (id) =>
        set((s) => {
          const item = s.approvals.find((a) => a.id === id);
          if (!item) return s;
          return {
            approvals: s.approvals.filter((a) => a.id !== id),
            approvalHistory: [
              { ...item, resolvedAt: new Date().toISOString(), action: 'approved' },
              ...s.approvalHistory,
            ],
          };
        }),

      rejectItem: (id) =>
        set((s) => {
          const item = s.approvals.find((a) => a.id === id);
          if (!item) return s;
          return {
            approvals: s.approvals.filter((a) => a.id !== id),
            approvalHistory: [
              { ...item, resolvedAt: new Date().toISOString(), action: 'rejected' },
              ...s.approvalHistory,
            ],
          };
        }),

      addApproval: (item) =>
        set((s) => {
          const existing = s.approvals.find((a) => a.id === item.id || (a.entityId === item.entityId && a.entityType === item.entityType));
          if (existing) {
            return { approvals: s.approvals.map((a) => (a.id === existing.id ? item : a)) };
          }
          return { approvals: [...s.approvals, item] };
        }),

      removeApproval: (id) => set(removeById(id)),
    }),
    {
      name: 'kinetic-approvals',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 2) {
          return { ...current, approvals: INITIAL_APPROVALS, approvalHistory: [] } as ApprovalState;
        }
        if (version < 3) {
          return { ...current, approvalHistory: [] } as ApprovalState;
        }
        return current as ApprovalState;
      },
    },
  ),
);
