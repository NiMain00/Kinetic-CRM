import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterDataService } from '@/services/master-data';
import type { Supplier, SupplierEvaluation } from '@/types/domain/procurement';

interface SupplierState {
  entities: Record<string, Supplier>;
  ids: string[];
  suppliers: Supplier[];
  loading: boolean;

  addSupplier: (s: Supplier) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  addEvaluation: (supplierId: string, evaluation: SupplierEvaluation) => void;
  fetchSuppliers: () => Promise<void>;
}

function deriveSuppliers(
  entities: Record<string, Supplier>,
  ids: string[],
): Supplier[] {
  const arr: Supplier[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      suppliers: [],
      loading: false,

      fetchSuppliers: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('suppliers');
          if (res.data?.data) {
            const suppliers = res.data.data as unknown as Supplier[];
            const entities: Record<string, Supplier> = {};
            const ids: string[] = [];
            suppliers.forEach((s) => {
              entities[s.id] = s;
              ids.push(s.id);
            });
            set({ entities, ids, suppliers: deriveSuppliers(entities, ids), loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      addSupplier: async (s) => {
        try {
          await masterDataService.create('suppliers', s as unknown as Record<string, unknown>);
        } catch {
          // non-blocking
        }
        set((state) => {
          const entities = { ...state.entities, [s.id]: s };
          const ids = [...state.ids, s.id];
          return { entities, ids, suppliers: deriveSuppliers(entities, ids) };
        });
      },

      updateSupplier: async (id, data) => {
        try {
          await masterDataService.update('suppliers', id, data as unknown as Record<string, unknown>);
        } catch {
          // non-blocking
        }
        set((state) => {
          const existing = state.entities[id];
          if (!existing) return state;
          const entities = { ...state.entities, [id]: { ...existing, ...data } };
          return { entities, suppliers: deriveSuppliers(entities, state.ids) };
        });
      },

      deleteSupplier: async (id) => {
        try {
          await masterDataService.delete('suppliers', id);
        } catch {
          // non-blocking
        }
        set((state) => {
          const entities = { ...state.entities };
          delete entities[id];
          const ids = state.ids.filter((i) => i !== id);
          return { entities, ids, suppliers: deriveSuppliers(entities, ids) };
        });
      },

      getSupplierById: (id) => get().entities[id],

      addEvaluation: (supplierId, evaluation) =>
        set((state) => {
          const existing = state.entities[supplierId];
          if (!existing) return state;
          const evaluations = [...existing.evaluations, evaluation];
          const totalEvals = evaluations.length;
          const overall = evaluations.reduce((sum, e) => sum + e.overall, 0) / totalEvals;
          const entities = {
            ...state.entities,
            [supplierId]: {
              ...existing,
              evaluations,
              rating: Math.round(overall * 10) / 10,
            },
          };
          return { entities, suppliers: deriveSuppliers(entities, state.ids) };
        }),
    }),
    {
      name: 'kinetic-suppliers',
      version: 2,
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { entities: current.entities || {}, ids: current.ids || [] };
      },
    },
  ),
);
