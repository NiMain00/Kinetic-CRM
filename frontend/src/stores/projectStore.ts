import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  RksData,
  LphsData,
  LphsDepartmentApproval,
  CompetitorEntry,
  MilestoneEntry,
  DocGroup,
  TimelineEvent,
} from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
// NOTE: Cross-store coupling via getState() — consider refactoring to event pattern
import { useApprovalStore } from './approvalStore';
import { useNotificationStore } from './notificationStore';

interface ProjectState {
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
  addProjectMilestone: (id: string, milestone: MilestoneEntry) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateProjectDocuments: (id: string, documents: DocGroup[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),
      updateProject: (id, data) => {
        const current = get().projects.find((p) => p.id === id);
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
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
        return set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      },
      getProjectById: (id) => get().projects.find((p) => p.id === id),

      updateProjectRks: (id, rks) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, rks } : p)),
        })),
      updateProjectLphs: (id, lphs) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, lphs } : p)),
        })),
      updateLphsDepartmentApproval: (id, approval) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id || !p.lphs) return p;
            const existing = p.lphs.departmentApprovals.findIndex(a => a.departmentId === approval.departmentId);
            const newApprovals = existing >= 0
              ? p.lphs.departmentApprovals.map((a, i) => i === existing ? approval : a)
              : [...p.lphs.departmentApprovals, approval];
            return { ...p, lphs: { ...p.lphs, departmentApprovals: newApprovals } };
          }),
        })),
      updateLphsStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id || !p.lphs) return p;
            return { ...p, lphs: { ...p.lphs, ...status } };
          }),
        })),
      updateProjectPricing: (id, pricing) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, pricing: { ...p.pricing, ...pricing } as Project['pricing'] } : p,
          ),
        })),
      updateProjectCompetitors: (id, competitors) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, competitors } : p)),
        })),
      addProjectCompetitor: (id, competitor) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, competitors: [...(p.competitors || []), competitor] }
              : p,
          ),
        })),
      removeProjectCompetitor: (id, competitorId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, competitors: (p.competitors || []).filter((c) => c.id !== competitorId) }
              : p,
          ),
        })),
      updateProjectWinner: (id, winnerDetails) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, winnerDetails: { ...p.winnerDetails, ...winnerDetails } as Project['winnerDetails'] }
              : p,
          ),
        })),
      updateProjectDelivery: (id, delivery) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, delivery: { ...p.delivery, ...delivery } as Project['delivery'] }
              : p,
          ),
        })),
      addProjectMilestone: (id, milestone) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  delivery: {
                    ...p.delivery,
                    milestones: [...(p.delivery?.milestones || []), milestone],
                  } as Project['delivery'],
                }
              : p,
          ),
        })),
      addTimelineEvent: (id, event) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, timeline: [...(p.timeline || []), event] }
              : p,
          ),
        })),
      updateProjectDocuments: (id, documents) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, documents } : p)),
        })),
    }),
    {
      name: 'kinetic-projects',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 3) {
          // v3: Force re-init with fresh mock data that includes createdByUserId
          return { ...current, projects: INITIAL_PROJECTS } as ProjectState;
        }
        return current as ProjectState;
      },
    },
  ),
);
