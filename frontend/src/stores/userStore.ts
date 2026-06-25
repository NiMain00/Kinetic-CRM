import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/domain/users';

const INITIAL_USERS: User[] = [
  { id: 'USR-001', username: 'asulistyo', fullName: 'Ahmad Sulistyo', email: 'ahmad.s@kinetic.co.id', role: 'Branch Manager', branch: 'Jakarta Pusat', department: 'Operations', phone: '0812-3456-7890', status: 'active', lastLogin: '2026-06-22 08:30:00', createdAt: '2024-01-15' },
  { id: 'USR-002', username: 'bambang.pm', fullName: 'Bambang Permadi', email: 'b.permadi@kinetic.co.id', role: 'PM', branch: 'Project Management', department: 'Project Management Office', phone: '0812-3456-7891', status: 'active', lastLogin: '2026-06-21 14:20:00', createdAt: '2024-02-10' },
  { id: 'USR-003', username: 'rina.ops', fullName: 'Rina Marlina', email: 'rina.marlina@kinetic.co.id', role: 'Dept Head', branch: 'Surabaya', department: 'Operations', phone: '0812-3456-7892', status: 'inactive', lastLogin: '2026-05-30 09:15:00', createdAt: '2024-03-05' },
  { id: 'USR-004', username: 'doni.admin', fullName: 'Doni Wahyudi', email: 'doni.w@kinetic.co.id', role: 'Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7893', status: 'active', lastLogin: '2026-06-22 07:45:00', createdAt: '2024-01-20' },
  { id: 'USR-005', username: 'siti.am', fullName: 'Siti Aminah', email: 'siti.aminah@kinetic.co.id', role: 'Reviewer', branch: 'Jakarta Selatan', department: 'Quality Assurance', phone: '0812-3456-7894', status: 'active', lastLogin: '2026-06-21 16:00:00', createdAt: '2024-04-12' },
  { id: 'USR-006', username: 'andi.w', fullName: 'Andi Wijaya', email: 'andi.w@kinetic.co.id', role: 'Staff', branch: 'Bandung', department: 'Field Operations', phone: '0812-3456-7895', status: 'active', lastLogin: '2026-06-20 11:30:00', createdAt: '2024-05-01' },
  { id: 'USR-007', username: 'dewi.s', fullName: 'Dewi Sartika', email: 'dewi.s@kinetic.co.id', role: 'Branch Manager', branch: 'Medan', department: 'Operations', phone: '0812-3456-7896', status: 'active', lastLogin: '2026-06-22 06:50:00', createdAt: '2024-01-25' },
  { id: 'USR-008', username: 'eko.p', fullName: 'Eko Prasetyo', email: 'eko.p@kinetic.co.id', role: 'Super Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7897', status: 'active', lastLogin: '2026-06-22 08:00:00', createdAt: '2023-11-01' },
];

interface UserState {
  users: User[];
  addUser: (u: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: INITIAL_USERS,
      addUser: (u) => set((s) => ({ users: [...s.users, u] })),
      updateUser: (id, data) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
      getUserById: (id) => get().users.find((u) => u.id === id),
    }),
    { name: 'kinetic-users' },
  ),
);
