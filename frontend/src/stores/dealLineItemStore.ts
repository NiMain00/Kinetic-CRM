import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DealLineItem } from '@/types/domain/item';
import { masterDataService } from '@/services/master-data';

interface DealLineItemState {
  lines: DealLineItem[];
  loading: boolean;
  setLines: (dealId: string, lines: DealLineItem[]) => void;
  addLine: (line: DealLineItem) => void;
  updateLine: (id: string, data: Partial<DealLineItem>) => void;
  removeLine: (id: string) => void;
  getByDealId: (dealId: string) => DealLineItem[];
  getByProjectRequirement: (requirementId: string) => DealLineItem | undefined;
  fetchLines: () => Promise<void>;
}

export const useDealLineItemStore = create<DealLineItemState>()(
  persist(
    (set, get) => ({
      lines: [],
      loading: false,

      setLines: async (dealId, items) => {
        try {
          await masterDataService.create('dealLineItems', { items, dealId } as any);
        } catch (err) {
          console.error('[dealLineItemStore] setLines API failed:', err);
        }
        set((s) => ({
          lines: [
            ...s.lines.filter((l) => l.dealId !== dealId),
            ...items.map((l) => ({ ...l, dealId })),
          ],
        }));
      },

      addLine: async (line) => {
        try {
          await masterDataService.create('dealLineItems', line as any);
        } catch (err) {
          console.error('[dealLineItemStore] addLine API failed:', err);
        }
        set((s) => ({ lines: [...s.lines, line] }));
      },

      updateLine: async (id, data) => {
        try {
          await masterDataService.update('dealLineItems', id, data as any);
        } catch (err) {
          console.error('[dealLineItemStore] updateLine API failed:', err);
        }
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, ...data } : l)),
        }));
      },

      removeLine: async (id) => {
        try {
          await masterDataService.delete('dealLineItems', id);
        } catch (err) {
          console.error('[dealLineItemStore] removeLine API failed:', err);
        }
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) }));
      },

      fetchLines: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('dealLineItems', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          set({ lines: list as unknown as DealLineItem[], loading: false });
        } catch {
          set({ loading: false });
        }
      },

      getByDealId: (dealId) => get().lines.filter((l) => l.dealId === dealId),

      getByProjectRequirement: (requirementId) =>
        get().lines.find((l) => l.projectRequirementId === requirementId),
    }),
    {
      name: 'kinetic-deal-line-items',
      version: 1,
      partialize: (state) => ({
        lines: state.lines,
      }),
    },
  ),
);
