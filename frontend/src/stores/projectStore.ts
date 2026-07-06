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
import { projectService } from '@/services/projects';
import { useApprovalStore } from './approvalStore';
import { useNotificationStore } from './notificationStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';

interface ProjectState {
  entities: Record<string, Project>;
  ids: string[];
  projects: Project[];
  loading: boolean;

  fetchProjects: (params?: any) => Promise<void>;
  fetchProject: (id: string) => Promise<Project | undefined>;
  addProject: (p: Project) => void;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
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
  updateProjectScope: (id: string, scopeDepartments: string[]) => void;
  updateProjectStage: (id: string, stageId: string) => void;
}

function deriveProjects(entities: Record<string, Project>, ids: string[]): Project[] {
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
  return { entities: next, projects: deriveProjects(next, ids) };
}

function mapApiProject(p: any): Project {
  return {
    ...p,
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : 0,
    author: p.author || p.ownerUser?.fullName || p.createdBy?.fullName || p.createdByUserId || '',
    date: p.date || p.createdAt || '',
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      entities: {},
      ids: [],
      projects: [],
      loading: false,

      fetchProjects: async (params) => {
        set({ loading: true });
        try {
          const res = await projectService.list(params);
          const data = res.data.data || res.data;
          const list = Array.isArray(data) ? data : [];
          const mapped = list.map(mapApiProject);
          const { entities, ids } = normalizeProjects(mapped);
          set({ entities, ids, projects: deriveProjects(entities, ids), loading: false });
        } catch {
          set({ loading: false });
        }
      },

      fetchProject: async (id) => {
        try {
          const res = await projectService.get(id);
          const project = res.data.data ? mapApiProject(res.data.data) : mapApiProject(res.data);
          if (project?.id) {
            set((s) => {
              const entities = { ...s.entities, [project.id]: project };
              const ids = s.ids.includes(project.id) ? s.ids : [...s.ids, project.id];
              return { entities, ids, projects: deriveProjects(entities, ids) };
            });
          }
          return project;
        } catch {
          set((s) => {
            if (!s.entities[id]) return s;
            const entities = { ...s.entities };
            delete entities[id];
            const ids = s.ids.filter((i) => i !== id);
            return { entities, ids, projects: deriveProjects(entities, ids) };
          });
          return undefined;
        }
      },

      addProject: (p) =>
        set((s) => {
          const entities = { ...s.entities, [p.id]: p };
          const ids = [...s.ids, p.id];
          return { entities, ids, projects: deriveProjects(entities, ids) };
        }),

      createProject: async (data) => {
        const { pricing, competitors, winnerDetails, delivery, rks, lphs, timeline, ...clean } = data as any;
        if (clean.scopeDepartments && Array.isArray(clean.scopeDepartments)) {
          clean.scopeDepartments = JSON.stringify(clean.scopeDepartments);
        }
        if (clean.deadlineTender === undefined || clean.deadlineTender === '') {
          delete clean.deadlineTender;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean.deadlineTender)) {
          clean.deadlineTender = clean.deadlineTender + 'T00:00:00.000Z';
        }
        if (clean.estimatedValue !== undefined) {
          clean.estimatedValue = Number(clean.estimatedValue);
        }
        const res = await projectService.create(clean);
        const project = mapApiProject(res.data.data || res.data);
        set((s) => {
          const entities = { ...s.entities, [project.id]: project };
          const ids = [...s.ids, project.id];
          return { entities, ids, projects: deriveProjects(entities, ids) };
        });
        return project;
      },

      updateProject: async (id, data) => {
        const { pricing, competitors, winnerDetails, delivery, rks, lphs, timeline, ...clean } = data as any;
        if (clean.scopeDepartments && Array.isArray(clean.scopeDepartments)) {
          clean.scopeDepartments = JSON.stringify(clean.scopeDepartments);
        }
        if (clean.deadlineTender === undefined || clean.deadlineTender === '') {
          delete clean.deadlineTender;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean.deadlineTender)) {
          clean.deadlineTender = clean.deadlineTender + 'T00:00:00.000Z';
        }
        await projectService.update(id, clean);
        const current = get().entities[id];
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }));
          return { ...r, ids: s.ids };
        });
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

      deleteProject: async (id) => {
        await projectService.delete(id);
        const approvalStore = useApprovalStore.getState();
        approvalStore.approvals
          .filter((a) => a.entityType === 'project' && a.entityId === id)
          .forEach((a) => approvalStore.removeApproval(a.id));
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
      version: 7,
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
        if (current.entities && current.ids) {
          return {
            ...current,
            projects: deriveProjects(current.entities, current.ids),
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
