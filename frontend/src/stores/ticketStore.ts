import { create } from 'zustand';
import apiClient, { unwrap } from '@/services/api-client';
import type { Ticket } from '@/types/domain';

interface TicketState {
  tickets: Record<string, Ticket[]>;
  loading: boolean;
  fetchTickets: (prospectId: string) => Promise<void>;
  createTicket: (data: { title: string; prospectId: string; fromUserId: string; toUserId: string; priority?: string; notes?: string }) => Promise<void>;
  updateTicket: (id: string, data: { status?: string; priority?: string; progress?: number; notes?: string; title?: string }) => Promise<void>;
  deleteTicket: (id: string, prospectId: string) => Promise<void>;
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: {},
  loading: false,

  fetchTickets: async (prospectId) => {
    set({ loading: true });
    try {
      const res = await apiClient.get(`/tickets/by-prospect/${prospectId}`);
      const data = unwrap<Ticket[]>(res) || res.data;
      set((s) => ({ tickets: { ...s.tickets, [prospectId]: data }, loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  createTicket: async (data) => {
    await apiClient.post('/tickets', data);
    get().fetchTickets(data.prospectId);
  },

  updateTicket: async (id, data) => {
    await apiClient.put(`/tickets/${id}`, data);
    const current = get().tickets;
    for (const prospectId of Object.keys(current)) {
      if (current[prospectId].some((t) => t.id === id)) {
        get().fetchTickets(prospectId);
        break;
      }
    }
  },

  deleteTicket: async (id, prospectId) => {
    await apiClient.delete(`/tickets/${id}`);
    get().fetchTickets(prospectId);
  },
}));
