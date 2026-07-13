import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterDataService } from '@/services/master-data';

interface EntityRelationRecord {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
}

interface RelationState {
  /** prospectId → projectId (1-to-1) */
  prospectToProject: Record<string, string>;
  /** projectId → procurementId[] (1-to-N) */
  projectToProcurement: Record<string, string[]>;

  /** Local cache of all fetched relations for ID lookups */
  _relations: EntityRelationRecord[];

  // Actions
  linkProspectToProject: (prospectId: string, projectId: string) => void;
  unlinkProspectToProject: (prospectId: string) => void;
  linkProjectToProcurement: (projectId: string, procurementId: string) => void;
  unlinkProjectToProcurement: (projectId: string, procurementId: string) => void;
  removeAllProjectLinks: (projectId: string) => void;

  // Queries
  getProjectByProspect: (prospectId: string) => string | undefined;
  getProcurementsByProject: (projectId: string) => string[];
  getProspectByProject: (projectId: string) => string | undefined;

  fetchLinks: () => Promise<void>;
}

function findRelationId(relations: EntityRelationRecord[], sourceType: string, sourceId: string, targetType: string, targetId: string, relationType: string): string | undefined {
  return relations.find(
    (r) => r.sourceType === sourceType && r.sourceId === sourceId && r.targetType === targetType && r.targetId === targetId && r.relationType === relationType
  )?.id;
}

export const useRelationStore = create<RelationState>()(
  persist(
    (set, get) => ({
      prospectToProject: {},
      projectToProcurement: {},
      _relations: [],

      linkProspectToProject: async (prospectId, projectId) => {
        try {
          const res = await masterDataService.create('entityRelations', {
            sourceType: 'prospect',
            sourceId: prospectId,
            targetType: 'project',
            targetId: projectId,
            relationType: 'converted_to',
          } as any);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) {
            set((s) => ({ _relations: [...s._relations, created] }));
          }
        } catch (err) {
          console.error('[relationStore] linkProspectToProject API failed:', err);
        }
        set((s) => ({
          prospectToProject: { ...s.prospectToProject, [prospectId]: projectId },
        }));
      },

      unlinkProspectToProject: async (prospectId) => {
        try {
          const projectId = get().prospectToProject[prospectId];
          if (projectId) {
            const relId = findRelationId(get()._relations, 'prospect', prospectId, 'project', projectId, 'converted_to');
            if (relId) {
              await masterDataService.delete('entityRelations', relId);
            }
          }
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            console.error('[relationStore] unlinkProspectToProject API failed:', err);
          }
        }
        set((s) => {
          const next = { ...s.prospectToProject };
          delete next[prospectId];
          return { prospectToProject: next };
        });
      },

      linkProjectToProcurement: async (projectId, procurementId) => {
        try {
          const res = await masterDataService.create('entityRelations', {
            sourceType: 'project',
            sourceId: projectId,
            targetType: 'procurement',
            targetId: procurementId,
            relationType: 'has_procurement',
          } as any);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) {
            set((s) => ({ _relations: [...s._relations, created] }));
          }
        } catch (err) {
          console.error('[relationStore] linkProjectToProcurement API failed:', err);
        }
        set((s) => {
          const existing = s.projectToProcurement[projectId] || [];
          if (existing.includes(procurementId)) return s;
          return {
            projectToProcurement: {
              ...s.projectToProcurement,
              [projectId]: [...existing, procurementId],
            },
          };
        });
      },

      unlinkProjectToProcurement: async (projectId, procurementId) => {
        try {
          const relId = findRelationId(get()._relations, 'project', projectId, 'procurement', procurementId, 'has_procurement');
          if (relId) {
            await masterDataService.delete('entityRelations', relId);
          }
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            console.error('[relationStore] unlinkProjectToProcurement API failed:', err);
          }
        }
        set((s) => {
          const existing = s.projectToProcurement[projectId];
          if (!existing) return s;
          const next = existing.filter((id) => id !== procurementId);
          const map = { ...s.projectToProcurement };
          if (next.length === 0) {
            delete map[projectId];
          } else {
            map[projectId] = next;
          }
          return { projectToProcurement: map };
        });
      },

      removeAllProjectLinks: async (projectId) => {
        try {
          const prospectKey = Object.entries(get().prospectToProject).find(([, pid]) => pid === projectId)?.[0];
          if (prospectKey) {
            const relId = findRelationId(get()._relations, 'prospect', prospectKey, 'project', projectId, 'converted_to');
            if (relId) {
              await masterDataService.delete('entityRelations', relId);
            }
          }
          const procIds = get().projectToProcurement[projectId] || [];
          for (const procurementId of procIds) {
            const relId = findRelationId(get()._relations, 'project', projectId, 'procurement', procurementId, 'has_procurement');
            if (relId) {
              await masterDataService.delete('entityRelations', relId);
            }
          }
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            console.error('[relationStore] removeAllProjectLinks API failed:', err);
          }
        }
        set((s) => {
          const next = { ...s.projectToProcurement };
          delete next[projectId];
          const prospectKey = Object.entries(s.prospectToProject).find(
            ([, pid]) => pid === projectId,
          )?.[0];
          const p2p = { ...s.prospectToProject };
          if (prospectKey) delete p2p[prospectKey];
          return { projectToProcurement: next, prospectToProject: p2p };
        });
      },

      // Queries
      getProjectByProspect: (prospectId) => get().prospectToProject[prospectId],

      getProcurementsByProject: (projectId) => get().projectToProcurement[projectId] || [],

      getProspectByProject: (projectId) => {
        const entry = Object.entries(get().prospectToProject).find(
          ([, pid]) => pid === projectId,
        );
        return entry?.[0];
      },

      fetchLinks: async () => {
        try {
          const res = await masterDataService.get('entityRelations', { perPage: 500 } as any);
          const list = res.data?.data || res.data || [];
          const data = Array.isArray(list) ? list : [];
          const _relations: EntityRelationRecord[] = [];
          const p2p: Record<string, string> = {};
          const p2pr: Record<string, string[]> = {};
          for (const rel of data) {
            const r = rel as unknown as EntityRelationRecord;
            _relations.push(r);
            if (r.sourceType === 'prospect' && r.targetType === 'project' && r.relationType === 'converted_to') {
              p2p[r.sourceId] = r.targetId;
            }
            if (r.sourceType === 'project' && r.targetType === 'procurement' && r.relationType === 'has_procurement') {
              if (!p2pr[r.sourceId]) p2pr[r.sourceId] = [];
              if (!p2pr[r.sourceId].includes(r.targetId)) p2pr[r.sourceId].push(r.targetId);
            }
          }
          set({ prospectToProject: p2p, projectToProcurement: p2pr, _relations });
        } catch (err) {
          console.error('[relationStore] fetchLinks from API failed:', err);
        }
      },
    }),
    {
      name: 'kinetic-relations',
      version: 2,
      partialize: (state) => ({
        prospectToProject: state.prospectToProject,
        projectToProcurement: state.projectToProcurement,
        _relations: state._relations,
      }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return {
          prospectToProject: current.prospectToProject || {},
          projectToProcurement: current.projectToProcurement || {},
          _relations: current._relations || [],
        };
      },
    },
  ),
);
