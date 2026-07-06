import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rfq, RfqQuote } from '@/types/domain/procurement';

interface RfqState {
  entities: Record<string, Rfq>;
  ids: string[];
  rfqs: Rfq[];

  addRfq: (rfq: Rfq) => void;
  updateRfq: (id: string, data: Partial<Rfq>) => void;
  deleteRfq: (id: string) => void;
  getRfqById: (id: string) => Rfq | undefined;
  getRfqsByProcurement: (procurementId: string) => Rfq[];
  addQuote: (rfqId: string, quote: RfqQuote) => void;
  submitRfq: (id: string) => void;
  selectQuote: (rfqId: string, quoteId: string) => void;
}

function deriveRfqs(entities: Record<string, Rfq>, ids: string[]): Rfq[] {
  const arr: Rfq[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

function generateRfqNumber(index: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `RFQ-${year}${month}-${String(index + 1).padStart(4, '0')}`;
}

export const useRfqStore = create<RfqState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      rfqs: [],

      addRfq: (rfq) =>
        set((state) => {
          const entities = { ...state.entities, [rfq.id]: rfq };
          const ids = [...state.ids, rfq.id];
          return { entities, ids, rfqs: deriveRfqs(entities, ids) };
        }),

      updateRfq: (id, data) =>
        set((state) => {
          const existing = state.entities[id];
          if (!existing) return state;
          const entities = { ...state.entities, [id]: { ...existing, ...data } };
          return { entities, rfqs: deriveRfqs(entities, state.ids) };
        }),

      deleteRfq: (id) =>
        set((state) => {
          const entities = { ...state.entities };
          delete entities[id];
          const ids = state.ids.filter((i) => i !== id);
          return { entities, ids, rfqs: deriveRfqs(entities, ids) };
        }),

      getRfqById: (id) => get().entities[id],

      getRfqsByProcurement: (procurementId) => {
        return Object.values(get().entities).filter(
          (rfq) => rfq.procurementId === procurementId,
        );
      },

      addQuote: (rfqId, quote) =>
        set((state) => {
          const existing = state.entities[rfqId];
          if (!existing) return state;
          const entities = {
            ...state.entities,
            [rfqId]: {
              ...existing,
              quotes: [...existing.quotes, quote],
              status: existing.status === 'draft' ? 'sent' : existing.status,
            },
          };
          return { entities, rfqs: deriveRfqs(entities, state.ids) };
        }),

      submitRfq: (id) =>
        set((state) => {
          const existing = state.entities[id];
          if (!existing) return state;
          const entities = {
            ...state.entities,
            [id]: {
              ...existing,
              status: 'sent' as const,
              sentAt: new Date().toISOString(),
            },
          };
          return { entities, rfqs: deriveRfqs(entities, state.ids) };
        }),

      selectQuote: (rfqId, quoteId) =>
        set((state) => {
          const existing = state.entities[rfqId];
          if (!existing) return state;
          const entities = {
            ...state.entities,
            [rfqId]: {
              ...existing,
              selectedQuoteId: quoteId,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              quotes: existing.quotes.map((q) => ({
                ...q,
                status: q.id === quoteId ? ('selected' as const) : ('rejected' as const),
              })),
            },
          };
          return { entities, rfqs: deriveRfqs(entities, state.ids) };
        }),
    }),
    {
      name: 'kinetic-rfqs',
      version: 1,
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);

export { generateRfqNumber };
