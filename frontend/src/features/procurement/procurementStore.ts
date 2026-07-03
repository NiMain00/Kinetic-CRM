import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Procurement, ProcurementStatus, TimelineEvent, DocGroup } from '@/types/domain/procurement';
import { generateProcurementCode } from '@/types/domain/procurement';

interface ProcurementState {
  /** Normalized entity map */
  entities: Record<string, Procurement>;
  /** Ordered IDs */
  ids: string[];
  /** Derived array — backward-compat selector */
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

// ─── Helpers ────────────────────────────────────────────────────────────

function deriveProcurements(
  entities: Record<string, Procurement>,
  ids: string[],
): Procurement[] {
  const arr: Procurement[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  // Filter out orphaned IDs whose entity was deleted but ID lingers
  return arr.filter(Boolean);
}

function normalizeProcurements(procs: Procurement[]): {
  entities: Record<string, Procurement>;
  ids: string[];
} {
  const entities: Record<string, Procurement> = {};
  const ids: string[] = new Array(procs.length);
  for (let i = 0; i < procs.length; i++) {
    const p = procs[i];
    entities[p.id] = p;
    ids[i] = p.id;
  }
  return { entities, ids };
}

function updateOne(
  entities: Record<string, Procurement>,
  ids: string[],
  id: string,
  updater: (e: Procurement) => Procurement,
): { entities: Record<string, Procurement>; procurements: Procurement[] } {
  const existing = entities[id];
  if (!existing) {
    return { entities, procurements: deriveProcurements(entities, ids) };
  }
  const next = { ...entities, [id]: updater(existing) };
  return {
    entities: next,
    procurements: deriveProcurements(next, ids),
  };
}

// ─── Store ──────────────────────────────────────────────────────────────

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      procurements: [],

      addProcurement: (data) => {
        const state = get();
        const index = state.ids.length;
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
        set((s) => {
          const entities = { ...s.entities, [newProc.id]: newProc };
          const ids = [...s.ids, newProc.id];
          return { entities, ids, procurements: deriveProcurements(entities, ids) };
        });
        return newProc;
      },

      updateProcurement: (id, data) =>
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }));
          return { ...r, ids: s.ids };
        }),

      deleteProcurement: (id) =>
        set((s) => {
          const entities = { ...s.entities };
          delete entities[id];
          const ids = s.ids.filter((i) => i !== id);
          return { entities, ids, procurements: deriveProcurements(entities, ids) };
        }),

      getProcurementById: (id) => get().entities[id],

      addTimelineEvent: (id, event) =>
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({
            ...e,
            timeline: [...(e.timeline || []), event],
          }));
          return { ...r, ids: s.ids };
        }),

      updateDocuments: (id, docs) =>
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({ ...e, documents: docs }));
          return { ...r, ids: s.ids };
        }),
    }),
    {
      name: 'kinetic-procurement',
      version: 2,
      merge: (persisted: unknown, current: ProcurementState) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Partial<ProcurementState>;
        if (p.entities && p.ids) {
          return {
            ...current,
            ...p,
            procurements: deriveProcurements(p.entities, p.ids),
          };
        }
        return { ...current, ...p };
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;

        // v1→v2: normalize to Record pattern
        if (version < 2) {
          const raw = current.procurements || [];
          const { entities, ids } = normalizeProcurements(raw);
          return { entities, ids, procurements: deriveProcurements(entities, ids) };
        }

        // Ensure derived `procurements` for loads from direct persist
        if (!current.procurements && current.entities && current.ids) {
          return {
            ...current,
            procurements: deriveProcurements(current.entities, current.ids),
          };
        }

        return current;
      },
      // Only persist entities + ids; procurements is derived on hydrate
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);
