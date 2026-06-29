import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id?: string;
  name?: string;
  fullName?: string;
  roleName?: string;
  email?: string;
  avatarUrl?: string;
  branchName?: string;
  branchId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'kinetic-auth',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0) return { user: null, token: null, isAuthenticated: false };
        return current;
      },
    },
  ),
);
