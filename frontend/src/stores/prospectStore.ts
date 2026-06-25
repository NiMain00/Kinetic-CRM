import { create } from 'zustand';
import type { Prospect, Customer } from '@/types/domain';
import { INITIAL_PROSPECTS, INITIAL_CUSTOMERS } from '@/services/mock-data';

interface ProspectStore {
  prospects: Prospect[];
  customers: Customer[];
  addProspect: (prospect: Prospect) => void;
  updateProspect: (id: string, prospect: Prospect) => void;
  deleteProspect: (id: string) => void;
  getProspect: (id: string) => Prospect | undefined;
}

export const useProspectStore = create<ProspectStore>((set, get) => ({
  prospects: [...INITIAL_PROSPECTS],
  customers: [...INITIAL_CUSTOMERS],
  addProspect: (prospect) =>
    set((state) => ({ prospects: [prospect, ...state.prospects] })),
  updateProspect: (id, updated) =>
    set((state) => ({
      prospects: state.prospects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    })),
  deleteProspect: (id) =>
    set((state) => ({
      prospects: state.prospects.filter((p) => p.id !== id),
    })),
  getProspect: (id) => get().prospects.find((p) => p.id === id),
}));