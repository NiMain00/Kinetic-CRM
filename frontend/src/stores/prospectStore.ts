import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect, TimelineEvent, DocGroup } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
import { eventBus } from '@/services/eventBridge';

interface ProspectState {
  /** Normalized entity map — O(1) lookup */
  entities: Record<string, Prospect>;
  /** Ordered IDs — preserves insertion order */
  ids: string[];
  /** Derived array — backward-compat selector */
  prospects: Prospect[];

  addProspect: (p: Prospect) => void;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
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

// ─── Initial state (first-load fallback) ───────────────────────────────
const { entities: INITIAL_ENTITIES, ids: INITIAL_IDS } = normalizeProspects(INITIAL_PROSPECTS);

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      entities: INITIAL_ENTITIES,
      ids: INITIAL_IDS,
      prospects: deriveProspects(INITIAL_ENTITIES, INITIAL_IDS),

      addProspect: (p) =>
        set((s) => {
          const entities = { ...s.entities, [p.id]: p };
          const ids = [...s.ids, p.id];
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }),

      updateProspect: (id, data) =>
        set((s) => {
          const existing = s.entities[id];
          if (!existing) return s;
          const entities = { ...s.entities, [id]: { ...existing, ...data } };
          return { entities, prospects: deriveProspects(entities, s.ids) };
        }),

      deleteProspect: (id) => {
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
      version: 7,
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
        // v1→v2, v2→v3: original migrations
        if (version < 2) {
          const { entities, ids } = normalizeProspects(INITIAL_PROSPECTS);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }

        let rawProspects = current.prospects || INITIAL_PROSPECTS;

        if (version < 3) {
          rawProspects = rawProspects.map((p: any) => ({
            ...p,
            currentStageId: p.currentStageId || 'stage-prospecting',
            departmentId: p.departmentId || 'dept-marketing',
            ownerUserId: p.ownerUserId || p.createdByUserId || '',
          }));
        }

        // v3→v4: normalize to Record pattern
        if (version < 4) {
          const { entities, ids } = normalizeProspects(rawProspects);
          return { entities, ids, prospects: deriveProspects(entities, ids) };
        }

        // v4→v5: add timeline and documents fields
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
          return {
            entities: updatedEntities,
            ids,
            prospects: deriveProspects(updatedEntities, ids),
          };
        }

        // v6→v7: rename 'Waiting PM' / 'Supervisor' → 'Waiting Supervisor'
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
          return {
            entities: updatedEntities,
            ids,
            prospects: deriveProspects(updatedEntities, ids),
          };
        }

        // version >= 7 — ensure derived prospects exists (safety for direct-persist loads)
        if (!current.prospects && current.entities && current.ids) {
          return {
            ...current,
            prospects: deriveProspects(current.entities, current.ids),
          };
        }

        return current;
      },
      // Only persist entities + ids; prospects is derived on hydrate
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);
