import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcurementItem } from '@/types/domain/item';

interface ProcurementItemState {
  items: ProcurementItem[];
  setItems: (procurementId: string, items: ProcurementItem[]) => void;
  addItem: (item: ProcurementItem) => void;
  updateItem: (id: string, data: Partial<ProcurementItem>) => void;
  removeItem: (id: string) => void;
  getByProcurementId: (procurementId: string) => ProcurementItem[];
  getByProjectId: (projectId: string) => ProcurementItem[];
}

export const useProcurementItemStore = create<ProcurementItemState>()(
  persist(
    (set, get) => ({
      items: [],

      setItems: (procurementId, items) =>
        set((s) => ({
          items: [
            ...s.items.filter((i) => i.procurementId !== procurementId),
            ...items.map((i) => ({ ...i, procurementId })),
          ],
        })),

      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),

      updateItem: (id, data) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

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
    },
  ),
);
