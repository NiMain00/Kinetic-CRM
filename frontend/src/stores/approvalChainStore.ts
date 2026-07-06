import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const INITIAL_CHAINS: ApprovalChain[] = [
  {
    id: 'chain-pc-001',
    name: 'Procurement Approval (Standard)',
    module: 'procurement',
    isActive: true,
    levels: [
      { id: 'lvl-pc-1', name: 'Manager Review', role: 'Manager', order: 1, maxAmount: 50000000 },
      { id: 'lvl-pc-2', name: 'Finance Director', role: 'Finance Director', order: 2, minAmount: 50000001, maxAmount: 500000000 },
      { id: 'lvl-pc-3', name: 'Director', role: 'Director', order: 3, minAmount: 500000001 },
    ],
  },
  {
    id: 'chain-pr-001',
    name: 'Project Approval (Standard)',
    module: 'project',
    isActive: true,
    levels: [
      { id: 'lvl-pr-1', name: 'Project Manager', role: 'Manager', order: 1 },
      { id: 'lvl-pr-2', name: 'Operations Director', role: 'Director', order: 2 },
    ],
  },
];

export const useApprovalChainStore = create<ApprovalChainState>()(
  persist(
    (set, get) => ({
      chains: INITIAL_CHAINS,
      requests: [],

      addChain: (chain) =>
        set((s) => ({ chains: [...s.chains, chain] })),

      updateChain: (id, data) =>
        set((s) => ({
          chains: s.chains.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteChain: (id) =>
        set((s) => ({ chains: s.chains.filter((c) => c.id !== id) })),

      getActiveChain: (module, amount) => {
        return get().chains.find(
          (c) => c.module === module && c.isActive,
        );
      },

      createRequest: (req) =>
        set((s) => ({ requests: [req, ...s.requests] })),

      approveLevel: (requestId, levelIndex, approver, note) =>
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
        })),

      rejectRequest: (requestId, approver, note) =>
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
        })),

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
      version: 1,
      partialize: (state) => ({
        chains: state.chains,
        requests: state.requests,
      }),
    },
  ),
);
