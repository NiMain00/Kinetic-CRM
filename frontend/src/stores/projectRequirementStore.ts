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

      setRequirements: async (projectId, items) => {
        try {
          await masterDataService.create('projectRequirements', { items, projectId } as any);
        } catch (err) {
          console.error('[projectRequirementStore] setRequirements API failed:', err);
        }
        set((s) => ({
          requirements: [
            ...s.requirements.filter((r) => r.projectId !== projectId),
            ...items.map((r) => ({ ...r, projectId })),
          ],
        }));
      },

      addRequirement: async (item) => {
        try {
          const res = await masterDataService.create('projectRequirements', item as any);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) item = { ...item, id: created.id };
        } catch (err) {
          console.error('[projectRequirementStore] addRequirement API failed:', err);
        }
        set((s) => ({ requirements: [...s.requirements, item] }));
      },

      updateRequirement: async (id, data) => {
        try {
          await masterDataService.update('projectRequirements', id, data as any);
        } catch (err) {
          console.error('[projectRequirementStore] updateRequirement API failed:', err);
        }
        set((s) => ({
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, ...data } : r,
          ),
        }));
      },

      removeRequirement: async (id) => {
        try {
          await masterDataService.delete('projectRequirements', id);
        } catch (err) {
          console.error('[projectRequirementStore] removeRequirement API failed:', err);
        }
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

      incrementProcured: async (id, qty) => {
        try {
          const req = get().requirements.find((r) => r.id === id);
          if (req) {
            const newProcured = req.quantityProcured + qty;
            const newStatus = newProcured >= req.quantityRequired ? 'fully_submitted' : newProcured > 0 ? 'partial' : 'none';
            await masterDataService.update('projectRequirements', id, {
              quantityProcured: newProcured,
              procurementStatus: newStatus,
            } as any);
          }
        } catch (err) {
          console.error('[projectRequirementStore] incrementProcured API failed:', err);
        }
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
        }));
      },

      incrementUsed: async (id, qty) => {
        try {
          const req = get().requirements.find((r) => r.id === id);
          if (req) {
            await masterDataService.update('projectRequirements', id, {
              quantityUsed: req.quantityUsed + qty,
            } as any);
          }
        } catch (err) {
          console.error('[projectRequirementStore] incrementUsed API failed:', err);
        }
        set((s) => ({
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, quantityUsed: r.quantityUsed + qty } : r,
          ),
        }));
      },
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
