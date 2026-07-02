import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  login: (token: string, user: AuthUser) => void;
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

      login: (token, user) => set({ token, user, isAuthenticated: true }),

      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        activeDepartmentId: null,
      }),

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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0) {
          return { user: null, token: null, isAuthenticated: false, activeDepartmentId: null };
        }
        if (version === 1) {
          return { ...current, activeDepartmentId: current.activeDepartmentId ?? null };
        }
        return current;
      },
    },
  ),
);
