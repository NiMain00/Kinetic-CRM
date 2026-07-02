import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Procurement, ProcurementStatus, TimelineEvent, DocGroup } from '@/types/domain/procurement';
import { generateProcurementCode } from '@/types/domain/procurement';

interface ProcurementState {
  procurements: Procurement[];
  addProcurement: (
    data: Omit<Procurement, 'id' | 'code' | 'createdAt' | 'progress' | 'status' | 'phase'> & {
      status?: ProcurementStatus;
      phase?: string;
    }
  ) => Procurement;
  updateProcurement: (id: string, data: Partial<Procurement>) => void;
  deleteProcurement: (id: string) => void;
  getProcurementById: (id: string) => Procurement | undefined;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateDocuments: (id: string, docs: DocGroup[]) => void;
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      procurements: [],

      addProcurement: (data) => {
        const state = get();
        const index = state.procurements.length;
        const newProc: Procurement = {
          id: `PRC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: generateProcurementCode(index),
          status: data.status || 'Draft',
          phase: data.phase || 'Draft',
          progress: 0,
          createdAt: new Date().toISOString(),
          timeline: [],
          documents: [],
          ...data,
        };
        set((s) => ({ procurements: [...s.procurements, newProc] }));
        return newProc;
      },

      updateProcurement: (id, data) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p,
          ),
        })),

      deleteProcurement: (id) =>
        set((s) => ({
          procurements: s.procurements.filter((p) => p.id !== id),
        })),

      getProcurementById: (id) => get().procurements.find((p) => p.id === id),

      addTimelineEvent: (id, event) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id
              ? { ...p, timeline: [...(p.timeline || []), event] }
              : p,
          ),
        })),

      updateDocuments: (id, docs) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id ? { ...p, documents: docs } : p,
          ),
        })),
    }),
    { name: 'kinetic-procurement', version: 1 },
  ),
);
