import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectRequirementItem } from '@/types/domain/item';
import { masterDataService } from '@/services/master-data';

interface ProjectRequirementState {
  requirements: ProjectRequirementItem[];
  loading: boolean;
  setRequirements: (projectId: string, items: ProjectRequirementItem[]) => void;
  addRequirement: (item: ProjectRequirementItem) => void;
  updateRequirement: (id: string, data: Partial<ProjectRequirementItem>) => void;
  removeRequirement: (id: string) => void;
  getByProjectId: (projectId: string) => ProjectRequirementItem[];
  incrementProcured: (id: string, qty: number) => void;
  incrementUsed: (id: string, qty: number) => void;
  fetchRequirements: () => Promise<void>;
}

export const useProjectRequirementStore = create<ProjectRequirementState>()(
  persist(
    (set, get) => ({
      requirements: [],
      loading: false,

      setRequirements: (projectId, items) => {
        masterDataService.create('projectRequirements', { items, projectId } as any).catch(() => {});
        set((s) => ({
          requirements: [
            ...s.requirements.filter((r) => r.projectId !== projectId),
            ...items.map((r) => ({ ...r, projectId })),
          ],
        }));
      },

      addRequirement: (item) => {
        masterDataService.create('projectRequirements', item as any).catch(() => {});
        set((s) => ({ requirements: [...s.requirements, item] }));
      },

      updateRequirement: (id, data) => {
        masterDataService.update('projectRequirements', id, data as any).catch(() => {});
        set((s) => ({
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, ...data } : r,
          ),
        }));
      },

      removeRequirement: (id) => {
        masterDataService.delete('projectRequirements', id).catch(() => {});
        set((s) => ({
          requirements: s.requirements.filter((r) => r.id !== id),
        }));
      },

      fetchRequirements: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('projectRequirements', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          set({ requirements: list as unknown as ProjectRequirementItem[], loading: false });
        } catch {
          set({ loading: false });
        }
      },

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
      partialize: (state) => ({
        requirements: state.requirements,
      }),
    },
  ),
);
