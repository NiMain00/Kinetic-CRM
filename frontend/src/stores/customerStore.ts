import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/domain';
import { masterDataService } from '@/services/master-data';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  fetchCustomers: (params?: { search?: string; type?: string }) => Promise<void>;
  addCustomer: (c: Customer) => void;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  verifyCustomer: (id: string, verifiedBy: string) => void;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      loading: false,

      fetchCustomers: async (params) => {
        set({ loading: true });
        try {
          const res = await masterDataService.customers.list(params);
          set({ customers: res.data.data || res.data as any, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      addCustomer: (c) => set((s) => ({ customers: [...s.customers, c] })),

      createCustomer: async (data) => {
        const res = await masterDataService.customers.create(data);
        const customer = res.data.data || res.data;
        set((s) => ({ customers: [...s.customers, customer] }));
        return customer;
      },

      updateCustomer: async (id, data) => {
        await masterDataService.customers.update(id, data);
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      verifyCustomer: (id, verifiedBy) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? { ...c, needsVerification: false, verifiedAt: new Date().toISOString(), verifiedBy }
              : c,
          ),
        })),

      deleteCustomer: async (id) => {
        await masterDataService.customers.delete(id);
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
      },

      getCustomerById: (id) => get().customers.find((c) => c.id === id),
    }),
    {
      name: 'kinetic-customers',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { customers: current.customers || [], loading: false };
      },
      partialize: (state) => ({ customers: state.customers, loading: false }),
    },
  ),
);
