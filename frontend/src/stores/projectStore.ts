import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  RksData,
  LphsData,
  LphsDepartmentApproval,
  CompetitorEntry,
  DocGroup,
  TimelineEvent,
} from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
// NOTE: Cross-store coupling via getState() — consider refactoring to event pattern
import { useApprovalStore } from './approvalStore';
import { useNotificationStore } from './notificationStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';

interface ProjectState {
  /** Normalized entity map — O(1) lookup */
  entities: Record<string, Project>;
  /** Ordered IDs — preserves insertion order */
  ids: string[];
  /** Derived array — backward-compat selector */
  projects: Project[];

  addProject: (p: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  // Tab-specific actions
  updateProjectRks: (id: string, rks: RksData) => void;
  updateProjectLphs: (id: string, lphs: LphsData) => void;
  updateLphsDepartmentApproval: (id: string, approval: LphsDepartmentApproval) => void;
  updateLphsStatus: (id: string, status: Partial<Pick<LphsData, 'pmStatus' | 'mgmtStatus' | 'overallStatus'>>) => void;
  updateProjectPricing: (id: string, pricing: Partial<Project['pricing']>) => void;
  updateProjectCompetitors: (id: string, competitors: CompetitorEntry[]) => void;
  addProjectCompetitor: (id: string, competitor: CompetitorEntry) => void;
  removeProjectCompetitor: (id: string, competitorId: string) => void;
  updateProjectWinner: (id: string, winnerDetails: Partial<Project['winnerDetails']>) => void;
  updateProjectDelivery: (id: string, delivery: Partial<Project['delivery']>) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateProjectDocuments: (id: string, documents: DocGroup[]) => void;

  // RBAC: scope & stage management
  updateProjectScope: (id: string, scopeDepartments: string[]) => void;
  updateProjectStage: (id: string, stageId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function deriveProjects(
  entities: Record<string, Project>,
  ids: string[],
): Project[] {
  const arr: Project[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

function normalizeProjects(projects: Project[]): {
  entities: Record<string, Project>;
  ids: string[];
} {
  const entities: Record<string, Project> = {};
  const ids: string[] = new Array(projects.length);
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    entities[p.id] = p;
    ids[i] = p.id;
  }
  return { entities, ids };
}

function updateEntity(
  entities: Record<string, Project>,
  ids: string[],
  id: string,
  updater: (e: Project) => Project,
): { entities: Record<string, Project>; projects: Project[] } {
  const existing = entities[id];
  if (!existing) {
    return { entities, projects: deriveProjects(entities, ids) };
  }
  const next = { ...entities, [id]: updater(existing) };
  return {
    entities: next,
    projects: deriveProjects(next, ids),
  };
}

// ─── Initial state (first-load fallback) ───────────────────────────────
const { entities: INITIAL_ENTITIES, ids: INITIAL_IDS } = normalizeProjects(INITIAL_PROJECTS);

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      entities: INITIAL_ENTITIES,
      ids: INITIAL_IDS,
      projects: deriveProjects(INITIAL_ENTITIES, INITIAL_IDS),

      addProject: (p) =>
        set((s) => {
          const entities = { ...s.entities, [p.id]: p };
          const ids = [...s.ids, p.id];
          return { entities, ids, projects: deriveProjects(entities, ids) };
        }),

      updateProject: (id, data) => {
        const current = get().entities[id];
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }));
          return { ...r, ids: s.ids };
        });
        // Add notification if status changed
        if (data.status && current && current.status !== data.status) {
          const addNotification = useNotificationStore.getState().addNotification;
          addNotification({
            title: 'Status Proyek Berubah',
            message: `Proyek "${current.name}" berubah status dari "${current.status}" menjadi "${data.status}".`,
            type: 'status_change',
            entityId: id,
            entityType: 'project',
          });
        }
      },

      deleteProject: (id) => {
        // Hapus juga approval terkait
        const approvalStore = useApprovalStore.getState();
        approvalStore.approvals
          .filter((a) => a.entityType === 'project' && a.entityId === id)
          .forEach((a) => approvalStore.removeApproval(a.id));
        // Hapus juga procurement terkait
        const deleteProc = useProcurementStore.getState().deleteProcurement;
        const linked = useProcurementStore.getState().procurements.filter((p) => p.sourceProjectId === id);
        linked.forEach((p) => deleteProc(p.id));
        set((s) => {
          const entities = { ...s.entities };
          delete entities[id];
          const ids = s.ids.filter((i) => i !== id);
          return { entities, ids, projects: deriveProjects(entities, ids) };
        });
      },

      getProjectById: (id) => get().entities[id],

      updateProjectRks: (id, rks) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, rks }));
          return { ...r, ids: s.ids };
        }),
      updateProjectLphs: (id, lphs) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, lphs }));
          return { ...r, ids: s.ids };
        }),
      updateLphsDepartmentApproval: (id, approval) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => {
            if (!e.lphs) return e;
            const existing = e.lphs.departmentApprovals.findIndex(
              (a) => a.departmentId === approval.departmentId,
            );
            const newApprovals =
              existing >= 0
                ? e.lphs.departmentApprovals.map((a, i) => (i === existing ? approval : a))
                : [...e.lphs.departmentApprovals, approval];
            return { ...e, lphs: { ...e.lphs, departmentApprovals: newApprovals } };
          });
          return { ...r, ids: s.ids };
        }),
      updateLphsStatus: (id, status) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => {
            if (!e.lphs) return e;
            return { ...e, lphs: { ...e.lphs, ...status } };
          });
          return { ...r, ids: s.ids };
        }),
      updateProjectPricing: (id, pricing) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            pricing: { ...e.pricing, ...pricing } as Project['pricing'],
          }));
          return { ...r, ids: s.ids };
        }),
      updateProjectCompetitors: (id, competitors) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, competitors }));
          return { ...r, ids: s.ids };
        }),
      addProjectCompetitor: (id, competitor) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            competitors: [...(e.competitors || []), competitor],
          }));
          return { ...r, ids: s.ids };
        }),
      removeProjectCompetitor: (id, competitorId) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            competitors: (e.competitors || []).filter((c) => c.id !== competitorId),
          }));
          return { ...r, ids: s.ids };
        }),
      updateProjectWinner: (id, winnerDetails) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            winnerDetails: { ...e.winnerDetails, ...winnerDetails } as Project['winnerDetails'],
          }));
          return { ...r, ids: s.ids };
        }),
      updateProjectDelivery: (id, delivery) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            delivery: { ...e.delivery, ...delivery } as Project['delivery'],
          }));
          return { ...r, ids: s.ids };
        }),
      addTimelineEvent: (id, event) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            timeline: [...(e.timeline || []), event],
          }));
          return { ...r, ids: s.ids };
        }),
      updateProjectDocuments: (id, documents) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, documents }));
          return { ...r, ids: s.ids };
        }),
      updateProjectScope: (id, scopeDepartments) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, scopeDepartments }));
          return { ...r, ids: s.ids };
        }),
      updateProjectStage: (id, stageId) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, currentStageId: stageId }));
          return { ...r, ids: s.ids };
        }),
    }),
    {
      name: 'kinetic-projects',
      version: 5,
      merge: (persisted: unknown, current: ProjectState) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Partial<ProjectState>;
        if (p.entities && p.ids) {
          return {
            ...current,
            ...p,
            projects: deriveProjects(p.entities, p.ids),
          };
        }
        return { ...current, ...p };
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;

        // v4→v5: normalize to Record pattern
        if (version < 5) {
          // v3: Force re-init with fresh mock data that includes createdByUserId
          // v4: Add RBAC fields (scopeDepartments, currentStageId, departmentId) with defaults
          const raw = current.projects || INITIAL_PROJECTS;
          const withDefaults = raw.map((p: any) => ({
            ...p,
            scopeDepartments: p.scopeDepartments || [],
            currentStageId: p.currentStageId || 'stage-in-project',
            departmentId: p.departmentId || 'dept-pm',
            createdByUserId: p.createdByUserId || p.createdBy || '',
          }));
          const { entities, ids } = normalizeProjects(withDefaults);
          return { entities, ids, projects: deriveProjects(entities, ids) };
        }

        // Ensure derived `projects` for loads from direct persist
        if (!current.projects && current.entities && current.ids) {
          return {
            ...current,
            projects: deriveProjects(current.entities, current.ids),
          };
        }

        return current;
      },
      // Only persist entities + ids; projects is derived on hydrate
      partialize: (state) => ({
        entities: state.entities,
        ids: state.ids,
      }),
    },
  ),
);
