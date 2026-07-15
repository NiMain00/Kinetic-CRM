import { create } from 'zustand';
import apiClient, { unwrap } from '@/services/api-client';
import type { FollowUpTask } from '@/types/domain';

interface FollowUpState {
  tasks: Record<string, FollowUpTask[]>;
  loading: boolean;
  fetchTasks: (prospectId: string) => Promise<void>;
  createTask: (data: {
    title: string;
    prospectId: string;
    fromUserId: string;
    toUserId: string;
    priority?: string;
    notes?: string;
    deadline?: string;
  }) => Promise<void>;
  updateTask: (id: string, data: {
    status?: string;
    priority?: string;
    progress?: number;
    notes?: string;
    title?: string;
    deadline?: string;
  }) => Promise<void>;
  deleteTask: (id: string, prospectId: string) => Promise<void>;
}

export const useFollowUpStore = create<FollowUpState>()((set, get) => ({
  tasks: {},
  loading: false,

  fetchTasks: async (prospectId) => {
    set({ loading: true });
    try {
      const res = await apiClient.get(`/follow-up/by-prospect/${prospectId}`);
      const data = unwrap<FollowUpTask[]>(res) || res.data;
      set((s) => ({ tasks: { ...s.tasks, [prospectId]: data }, loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    await apiClient.post('/follow-up', data);
    get().fetchTasks(data.prospectId);
  },

  updateTask: async (id, data) => {
    await apiClient.put(`/follow-up/${id}`, data);
    const current = get().tasks;
    for (const prospectId of Object.keys(current)) {
      if (current[prospectId].some((t) => t.id === id)) {
        get().fetchTasks(prospectId);
        break;
      }
    }
  },

  deleteTask: async (id, prospectId) => {
    await apiClient.delete(`/follow-up/${id}`);
    get().fetchTasks(prospectId);
  },
}));
