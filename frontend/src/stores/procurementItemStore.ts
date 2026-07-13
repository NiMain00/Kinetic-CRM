import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcurementItem } from '@/types/domain/item';
import { masterDataService } from '@/services/master-data';

interface ProcurementItemState {
  items: ProcurementItem[];
  loading: boolean;
  setItems: (procurementId: string, items: ProcurementItem[]) => void;
  addItem: (item: ProcurementItem) => void;
  updateItem: (id: string, data: Partial<ProcurementItem>) => void;
  removeItem: (id: string) => void;
  getByProcurementId: (procurementId: string) => ProcurementItem[];
  getByProjectId: (projectId: string) => ProcurementItem[];
  fetchItems: () => Promise<void>;
}

export const useProcurementItemStore = create<ProcurementItemState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      setItems: async (procurementId, items) => {
        try {
          await masterDataService.create('procurementItems', { items, procurementId } as any);
        } catch (err) {
          console.error('[procurementItemStore] setItems API failed:', err);
        }
        set((s) => ({
          items: [
            ...s.items.filter((i) => i.procurementId !== procurementId),
            ...items.map((i) => ({ ...i, procurementId })),
          ],
        }));
      },

      addItem: async (item) => {
        try {
          await masterDataService.create('procurementItems', item as any);
        } catch (err) {
          console.error('[procurementItemStore] addItem API failed:', err);
        }
        set((s) => ({ items: [...s.items, item] }));
      },

      updateItem: async (id, data) => {
        try {
          await masterDataService.update('procurementItems', id, data as any);
        } catch (err) {
          console.error('[procurementItemStore] updateItem API failed:', err);
        }
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
        }));
      },

      removeItem: async (id) => {
        try {
          await masterDataService.delete('procurementItems', id);
        } catch (err) {
          console.error('[procurementItemStore] removeItem API failed:', err);
        }
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      fetchItems: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('procurementItems', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          set({ items: list as unknown as ProcurementItem[], loading: false });
        } catch {
          set({ loading: false });
        }
      },

      getByProcurementId: (procurementId) =>
        get().items.filter((i) => i.procurementId === procurementId),

      getByProjectId: (projectId) =>
        get().items.filter((i) =>
          i.allocations.some((a) => a.projectId === projectId),
        ),
    }),
    {
      name: 'kinetic-procurement-items',
      version: 1,
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
