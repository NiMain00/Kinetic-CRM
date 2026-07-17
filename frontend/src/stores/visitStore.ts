import { create } from 'zustand';
import apiClient, { unwrap } from '@/services/api-client';
import type { Visit } from '@/types/domain';

interface VisitState {
  visits: Record<string, Visit[]>;
  loading: boolean;
  fetchVisits: (prospectId: string) => Promise<void>;
  createVisit: (data: { prospectId: string; customerId?: string; date: string; notes?: string; picName?: string; picUserId?: string }) => Promise<void>;
  updateVisit: (id: string, data: { status?: string; notes?: string; picName?: string; date?: string }) => Promise<void>;
  deleteVisit: (id: string, prospectId: string) => Promise<void>;
}

export const useVisitStore = create<VisitState>()((set, get) => ({
  visits: {},
  loading: false,

  fetchVisits: async (prospectId) => {
    set({ loading: true });
    try {
      const res = await apiClient.get(`/visits/by-prospect/${prospectId}`);
      const data = unwrap<Visit[]>(res) || res.data;
      set((s) => ({ visits: { ...s.visits, [prospectId]: data }, loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  createVisit: async (data) => {
    await apiClient.post('/visits', data);
    get().fetchVisits(data.prospectId);
  },

  updateVisit: async (id, data) => {
    await apiClient.put(`/visits/${id}`, data);
    // refresh all cached prospect visits
    const current = get().visits;
    for (const prospectId of Object.keys(current)) {
      if (current[prospectId].some((v) => v.id === id)) {
        get().fetchVisits(prospectId);
        break;
      }
    }
  },

  deleteVisit: async (id, prospectId) => {
    await apiClient.delete(`/visits/${id}`);
    get().fetchVisits(prospectId);
  },
}));
