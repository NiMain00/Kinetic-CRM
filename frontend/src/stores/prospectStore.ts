import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';

interface ProspectState {
  prospects: Prospect[];
  addProspect: (p: Prospect) => void;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      prospects: INITIAL_PROSPECTS,
      addProspect: (p) => set((s) => ({ prospects: [...s.prospects, p] })),
      updateProspect: (id, data) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProspect: (id) =>
        set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) })),
      getProspectById: (id) => get().prospects.find((p) => p.id === id),
    }),
    { name: 'kinetic-prospects' },
  ),
);
