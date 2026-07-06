import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect, TimelineEvent, DocGroup } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
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

const { entities: INITIAL_ENTITIES, ids: INITIAL_IDS } = normalizeProspects(INITIAL_PROSPECTS);

/** Map API prospect to UI Prospect shape (add author/date from relations) */
function mapApiProspect(p: any): Prospect {
  return {
    ...p,
    author: p.author || p.ownerUser?.fullName || p.createdBy?.fullName || p.createdByUserId || '',
    date: p.date || p.createdAt || '',
  };
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      entities: INITIAL_ENTITIES,
      ids: INITIAL_IDS,
      prospects: deriveProspects(INITIAL_ENTITIES, INITIAL_IDS),
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
        const res = await prospectService.create(data);
        const prospect = mapApiProspect(res.data.data || res.data);
        set((s) => {
          const entities = { ...s.entities, [prospect.id]: prospect };
          const ids = [...s.ids, prospect.id];
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        });
        return prospect;
      },

      updateProspect: async (id, data) => {
        await prospectService.update(id, data);
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const entities = { ...s.entities, [id]: { ...existing, ...data } };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        });
      },

      deleteProspect: async (id) => {
        await prospectService.delete(id);
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

      updateProspectStage: (id, stageId) =>
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = { ...existing, currentStageId: stageId };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        }),

      addTimelineEvent: (id, event) =>
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = {
            ...existing,
            timeline: [...(existing.timeline || []), event],
          };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        }),

      updateDocuments: (id, documents) =>
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const updated = { ...existing, documents };
          const entities = { ...s.entities, [id]: updated };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        }),
    }),
    {
      name: 'kinetic-prospects',
      version: 8,
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
        if (version < 2) {
          const { entities, ids } = normalizeProspects(INITIAL_PROSPECTS);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }
        if (version < 3) {
          const rawProspects = current.prospects || INITIAL_PROSPECTS;
          const migrated = rawProspects.map((p: any) => ({
            ...p,
            currentStageId: p.currentStageId || 'stage-prospecting',
            departmentId: p.departmentId || 'dept-marketing',
            ownerUserId: p.ownerUserId || p.createdByUserId || '',
          }));
          const { entities, ids } = normalizeProspects(migrated);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }
        if (version < 4) {
          const rawProspects = current.prospects || INITIAL_PROSPECTS;
          const { entities, ids } = normalizeProspects(rawProspects);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }
        if (version < 5) {
          const entities = current.entities || {};
          const updatedEntities: Record<string, Prospect> = {};
          for (const key of Object.keys(entities)) {
            updatedEntities[key] = {
              ...entities[key],
              timeline: entities[key].timeline || [],
              documents: entities[key].documents || [],
            };
          }
          const ids = current.ids || Object.keys(updatedEntities);
          return { entities: updatedEntities, ids, prospects: deriveProspects(updatedEntities, ids) };
        }
        if (version < 7) {
          const entities = current.entities || {};
          const updatedEntities: Record<string, Prospect> = {};
          for (const key of Object.keys(entities)) {
            const e = entities[key];
            updatedEntities[key] = {
              ...e,
              status: e.status === 'Waiting PM' || e.status === 'Supervisor' ? 'Waiting Supervisor' : e.status,
            };
          }
          const ids = current.ids || Object.keys(updatedEntities);
          return { entities: updatedEntities, ids, prospects: deriveProspects(updatedEntities, ids) };
        }
        if (!current.prospects && current.entities && current.ids) {
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
