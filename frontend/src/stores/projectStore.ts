import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';

interface ProjectState {
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
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
    }),
    { name: 'kinetic-projects' },
  ),
);
