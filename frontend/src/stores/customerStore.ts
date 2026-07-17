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
  /** Get all sub-customers (children) of a customer */
  getSubCustomers: (parentId: string) => Customer[];
  /** Get root customer (top-most ancestor) for roll-up */
  getRootCustomer: (id: string) => Customer | undefined;
  /** Build customer tree for hierarcy selector */
  getCustomerTree: () => Customer[];
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

      addCustomer: async (c) => {
        try {
          await masterDataService.create('customers', c as any);
          set((s) => ({ customers: [...s.customers, c] }));
        } catch (err) {
          console.error('[customerStore] addCustomer API failed:', err);
          // Jangan update local state jika API gagal
        }
      },

      createCustomer: async (data) => {
        const res = await masterDataService.customers.create(data);
        const customer = (res.data.data || res.data) as Customer;
        set((s) => ({ customers: [...s.customers, customer] }));
        return customer;
      },

      updateCustomer: async (id, data) => {
        await masterDataService.customers.update(id, data);
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      verifyCustomer: async (id, verifiedBy) => {
        try {
          await masterDataService.customers.update(id, {
            needsVerification: false,
            verifiedAt: new Date().toISOString(),
            verifiedBy,
          });
          set((s) => ({
            customers: s.customers.map((c) =>
              c.id === id
                ? { ...c, needsVerification: false, verifiedAt: new Date().toISOString(), verifiedBy }
                : c,
            ),
          }));
        } catch (err) {
          console.error('[customerStore] verifyCustomer API failed:', err);
          // Jangan update local state jika API gagal
        }
      },

      deleteCustomer: async (id) => {
        await masterDataService.customers.delete(id);
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
      },

      getCustomerById: (id) => get().customers.find((c) => c.id === id),

      getSubCustomers: (parentId) => get().customers.filter((c) => c.parentId === parentId),

      getRootCustomer: (id) => {
        const customers = get().customers;
        let current = customers.find((c) => c.id === id);
        while (current?.parentId) {
          const parent = customers.find((c) => c.id === current!.parentId);
          if (!parent) break;
          current = parent;
        }
        return current;
      },

      getCustomerTree: () => {
        const customers = get().customers;
        // Attach children to each customer
        return customers
          .filter((c) => !c.parentId)
          .map((root) => ({
            ...root,
            children: customers.filter((c) => c.parentId === root.id),
          }));
      },
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
