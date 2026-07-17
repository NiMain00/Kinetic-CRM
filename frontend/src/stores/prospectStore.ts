import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect, TimelineEvent, DocGroup } from '@/types/domain';
import { prospectService } from '@/services/prospects';
import { eventBus } from '@/services/eventBridge';

interface ProspectState {
  /** Normalized entity map — O(1) lookup */
  entities: Record<string, Prospect>;
  /** Ordered IDs — preserves insertion order */
  ids: string[];
  /** Derived array — backward-compat selector */
  prospects: Prospect[];
  /** Loading flag */
  loading: boolean;

  fetchProspects: (params?: any) => Promise<void>;
  fetchProspect: (id: string) => Promise<Prospect | undefined>;
  addProspect: (p: Prospect) => void;
  createProspect: (data: Partial<Prospect>) => Promise<Prospect>;
  updateProspect: (id: string, data: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  getProspectById: (id: string) => Prospect | undefined;
  updateProspectStage: (id: string, stageId: string) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateDocuments: (id: string, documents: DocGroup[]) => void;
}

/** Build derived `prospects` array from entities + ids */
function deriveProspects(entities: Record<string, Prospect>, ids: string[]): Prospect[] {
  const arr: Prospect[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

/** Convert an array of Prospects into normalized shape */
function normalizeProspects(prospects: Prospect[]): {
  entities: Record<string, Prospect>;
  ids: string[];
} {
  const entities: Record<string, Prospect> = {};
  const ids: string[] = new Array(prospects.length);
  for (let i = 0; i < prospects.length; i++) {
    const p = prospects[i];
    entities[p.id] = p;
    ids[i] = p.id;
  }
  return { entities, ids };
}

/** Map UI status values to Prisma enum member names */
const STATUS_MAP: Record<string, string> = {
  'Lead': 'Lead',
  'Non Potensial': 'Non_Potensial',
  'Potensial': 'Potensial',
  'Waiting Supervisor': 'Waiting_Supervisor',
  'Revision': 'Revision',
  'Approved': 'Approved',
};
/** Reverse map Prisma enum → UI display value */
const STATUS_MAP_REV: Record<string, string> = {
  'Lead': 'Lead',
  'Non_Potensial': 'Non Potensial',
  'Potensial': 'Potensial',
  'Waiting_Supervisor': 'Waiting Supervisor',
  'Revision': 'Revision',
  'Approved': 'Approved',
};

/** Map API prospect to UI Prospect shape (add author/date from relations) */
function mapApiProspect(p: any): Prospect {
  const answers: Record<string, string> = {};
  if (Array.isArray(p.answers)) {
    for (const a of p.answers) {
      answers[a.questionId] = a.answerText || '';
    }
  } else if (p.answers && typeof p.answers === 'object') {
    Object.assign(answers, p.answers);
  }
  const projectId = p.convertedToProjectId || p.projectId;
  return {
    ...p,
    customerData: p.customer || p.customerData || undefined,
    isConverted: projectId != null,
    timeline: p.timeline || p.timelineEvents || [],
    projectId,
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : undefined,
    answers: Object.keys(answers).length > 0 ? answers : undefined,
    status: STATUS_MAP_REV[p.status] || p.status,
    author: p.author || p.ownerUser?.fullName || p.createdBy?.fullName || p.createdByUserId || '',
    date: p.date || p.createdAt || '',
  };
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      prospects: [],
      loading: false,

      fetchProspects: async (params) => {
        set({ loading: true });
        try {
          const res = await prospectService.list(params);
          const data = res.data.data || res.data;
          const list = Array.isArray(data) ? data : [];
          const mapped = list.map(mapApiProspect);
          const { entities, ids } = normalizeProspects(mapped);
          set({ entities, ids, prospects: deriveProspects(entities, ids), loading: false });
        } catch {
          set({ loading: false });
        }
      },

      fetchProspect: async (id) => {
        try {
          const res = await prospectService.get(id);
          const raw = res.data.data || res.data;
          const prospect = raw?.id ? mapApiProspect(raw) : raw;
          if (prospect?.id) {
            set((s) => {
              const entities = { ...s.entities, [prospect.id]: prospect };
              const ids = s.ids.includes(prospect.id) ? s.ids : [...s.ids, prospect.id];
              return { entities, ids, prospects: deriveProspects(entities, ids) };
            });
          }
          return prospect;
        } catch {
          return undefined;
        }
      },

      addProspect: (p) =>
        set((s) => {
          const entities = { ...s.entities, [p.id]: p };
          const ids = [...s.ids, p.id];
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }),

      createProspect: async (data) => {
        const { id, author, date, customerData, timeline, answers, ...clean } = data as any;
        if (clean.status) clean.status = STATUS_MAP[clean.status] || clean.status;
        if (timeline?.length) {
          clean.timelineEvents = {
            create: timeline.map((evt: any) => {
              const { id, prospectId, projectId, createdAt, ...rest } = evt;
              return {
                ...rest,
                time: evt.time ? new Date(evt.time).toISOString() : undefined,
              };
            }),
          };
        }
        if (answers && Object.keys(answers).length > 0) {
          clean.answers = {
            create: Object.entries(answers).map(([questionId, answerText]) => ({
              questionId,
              answerText: String(answerText),
            })),
          };
        }
        const res = await prospectService.create(clean);
        const prospect = mapApiProspect(res.data.data || res.data);
        // Preserve customerData from original payload — backend create response
        // doesn't include the full customer relation object.
        if (customerData && !prospect.customerData) {
          prospect.customerData = customerData;
        }
        set((s) => {
          const entities = { ...s.entities, [prospect.id]: prospect };
          const ids = [...s.ids, prospect.id];
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        });
        return prospect;
      },

      updateProspect: async (id, data) => {
        const { author, date, customerData, timeline, answers, ...clean } = data as any;
        if (clean.status) clean.status = STATUS_MAP[clean.status] || clean.status;
        if (timeline?.length) {
          clean.timelineEvents = {
            create: timeline.map((evt: any) => {
              const { id, prospectId, projectId, createdAt, ...rest } = evt;
              return {
                ...rest,
                time: evt.time ? new Date(evt.time).toISOString() : undefined,
              };
            }),
          };
        }
        if (answers && Object.keys(answers).length > 0) {
          clean.answers = {
            deleteMany: {},
            create: Object.entries(answers).map(([questionId, answerText]) => ({
              questionId,
              answerText: String(answerText),
            })),
          };
        }
        try {
          await prospectService.update(id, clean);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            console.warn(`[prospectStore] Prospect ${id} not found on backend, removing from local store`);
            set((s) => {
              const entities = { ...s.entities };
              delete entities[id];
              const ids = s.ids.filter((i) => i !== id);
              return { entities, ids, prospects: deriveProspects(entities, ids) };
            });
            return;
          }
          throw err;
        }
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const entities = { ...s.entities, [id]: { ...existing, ...data } };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        });
      },

      deleteProspect: async (id) => {
        try {
          await prospectService.delete(id);
        } catch (err: any) {
          if (err?.response?.status !== 404) throw err;
          console.warn(`[prospectStore] Prospect ${id} not found on backend, removing from local store anyway`);
        }
        const prospect = get().entities[id];
        if (prospect) {
          eventBus.emit({
            type: 'PROSPECT_DELETED',
            prospectId: id,
            cascadeProjectId: prospect.isConverted && prospect.projectId
              ? prospect.projectId
              : undefined,
            timestamp: new Date().toISOString(),
          });
        }
        set((s) => {
          const entities = { ...s.entities };
          delete entities[id];
          const ids = s.ids.filter((i) => i !== id);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        });
      },

      getProspectById: (id) => get().entities[id],

      updateProspectStage: async (id, stageId) => {
        try {
          await prospectService.update(id, { currentStageId: stageId } as any);
        } catch (err) {
          console.error('[prospectStore] updateProspectStage API failed:', err);
        }
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = { ...existing, currentStageId: stageId };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        });
      },

      addTimelineEvent: async (id, event) => {
        try {
          await prospectService.update(id, {
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
              },
            },
          } as any);
        } catch (err) {
          console.error('[prospectStore] addTimelineEvent API failed:', err);
        }
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = {
            ...existing,
            timeline: [...(existing.timeline || []), event],
          };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        });
      },

      updateDocuments: async (id, documents) => {
        try {
          await prospectService.update(id, { documents: JSON.stringify(documents) } as any);
        } catch (err) {
          console.error('[prospectStore] updateDocuments API failed:', err);
        }
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = { ...existing, documents };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        });
      },
    }),
    {
      name: 'kinetic-prospects',
      version: 9,
      merge: (persisted: unknown, current: ProspectState) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Partial<ProspectState>;
        if (p.entities && p.ids) {
          return {
            ...current,
            ...p,
            prospects: deriveProspects(p.entities, p.ids),
          };
        }
        return { ...current, ...p };
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (current.entities && current.ids) {
          return {
            ...current,
            prospects: deriveProspects(current.entities, current.ids),
          };
        }
        return current;
      },
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);
