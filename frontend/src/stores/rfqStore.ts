import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rfq, RfqQuote } from '@/types/domain/procurement';
import { masterDataService } from '@/services/master-data';

interface RfqState {
  entities: Record<string, Rfq>;
  ids: string[];
  rfqs: Rfq[];
  loading: boolean;

  addRfq: (rfq: Rfq) => void;
  updateRfq: (id: string, data: Partial<Rfq>) => void;
  deleteRfq: (id: string) => void;
  getRfqById: (id: string) => Rfq | undefined;
  getRfqsByProcurement: (procurementId: string) => Rfq[];
  addQuote: (rfqId: string, quote: RfqQuote) => void;
  submitRfq: (id: string) => void;
  selectQuote: (rfqId: string, quoteId: string) => void;
  fetchRfqs: () => Promise<void>;
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
      loading: false,

      addRfq: (rfq) => {
        masterDataService.create('rfqs', rfq as any).catch(() => {});
        set((state) => {
          const entities = { ...state.entities, [rfq.id]: rfq };
          const ids = [...state.ids, rfq.id];
          return { entities, ids, rfqs: deriveRfqs(entities, ids) };
        });
      },

      updateRfq: (id, data) => {
        masterDataService.update('rfqs', id, data as any).catch(() => {});
        set((state) => {
          const existing = state.entities[id];
          if (!existing) return state;
          const entities = { ...state.entities, [id]: { ...existing, ...data } };
          return { entities, rfqs: deriveRfqs(entities, state.ids) };
        });
      },

      deleteRfq: (id) => {
        masterDataService.delete('rfqs', id).catch(() => {});
        set((state) => {
          const entities = { ...state.entities };
          delete entities[id];
          const ids = state.ids.filter((i) => i !== id);
          return { entities, ids, rfqs: deriveRfqs(entities, ids) };
        });
      },

      fetchRfqs: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('rfqs', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          const entities: Record<string, Rfq> = {};
          const ids: string[] = [];
          for (const item of list) {
            const rfq = item as unknown as Rfq;
            entities[rfq.id] = rfq;
            ids.push(rfq.id);
          }
          set({ entities, ids, rfqs: deriveRfqs(entities, ids), loading: false });
        } catch {
          set({ loading: false });
        }
      },

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
