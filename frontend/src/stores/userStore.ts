import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/domain/users';
import { masterDataService } from '@/services/master-data';

interface UserState {
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (u: User) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      loading: false,
      fetchUsers: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('users', { perPage: 200 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          const mapped = list.map((u: any) => ({
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            role: u.role || '',
            branch: u.orgUnit?.name || '',
            department: u.orgUnit?.name || '',
            phone: u.phone || '',
            status: u.status || 'active',
            lastLogin: u.lastLogin || u.updatedAt || '',
            createdAt: u.createdAt || '',
          }));
          set({ users: mapped, loading: false });
        } catch { set({ loading: false }); }
      },
      addUser: async (u) => {
        try {
          const res = await masterDataService.create('users', u as any);
          const created = (res.data?.data || res.data) as any;
          if (created?.id) u = { ...u, id: created.id };
        } catch (err) {
          console.error('[userStore] addUser API failed:', err);
        }
        set((s) => ({ users: [...s.users, u] }));
      },
      updateUser: async (id, data) => {
        try {
          await masterDataService.update('users', id, data as any);
        } catch (err) {
          console.error('[userStore] updateUser API failed:', err);
        }
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        }));
      },
      deleteUser: async (id) => {
        try {
          await masterDataService.delete('users', id);
        } catch (err) {
          console.error('[userStore] deleteUser API failed:', err);
        }
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      },
      getUserById: (id) => get().users.find((u) => u.id === id),
    }),
    {
      name: 'kinetic-users',
      version: 3,
      partialize: (state) => ({ users: state.users }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { users: current.users || [] };
      },
    },
  ),
);
