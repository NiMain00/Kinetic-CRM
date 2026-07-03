import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DealLineItem } from '@/types/domain/item';

interface DealLineItemState {
  lines: DealLineItem[];
  setLines: (dealId: string, lines: DealLineItem[]) => void;
  addLine: (line: DealLineItem) => void;
  updateLine: (id: string, data: Partial<DealLineItem>) => void;
  removeLine: (id: string) => void;
  getByDealId: (dealId: string) => DealLineItem[];
  getByProjectRequirement: (requirementId: string) => DealLineItem | undefined;
}

export const useDealLineItemStore = create<DealLineItemState>()(
  persist(
    (set, get) => ({
      lines: [],

      setLines: (dealId, items) =>
        set((s) => ({
          lines: [
            ...s.lines.filter((l) => l.dealId !== dealId),
            ...items.map((l) => ({ ...l, dealId })),
          ],
        })),

      addLine: (line) =>
        set((s) => ({ lines: [...s.lines, line] })),

      updateLine: (id, data) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, ...data } : l)),
        })),

      removeLine: (id) =>
        set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),

      getByDealId: (dealId) => get().lines.filter((l) => l.dealId === dealId),

      getByProjectRequirement: (requirementId) =>
        get().lines.find((l) => l.projectRequirementId === requirementId),
    }),
    {
      name: 'kinetic-deal-line-items',
      version: 1,
    },
  ),
);
