import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  RksData,
  LphsChecklistItem,
  CompetitorEntry,
  MilestoneEntry,
  DocGroup,
  TimelineEvent,
} from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';

interface ProjectState {
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  // Tab-specific actions
  updateProjectRks: (id: string, rks: RksData) => void;
  updateProjectLphs: (id: string, checklist: LphsChecklistItem[]) => void;
  updateProjectPricing: (id: string, pricing: Partial<Project['pricing']>) => void;
  updateProjectCompetitors: (id: string, competitors: CompetitorEntry[]) => void;
  addProjectCompetitor: (id: string, competitor: CompetitorEntry) => void;
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
      updateProject: (id, data) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      getProjectById: (id) => get().projects.find((p) => p.id === id),

      updateProjectRks: (id, rks) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, rks } : p)),
        })),
      updateProjectLphs: (id, lphsChecklist) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, lphsChecklist } : p)),
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
    { name: 'kinetic-projects' },
  ),
);
