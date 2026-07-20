import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Procurement, ProcurementStatus } from '@/types/domain/procurement';
import type { TimelineEvent, DocGroup } from '@/types/domain';
import { generateProcurementCode } from '@/types/domain/procurement';
import { masterDataService } from '@/services/master-data';
import { useRelationStore } from '@/stores/relationStore';
import { eventBus } from '@/services/eventBridge';

interface ProcurementState {
  /** Normalized entity map */
  entities: Record<string, Procurement>;
  /** Ordered IDs */
  ids: string[];
  /** Derived array — backward-compat selector */
  procurements: Procurement[];
  /** Loading flag for fetch from DB */
  loading: boolean;

  fetchProcurements: () => Promise<void>;
  addProcurement: (
    data: Omit<Procurement, 'id' | 'code' | 'createdAt' | 'progress' | 'status' | 'phase'> & {
      status?: ProcurementStatus;
      phase?: string;
    }
  ) => Promise<Procurement>;
  updateProcurement: (id: string, data: Partial<Procurement>) => Promise<void>;
  deleteProcurement: (id: string) => Promise<void>;
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

// ─── Helpers: transient fields (ada di frontend saja, tidak di DB) ──────
const TRANSIENT_FIELDS = new Set(['id', 'sourceProjectCode', 'sourceProjectName', 'timeline', 'documents']);

// Konversi status dari frontend type ke Prisma enum
function toPrismaStatus(s: string): string {
  if (s === 'Vendor Selection') return 'Vendor_Selection';
  return s;
}

// Convert date-only strings ("YYYY-MM-DD") to ISO-8601 DateTime ("YYYY-MM-DDT00:00:00.000Z")
// Convert empty strings to undefined so JSON.stringify strips them (Prisma rejects "" for DateTime)
function toISO(value: unknown): unknown {
  if (value === '') return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
}

function stripTransientFields<I extends Record<string, unknown>>(obj: I): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (!TRANSIENT_FIELDS.has(key)) result[key] = toISO(obj[key]);
  }
  if (result.status) result.status = toPrismaStatus(result.status as string);
  if (result.phase) result.phase = toPrismaStatus(result.phase as string);
  return result;
}

// ─── Store ──────────────────────────────────────────────────────────────

// Konversi status dari Prisma enum ke frontend type
function mapPrismaStatus(s: string): string {
  if (s === 'Purchase_Request') return 'Vendor Selection';
  if (s === 'Vendor_Selection') return 'Vendor Selection';
  if (s === 'PO_Process') return 'Delivery';
  return s || 'Draft';
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      procurements: [],
      loading: false,

      fetchProcurements: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('procurements', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          const mapped = list.map((item: any) => {
            const status = mapPrismaStatus(item.status) as ProcurementStatus;
            return {
              id: item.id,
              timeline: item.timelineEvents?.map((e: any) => ({
                id: e.id,
                title: e.title,
                actor: e.actor,
                role: e.role,
                time: e.time,
                type: e.type,
                description: e.description,
                prevVal: e.prevVal,
                newVal: e.newVal,
                fileName: e.fileName,
                fileSize: e.fileSize,
              })) || [],
              code: item.code,
              sourceProjectId: item.sourceProjectId || undefined,
              client: item.client,
              contractValue: Number(item.contractValue) || 0,
              location: item.location || '',
              status,
              phase: item.phase || status,
              progress: item.progress || 0,
              createdAt: item.createdAt || new Date().toISOString(),
              createdBy: item.createdBy || '',
              createdByUserId: item.createdByUserId || undefined,
              updatedAt: item.updatedAt,
              prNumber: item.prNumber || undefined,
              prDate: item.prDate || undefined,
              prNotes: item.prNotes || undefined,
              poNumber: item.poNumber || undefined,
              poDate: item.poDate || undefined,
              poValue: item.poValue ? Number(item.poValue) : undefined,
              poNotes: item.poNotes || undefined,
              selectedVendor: item.selectedVendor || undefined,
              vendorPic: item.vendorPic || undefined,
              vendorContact: item.vendorContact || undefined,
              targetStartDate: item.targetStartDate || undefined,
              targetEndDate: item.targetEndDate || undefined,
              unitReadyDate: item.unitReadyDate || undefined,
              unitShippedDate: item.unitShippedDate || undefined,
              unitReceivedDate: item.unitReceivedDate || undefined,
              actualEndDate: item.actualEndDate || undefined,
              deliveryNote: item.deliveryNote || undefined,
              isDelivered: item.isDelivered || false,
              deliveredAt: item.deliveredAt || undefined,
              deliveredBy: item.deliveredBy || undefined,
              progressNotes: item.progressNotes || undefined,
              isClosed: item.isClosed || false,
              closedAt: item.closedAt || undefined,
              closedBy: item.closedBy || undefined,
            };
          });
          const { entities, ids } = normalizeProcurements(mapped);
          set({ entities, ids, procurements: deriveProcurements(entities, ids), loading: false });
        } catch (e) {
          console.error('[procurementStore] fetchProcurements failed:', e);
          set({ loading: false });
        }
      },

      addProcurement: async (data) => {
        const state = get();
        const index = state.ids.length;
        const now = new Date().toISOString();
        const tempId = `PRC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newProc: Procurement = {
          id: tempId,
          code: generateProcurementCode(index),
          status: data.status || 'Draft',
          phase: data.phase || 'Draft',
          progress: 0,
          createdAt: now,
          timeline: [],
          documents: [],
          ...data,
        };
        // Simpan ke DB dulu
        try {
          const payload = stripTransientFields(newProc as any);
          const res = await masterDataService.create('procurements', payload);
          const saved = (res.data as any)?.data || res.data;
          if ((saved as any)?.id) {
            newProc.id = (saved as any).id;
          }
        } catch (e: any) {
          console.error('[procurementStore] addProcurement API failed');
          if (e.response) {
            console.error('  Status:', e.response.status);
            console.error('  Data:', JSON.stringify(e.response.data, null, 2));
          } else if (e.request) {
            console.error('  No response received:', e.message);
          } else {
            console.error('  Error:', e.message);
          }
        }
        set((s) => {
          const entities = { ...s.entities, [newProc.id]: newProc };
          const ids = [...s.ids, newProc.id];
          return { entities, ids, procurements: deriveProcurements(entities, ids) };
        });
        return newProc;
      },

      updateProcurement: async (id, data) => {
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }));
          return { ...r, ids: s.ids };
        });
        try {
          await masterDataService.update('procurements', id, stripTransientFields(data as any));
        } catch (e) {
          console.error('[procurementStore] updateProcurement API failed:', e);
        }
      },

      deleteProcurement: async (id) => {
        const proc = get().entities[id];
        set((s) => {
          const entities = { ...s.entities };
          delete entities[id];
          const ids = s.ids.filter((i) => i !== id);
          return { entities, ids, procurements: deriveProcurements(entities, ids) };
        });
        try {
          await masterDataService.delete('procurements', id);
        } catch (e) {
          console.error('[procurementStore] deleteProcurement API failed:', e);
        }
        if (proc?.sourceProjectId) {
          useRelationStore.getState().unlinkProjectToProcurement(proc.sourceProjectId, id);
        }
        eventBus.emit({
          type: 'PROCUREMENT_DELETED',
          procurementId: id,
          projectId: proc?.sourceProjectId,
          timestamp: new Date().toISOString(),
        });
      },

      getProcurementById: (id) => get().entities[id],

      addTimelineEvent: (id, event) => {
        // Persist ke backend
        masterDataService.update('procurements', id, {
          timelineEvents: {
            create: {
              title: event.title,
              actor: event.actor,
              role: event.role || null,
              time: event.time ? new Date(event.time).toISOString() : new Date().toISOString(),
              type: event.type,
              description: event.description || null,
              prevVal: event.prevVal || null,
              newVal: event.newVal || null,
              fileName: event.fileName || null,
              fileSize: event.fileSize || null,
            },
          },
        } as any).catch((err) => console.error('[timeline-persist] Gagal menyimpan event pengadaan:', err));
        // Update lokal
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({
            ...e,
            timeline: [...(e.timeline || []), event],
          }));
          return { ...r, ids: s.ids };
        });
      },
      updateDocuments: (id, docs) =>
        set((s) => {
          const r = updateOne(s.entities, s.ids, id, (e) => ({ ...e, documents: docs }));
          return { ...r, ids: s.ids };
        }),
    }),
    {
      name: 'kinetic-procurement',
      version: 4,
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

        // v2→v3: hapus event yg ter-clone dari proyek (RKS, LPHS, Harga, Kompetitor, dll.)
        // tapi pertahankan event yg murni pengadaan (Pengadaan Dibuat, dll.)
        if (version < 3 && current.entities) {
          const projectKeywords = ['RKS', 'LPHS', 'SIOS', 'Harga', 'Kompetitor', 'Peserta', 'Menang', 'Kalah', 'Proyek', 'Review RKS', 'Customer Diverifikasi'];
          const entities = { ...current.entities };
          for (const key of Object.keys(entities)) {
            const old = entities[key];
            if (!old.timeline?.length) continue;
            const filtered = old.timeline.filter(
              (evt: any) => !projectKeywords.some((kw) => (evt.title || '').toLowerCase().includes(kw.toLowerCase()))
            );
            entities[key] = { ...old, timeline: filtered.length > 0 ? filtered : [] };
          }
          return { ...current, entities, procurements: entities ? deriveProcurements(entities, current.ids || []) : [] };
        }

        // v3→v4: konversi status lama yang sudah dihapus
        if (version < 4 && current.entities) {
          const entities = { ...current.entities };
          for (const key of Object.keys(entities)) {
            const old = entities[key];
            let newStatus = old.status;
            let newPhase = old.phase;
            if (old.status === 'Purchase Request') {
              newStatus = 'Vendor Selection';
              newPhase = 'Vendor Selection';
            } else if (old.status === 'PO Process') {
              newStatus = 'Delivery';
              newPhase = 'Delivery';
            }
            entities[key] = { ...old, status: newStatus, phase: newPhase };
          }
          return { ...current, entities, procurements: entities ? deriveProcurements(entities, current.ids || []) : [] };
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
