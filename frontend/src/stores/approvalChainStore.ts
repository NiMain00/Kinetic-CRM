import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterDataService } from '@/services/master-data';

export interface ApprovalLevel {
  id: string;
  name: string;
  role: string;
  order: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface ApprovalChain {
  id: string;
  name: string;
  module: 'procurement' | 'project' | 'prospect';
  levels: ApprovalLevel[];
  isActive: boolean;
}

export interface ApprovalRequest {
  id: string;
  chainId: string;
  entityId: string;
  entityType: 'procurement' | 'project' | 'prospect';
  entityName: string;
  entityCode: string;
  amount: number;
  currentLevel: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  levels: Array<{
    levelId: string;
    levelName: string;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    approver?: string;
    note?: string;
    resolvedAt?: string;
  }>;
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

interface ApprovalChainState {
  chains: ApprovalChain[];
  requests: ApprovalRequest[];
  loading: boolean;
  fetchChains: () => Promise<void>;

  addChain: (chain: ApprovalChain) => void;
  updateChain: (id: string, data: Partial<ApprovalChain>) => void;
  deleteChain: (id: string) => void;
  getActiveChain: (module: ApprovalChain['module'], amount: number) => ApprovalChain | undefined;

  createRequest: (req: ApprovalRequest) => void;
  approveLevel: (requestId: string, levelIndex: number, approver: string, note?: string) => void;
  rejectRequest: (requestId: string, approver: string, note?: string) => void;
  getRequestsByEntity: (entityId: string) => ApprovalRequest[];
  getPendingRequests: (role: string) => ApprovalRequest[];
}

export const useApprovalChainStore = create<ApprovalChainState>()(
  persist(
    (set, get) => ({
      chains: [],
      requests: [],
      loading: false,
      fetchChains: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('approvalChains', { perPage: 100 });
          const list = res.data?.data || res.data || [];
          set({ chains: Array.isArray(list) ? (list as any) : [], loading: false });
        } catch { set({ loading: false }); }
      },

      addChain: async (chain) => {
        try { await masterDataService.create('approvalChains', chain as any); } catch (err) { console.error('[approvalChainStore] addChain API failed:', err); }
        set((s) => ({ chains: [...s.chains, chain] }));
      },

      updateChain: async (id, data) => {
        try { await masterDataService.update('approvalChains', id, data as any); } catch (err) { console.error('[approvalChainStore] updateChain API failed:', err); }
        set((s) => ({
          chains: s.chains.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteChain: async (id) => {
        try { await masterDataService.delete('approvalChains', id); } catch (err) { console.error('[approvalChainStore] deleteChain API failed:', err); }
        set((s) => ({ chains: s.chains.filter((c) => c.id !== id) }));
      },

      getActiveChain: (module, amount) => {
        return get().chains.find(
          (c) => c.module === module && c.isActive,
        );
      },

      createRequest: async (req) => {
        try {
          const res = await masterDataService.create('approvalChains', { type: 'request', ...req } as any);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) {
            req = { ...req, id: created.id };
          }
        } catch (err) {
          console.error('[approvalChainStore] createRequest API failed:', err);
        }
        set((s) => ({ requests: [req, ...s.requests] }));
      },

      approveLevel: async (requestId, levelIndex, approver, note) => {
        try {
          await masterDataService.update('approvalChains', requestId, {
            status: levelIndex === 0 ? 'in_progress' : undefined,
            resolvedAt: new Date().toISOString(),
          } as any);
        } catch (err) {
          console.error('[approvalChainStore] approveLevel API failed:', err);
        }
        set((s) => ({
          requests: s.requests.map((req) => {
            if (req.id !== requestId) return req;
            const levels = [...req.levels];
            levels[levelIndex] = {
              ...levels[levelIndex],
              status: 'approved',
              approver,
              note,
              resolvedAt: new Date().toISOString(),
            };

            const isLastLevel = levelIndex === levels.length - 1;
            const allApproved = levels.every((l) => l.status === 'approved');
            const anyRejected = levels.some((l) => l.status === 'rejected');

            return {
              ...req,
              levels,
              currentLevel: isLastLevel ? levelIndex : levelIndex + 1,
              status: allApproved ? 'approved' : anyRejected ? 'rejected' : 'in_progress',
              resolvedAt: allApproved || anyRejected ? new Date().toISOString() : undefined,
            };
          }),
        }));
      },

      rejectRequest: async (requestId, approver, note) => {
        try {
          await masterDataService.update('approvalChains', requestId, {
            status: 'rejected',
            resolvedAt: new Date().toISOString(),
          } as any);
        } catch (err) {
          console.error('[approvalChainStore] rejectRequest API failed:', err);
        }
        set((s) => ({
          requests: s.requests.map((req) => {
            if (req.id !== requestId) return req;
            const levels = [...req.levels];
            const currentLevel = levels.findIndex((l) => l.status === 'pending');
            if (currentLevel >= 0) {
              levels[currentLevel] = {
                ...levels[currentLevel],
                status: 'rejected',
                approver,
                note,
                resolvedAt: new Date().toISOString(),
              };
            }
            return {
              ...req,
              levels,
              status: 'rejected' as const,
              resolvedAt: new Date().toISOString(),
              note,
            };
          }),
        }));
      },

      getRequestsByEntity: (entityId) =>
        get().requests.filter((r) => r.entityId === entityId),

      getPendingRequests: (role) =>
        get().requests.filter(
          (r) =>
            r.status === 'in_progress' || r.status === 'pending',
        ),
    }),
    {
      name: 'kinetic-approval-chains',
      version: 2,
      partialize: (state) => ({
        chains: state.chains,
        requests: state.requests,
      }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { chains: current.chains || [], requests: current.requests || [] };
      },
    },
  ),
);
