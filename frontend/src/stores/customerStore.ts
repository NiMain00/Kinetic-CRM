import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/domain';
import { INITIAL_CUSTOMERS } from '@/services/mock-data';

interface CustomerState {
  customers: Customer[];
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  verifyCustomer: (id: string, verifiedBy: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: INITIAL_CUSTOMERS,
      addCustomer: (c) => set((s) => ({ customers: [...s.customers, c] })),
      updateCustomer: (id, data) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      verifyCustomer: (id, verifiedBy) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? { ...c, needsVerification: false, verifiedAt: new Date().toISOString(), verifiedBy }
              : c,
          ),
        })),
      getCustomerById: (id) => get().customers.find((c) => c.id === id),
    }),
    { name: 'kinetic-customers' },
  ),
);
