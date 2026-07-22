import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authz } from '@/services/authz';

export interface AuthUser {
  id?: string;
  name?: string;
  fullName?: string;
  roleName?: string;
  email?: string;
  avatarUrl?: string;
  branchName?: string;
  branchId?: string;
  // RBAC fields
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  roleId?: string;
  scopeType?: string;
  scopeId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  activeDepartmentId: string | null;
  rememberMe: boolean;
  login: (token: string, user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
  setActiveDepartment: (deptId: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  getAccessLevel: (stageCode: string, recordDeptId: string) => 'none' | 'read' | 'write';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      activeDepartmentId: null,
      rememberMe: true,

      login: (token, user, rememberMe = true) => {
        set({ token, user, isAuthenticated: true, rememberMe });
        // Persist rememberMe preference so rehydration uses correct storage
        try {
          const data = JSON.stringify({ state: { ...get(), version: 2 }, version: 2 });
          const target = rememberMe ? localStorage : sessionStorage;
          target.setItem('kinetic-auth', data);
          // Clear the other storage to avoid stale sessions
          const other = rememberMe ? sessionStorage : localStorage;
          other.removeItem('kinetic-auth');
        } catch { /* storage full or unavailable */ }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          activeDepartmentId: null,
          rememberMe: true,
        });
        // Clean up both storage locations
        try {
          localStorage.removeItem('kinetic-auth');
          sessionStorage.removeItem('kinetic-auth');
        } catch { /* ignore */ }
      },

      setActiveDepartment: (deptId) => set({ activeDepartmentId: deptId }),

      hasPermission: (permissionCode) => {
        const user = get().user;
        if (!user?.id) return false;
        return authz.hasPermission(user.id, permissionCode, {
          departmentId: get().activeDepartmentId || user.departmentId,
        });
      },

      getAccessLevel: (stageCode, recordDeptId) => {
        const user = get().user;
        if (!user?.id) return 'none';
        return authz.getStageAccess(user.id, stageCode, recordDeptId, get().activeDepartmentId ?? undefined);
      },
    }),
    {
      name: 'kinetic-auth',
      version: 3,
      storage: createJSONStorage(() => {
        // Check both storages for rehydration; prefer whichever has data
        const ls = localStorage.getItem('kinetic-auth');
        const ss = sessionStorage.getItem('kinetic-auth');
        if (!ls && ss) return sessionStorage;
        // Parse rememberMe flag from localStorage data
        if (ls) {
          try {
            const parsed = JSON.parse(ls);
            if (parsed?.state?.rememberMe === false) return sessionStorage;
          } catch { /* corrupted data, default to localStorage */ }
        }
        return localStorage;
      }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0) {
          return { user: null, token: null, isAuthenticated: false, activeDepartmentId: null, rememberMe: true };
        }
        if (version === 1) {
          return { ...current, activeDepartmentId: current.activeDepartmentId ?? null, rememberMe: current.rememberMe ?? true };
        }
        if (version === 2) {
          return { ...current, rememberMe: current.rememberMe ?? true };
        }
        return current;
      },
    },
  ),
);
