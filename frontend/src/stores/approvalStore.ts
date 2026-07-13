import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalItem } from '@/types/domain';
import { masterDataService } from '@/services/master-data';

export interface ApprovalHistoryItem extends ApprovalItem {
  resolvedAt: string;
  action: 'approved' | 'rejected';
}

interface ApprovalState {
  approvals: ApprovalItem[];
  approvalHistory: ApprovalHistoryItem[];
  loading: boolean;
  fetchApprovals: () => Promise<void>;
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
      approvals: [],
      approvalHistory: [],
      loading: false,
      fetchApprovals: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('approvals', { perPage: 100 });
          const list = res.data?.data || res.data || [];
          const normalized = Array.isArray(list)
            ? (list as any[]).map((a) => ({
                ...a,
                assigneeUserId: a.assigneeUserId ?? a.assignedToUserId,
              }))
            : [];
          set({ approvals: normalized, loading: false });
        } catch { set({ loading: false }); }
      },

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

      addApproval: async (item) => {
        try {
          const { ref, name, branch, waitingSince, slaStatus, type, client, entityId, entityType, assigneeUserId, ...prismaFields } = item as any;
          await masterDataService.create('approvals', {
            ...prismaFields,
            assignedToUserId: assigneeUserId,
          });
        } catch {}
        set((s) => ({ approvals: [item, ...s.approvals] }));
      },

      removeApproval: (id) => set(removeById(id)),
    }),
    {
      name: 'kinetic-approvals',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { approvals: current.approvals || [], approvalHistory: current.approvalHistory || [] };
      },
      partialize: (state) => ({ approvals: state.approvals, approvalHistory: state.approvalHistory }),
    },
  ),
);
