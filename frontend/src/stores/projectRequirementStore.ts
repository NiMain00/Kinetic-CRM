import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectRequirementItem } from '@/types/domain/item';

interface ProjectRequirementState {
  requirements: ProjectRequirementItem[];
  setRequirements: (projectId: string, items: ProjectRequirementItem[]) => void;
  addRequirement: (item: ProjectRequirementItem) => void;
  updateRequirement: (id: string, data: Partial<ProjectRequirementItem>) => void;
  removeRequirement: (id: string) => void;
  getByProjectId: (projectId: string) => ProjectRequirementItem[];
  incrementProcured: (id: string, qty: number) => void;
  incrementUsed: (id: string, qty: number) => void;
}

export const useProjectRequirementStore = create<ProjectRequirementState>()(
  persist(
    (set, get) => ({
      requirements: [],

      setRequirements: (projectId, items) =>
        set((s) => ({
          requirements: [
            ...s.requirements.filter((r) => r.projectId !== projectId),
            ...items.map((r) => ({ ...r, projectId })),
          ],
        })),

      addRequirement: (item) =>
        set((s) => ({ requirements: [...s.requirements, item] })),

      updateRequirement: (id, data) =>
        set((s) => ({
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, ...data } : r,
          ),
        })),

      removeRequirement: (id) =>
        set((s) => ({
          requirements: s.requirements.filter((r) => r.id !== id),
        })),

      getByProjectId: (projectId) =>
        get().requirements.filter((r) => r.projectId === projectId),

      incrementProcured: (id, qty) =>
        set((s) => ({
          requirements: s.requirements.map((r) => {
            if (r.id !== id) return r;
            const newProcured = r.quantityProcured + qty;
            const newStatus =
              newProcured >= r.quantityRequired
                ? 'fully_submitted'
                : newProcured > 0
                  ? 'partial'
                  : 'none';
            return { ...r, quantityProcured: newProcured, procurementStatus: newStatus };
          }),
        })),

      incrementUsed: (id, qty) =>
        set((s) => ({
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, quantityUsed: r.quantityUsed + qty } : r,
          ),
        })),
    }),
    {
      name: 'kinetic-project-requirements',
      version: 1,
    },
  ),
);
