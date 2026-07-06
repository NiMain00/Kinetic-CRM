import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rbacService } from '@/services/rbac';

export interface RbacDepartment {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface RbacPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface RbacUserRole {
  id: string;
  userId: string;
  roleId: string;
  scopeType: 'global' | 'department' | 'project';
  scopeId?: string;
  assignedBy?: string;
  expiresAt?: string | null;
}

export interface RbacRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  scopeType?: 'global' | 'department' | 'project';
  scopeId?: string;
  stageId?: string;
  accessLevel: 'read' | 'write';
}

export interface WorkflowStage {
  id: string;
  code: string;
  name: string;
  module: string;
  sequence: number;
  ownerDepartmentCode: string;
  prevDepartmentCode?: string | null;
}

export interface ProjectDeptRecord {
  id: string;
  projectId: string;
  departmentId: string;
}

export interface ProjectMemberRecord {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
}

interface RbacState {
  departments: RbacDepartment[];
  roles: RbacRole[];
  permissions: RbacPermission[];
  userRoles: RbacUserRole[];
  rolePermissions: RbacRolePermission[];
  workflowStages: WorkflowStage[];
  projectDepartments: ProjectDeptRecord[];
  projectMembers: ProjectMemberRecord[];

  addDepartment: (data: Omit<RbacDepartment, 'id'>) => void;
  updateDepartment: (id: string, data: Partial<RbacDepartment>) => void;
  deleteDepartment: (id: string) => void;

  addRole: (data: Omit<RbacRole, 'id'>) => void;
  updateRole: (id: string, data: Partial<RbacRole>) => void;
  deleteRole: (id: string) => void;

  addPermission: (data: Omit<RbacPermission, 'id'>) => void;
  updatePermission: (id: string, data: Partial<RbacPermission>) => void;
  deletePermission: (id: string) => void;

  fetchUserRoles: (userId: string) => Promise<void>;
  assignUserRole: (userId: string, roleId: string, scopeType: RbacUserRole['scopeType'], scopeId?: string) => void;
  removeUserRole: (userRoleId: string) => void;
  getUserRoles: (userId: string) => RbacUserRole[];
  getUserDepartments: (userId: string) => RbacDepartment[];

  addRolePermission: (roleId: string, permissionId: string, scopeType?: RbacRolePermission['scopeType'], scopeId?: string, stageId?: string) => void;
  removeRolePermission: (rpId: string) => void;
  getRolePermissions: (roleId: string, scopeType?: string, scopeId?: string) => RbacRolePermission[];

  addStage: (data: Omit<WorkflowStage, 'id'>) => void;
  updateStage: (id: string, data: Partial<WorkflowStage>) => void;
  deleteStage: (id: string) => void;
  getStagesByModule: (module: string) => WorkflowStage[];

  addProjectDepartment: (projectId: string, departmentId: string) => void;
  removeProjectDepartment: (projectId: string, departmentId: string) => void;
  getProjectDepartments: (projectId: string) => RbacDepartment[];
  getProjectDeptIds: (projectId: string) => string[];
  addProjectMember: (projectId: string, userId: string, roleId: string, departmentId: string, assignedBy: string) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  getProjectMembers: (projectId: string) => ProjectMemberRecord[];
}

let _nextId = 1000;
const nextId = () => `rbac-${++_nextId}`;

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      departments: [],
      roles: [],
      permissions: [],
      userRoles: [],
      rolePermissions: [],
      workflowStages: [],
      projectDepartments: [],
      projectMembers: [],

      addDepartment: (data) =>
        set((s) => ({ departments: [...s.departments, { ...data, id: nextId() }] })),
      updateDepartment: (id, data) =>
        set((s) => ({
          departments: s.departments.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDepartment: (id) =>
        set((s) => ({
          departments: s.departments.filter((d) => d.id !== id),
        })),

      addRole: (data) =>
        set((s) => ({ roles: [...s.roles, { ...data, id: nextId() }] })),
      updateRole: (id, data) =>
        set((s) => ({
          roles: s.roles.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRole: (id) =>
        set((s) => ({
          roles: s.roles.filter((r) => r.id !== id),
        })),

      addPermission: (data) =>
        set((s) => ({ permissions: [...s.permissions, { ...data, id: nextId() }] })),
      updatePermission: (id, data) =>
        set((s) => ({
          permissions: s.permissions.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePermission: (id) =>
        set((s) => ({
          permissions: s.permissions.filter((p) => p.id !== id),
        })),

      fetchUserRoles: async (userId) => {
        try {
          const res = await rbacService.getUserRoles(userId);
          const apiRoles = res.data?.data || res.data || [];
          const newRoles = apiRoles.map((ur: any) => ({
            id: ur.id,
            userId: ur.userId,
            roleId: ur.roleId,
            scopeType: ur.scopeType || 'global',
            scopeId: ur.scopeId || undefined,
          }));
          set((s) => {
            const otherRoles = s.userRoles.filter((ur) => ur.userId !== userId);
            return { userRoles: [...otherRoles, ...newRoles] };
          });
        } catch { /* fallback ke seed data */ }
      },
      assignUserRole: async (userId, roleId, scopeType, scopeId) => {
        try {
          const res = await rbacService.assignRole(userId, roleId, scopeType, scopeId);
          const created = res.data?.data || res.data;
          if (created?.id) {
            set((s) => ({
              userRoles: [...s.userRoles, {
                id: created.id,
                userId: created.userId || userId,
                roleId: created.roleId || roleId,
                scopeType: created.scopeType || scopeType,
                scopeId: created.scopeId ?? scopeId,
              }],
            }));
            return;
          }
        } catch { /* fallback ke local */ }
        set((s) => ({
          userRoles: [...s.userRoles, { id: nextId(), userId, roleId, scopeType, scopeId }],
        }));
      },
      removeUserRole: async (userRoleId) => {
        try {
          await rbacService.removeRole(userRoleId);
        } catch { /* tetap hapus local */ }
        set((s) => ({
          userRoles: s.userRoles.filter((ur) => ur.id !== userRoleId),
        }));
      },
      getUserRoles: (userId) => get().userRoles.filter((ur) => ur.userId === userId),
      getUserDepartments: (userId) => {
        const store = get();
        const deptScopeIds = store.userRoles
          .filter((ur) => ur.userId === userId && ur.scopeType === 'department' && ur.scopeId)
          .map((ur) => ur.scopeId!);
        const projectDeptIds = store.projectMembers
          .filter((pm) => pm.userId === userId)
          .map((pm) => pm.departmentId);
        const allDeptIds = [...new Set([...deptScopeIds, ...projectDeptIds])];
        return store.departments.filter((d) => allDeptIds.includes(d.id) && d.is_active);
      },

      addRolePermission: (roleId, permissionId, scopeType, scopeId, stageId) =>
        set((s) => ({
          rolePermissions: [
            ...s.rolePermissions,
            { id: nextId(), roleId, permissionId, scopeType, scopeId, stageId: stageId || undefined, accessLevel: 'write' },
          ],
        })),
      removeRolePermission: (rpId) =>
        set((s) => ({
          rolePermissions: s.rolePermissions.filter((rp) => rp.id !== rpId),
        })),
      getRolePermissions: (roleId, scopeType, scopeId) =>
        get().rolePermissions.filter((rp) => {
          if (rp.roleId !== roleId) return false;
          if (scopeType && rp.scopeType !== scopeType) return false;
          if (scopeId !== undefined && rp.scopeId !== scopeId) return false;
          return true;
        }),

      addStage: (data) =>
        set((s) => ({ workflowStages: [...s.workflowStages, { ...data, id: nextId() }] })),
      updateStage: (id, data) =>
        set((s) => ({
          workflowStages: s.workflowStages.map((st) => (st.id === id ? { ...st, ...data } : st)),
        })),
      deleteStage: (id) =>
        set((s) => ({
          workflowStages: s.workflowStages.filter((st) => st.id !== id),
        })),
      getStagesByModule: (module) =>
        get().workflowStages.filter((st) => st.module === module).sort((a, b) => a.sequence - b.sequence),

      addProjectDepartment: (projectId, departmentId) =>
        set((s) => {
          const exists = s.projectDepartments.find((pd) => pd.projectId === projectId && pd.departmentId === departmentId);
          if (exists) return s;
          return {
            projectDepartments: [...s.projectDepartments, { id: nextId(), projectId, departmentId }],
          };
        }),
      removeProjectDepartment: (projectId, departmentId) =>
        set((s) => ({
          projectDepartments: s.projectDepartments.filter(
            (pd) => !(pd.projectId === projectId && pd.departmentId === departmentId)
          ),
        })),
      getProjectDepartments: (projectId) => {
        const store = get();
        const deptIds = store.projectDepartments
          .filter((pd) => pd.projectId === projectId)
          .map((pd) => pd.departmentId);
        return store.departments.filter((d) => deptIds.includes(d.id));
      },
      getProjectDeptIds: (projectId) => {
        return get().projectDepartments
          .filter((pd) => pd.projectId === projectId)
          .map((pd) => pd.departmentId);
      },
      addProjectMember: (projectId, userId, roleId, departmentId, assignedBy) =>
        set((s) => ({
          projectMembers: [
            ...s.projectMembers,
            { id: nextId(), projectId, userId, roleId, departmentId, assignedBy },
          ],
        })),
      removeProjectMember: (projectId, userId) =>
        set((s) => ({
          projectMembers: s.projectMembers.filter(
            (pm) => !(pm.projectId === projectId && pm.userId === userId)
          ),
        })),
      getProjectMembers: (projectId) =>
        get().projectMembers.filter((pm) => pm.projectId === projectId),
    }),
    {
      name: 'kinetic-rbac',
      version: 10,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return {
          departments: current.departments || [],
          roles: current.roles || [],
          permissions: current.permissions || [],
          userRoles: current.userRoles || [],
          rolePermissions: current.rolePermissions || [],
          workflowStages: current.workflowStages || [],
          projectDepartments: current.projectDepartments || [],
          projectMembers: current.projectMembers || [],
        };
      },
    },
  ),
);
