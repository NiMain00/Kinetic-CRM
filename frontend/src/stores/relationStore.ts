import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RelationState {
  /** prospectId → projectId (1-to-1) */
  prospectToProject: Record<string, string>;
  /** projectId → procurementId[] (1-to-N) */
  projectToProcurement: Record<string, string[]>;

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
}

export const useRelationStore = create<RelationState>()(
  persist(
    (set, get) => ({
      prospectToProject: {},
      projectToProcurement: {},

      linkProspectToProject: (prospectId, projectId) =>
        set((s) => ({
          prospectToProject: { ...s.prospectToProject, [prospectId]: projectId },
        })),

      unlinkProspectToProject: (prospectId) =>
        set((s) => {
          const next = { ...s.prospectToProject };
          delete next[prospectId];
          return { prospectToProject: next };
        }),

      linkProjectToProcurement: (projectId, procurementId) =>
        set((s) => {
          const existing = s.projectToProcurement[projectId] || [];
          if (existing.includes(procurementId)) return s;
          return {
            projectToProcurement: {
              ...s.projectToProcurement,
              [projectId]: [...existing, procurementId],
            },
          };
        }),

      unlinkProjectToProcurement: (projectId, procurementId) =>
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
        }),

      removeAllProjectLinks: (projectId) =>
        set((s) => {
          const next = { ...s.projectToProcurement };
          delete next[projectId];
          // Also clean up reverse prospect link if any
          const prospectKey = Object.entries(s.prospectToProject).find(
            ([, pid]) => pid === projectId,
          )?.[0];
          const p2p = { ...s.prospectToProject };
          if (prospectKey) delete p2p[prospectKey];
          return { projectToProcurement: next, prospectToProject: p2p };
        }),

      // Queries
      getProjectByProspect: (prospectId) => get().prospectToProject[prospectId],

      getProcurementsByProject: (projectId) => get().projectToProcurement[projectId] || [],

      getProspectByProject: (projectId) => {
        const entry = Object.entries(get().prospectToProject).find(
          ([, pid]) => pid === projectId,
        );
        return entry?.[0];
      },
    }),
    {
      name: 'kinetic-relations',
      version: 1,
    },
  ),
);
