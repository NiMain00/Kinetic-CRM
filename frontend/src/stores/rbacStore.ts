import { create } from 'zustand';
import { rbacService } from '@/services/rbac';
import { masterDataService } from '@/services/master-data';

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
  stageDepartments?: StageDepartment[];
}

export interface StageDepartment {
  id: string;
  stageId: string;
  departmentCode: string;
  accessLevel: 'read' | 'write';
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
  stageDepartments: StageDepartment[];
  projectDepartments: ProjectDeptRecord[];
  projectMembers: ProjectMemberRecord[];

  addDepartment: (data: Omit<RbacDepartment, 'id'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<RbacDepartment>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  fetchDepartments: () => Promise<void>;

  addRole: (data: Omit<RbacRole, 'id'>) => Promise<void>;
  updateRole: (id: string, data: Partial<RbacRole>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>;

  addPermission: (data: Omit<RbacPermission, 'id'>) => Promise<void>;
  updatePermission: (id: string, data: Partial<RbacPermission>) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  fetchPermissions: () => Promise<void>;

  fetchUserRoles: (userId: string) => Promise<void>;
  fetchAllUserRoles: () => Promise<void>;
  assignUserRole: (userId: string, roleId: string, scopeType: RbacUserRole['scopeType'], scopeId?: string) => void;
  removeUserRole: (userRoleId: string) => void;
  getUserRoles: (userId: string) => RbacUserRole[];
  getUserDepartments: (userId: string) => RbacDepartment[];

  addRolePermission: (roleId: string, permissionId: string, scopeType?: RbacRolePermission['scopeType'], scopeId?: string, stageId?: string) => void;
  removeRolePermission: (rpId: string) => void;
  getRolePermissions: (roleId: string, scopeType?: string, scopeId?: string) => RbacRolePermission[];
  applyRolePermissions: (
    draftChanges: Record<string, 'add' | 'remove' | null>,
    defaultScope: 'global' | 'department',
  ) => Promise<void>;

  addStage: (data: Omit<WorkflowStage, 'id'>) => Promise<string | undefined>;
  updateStage: (id: string, data: Partial<WorkflowStage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  fetchStages: () => Promise<void>;
  getStagesByModule: (module: string) => WorkflowStage[];
  fetchStageDepartments: (stageId: string) => Promise<void>;
  setStageDepartments: (stageId: string, assignments: { departmentCode: string; accessLevel: string }[]) => Promise<void>;

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
    (set, get) => ({
      departments: [],
      roles: [],
      permissions: [],
      userRoles: [],
      rolePermissions: [],
      workflowStages: [],
      stageDepartments: [],
      projectDepartments: [],
      projectMembers: [],

      fetchDepartments: async () => {
        try {
          const res = await rbacService.getDepartments();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            departments: (data || []).map((d: any) => ({
              id: d.id,
              code: d.code,
              name: d.name,
              description: d.address ?? d.description,
              is_active: d.isActive ?? d.is_active ?? true,
            })),
          });
        } catch (err) {
          console.error('[rbacStore] fetchDepartments failed:', err);
        }
      },
      addDepartment: async (data) => {
        try {
          await rbacService.createDepartment(data);
          await get().fetchDepartments();
        } catch (err) {
          console.error('[rbacStore] addDepartment failed:', err);
          throw err;
        }
      },
      updateDepartment: async (id, data) => {
        try {
          await rbacService.updateDepartment(id, data);
          await get().fetchDepartments();
        } catch (err) {
          console.error('[rbacStore] updateDepartment failed:', err);
          throw err;
        }
      },
      deleteDepartment: async (id) => {
        try {
          await rbacService.deleteDepartment(id);
          await get().fetchDepartments();
        } catch (err) {
          console.error('[rbacStore] deleteDepartment failed:', err);
          throw err;
        }
      },

      fetchRoles: async () => {
        try {
          const res = await rbacService.getRoles();
          const data = (res.data?.data ?? res.data) as any[];
          const roles = (data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            is_system: r.isSystem ?? r.is_system ?? false,
          }));
          const rolePermissions = (data || []).flatMap((r: any) =>
            (r.rolePermissions || []).map((rp: any) => ({
              id: rp.id,
              roleId: rp.roleId,
              permissionId: rp.permissionId,
              scopeType: rp.scopeType,
              scopeId: rp.scopeId,
              stageId: rp.stageId,
              accessLevel: rp.accessLevel || 'write',
            })),
          );
          set({ roles, rolePermissions });
        } catch (err) {
          console.error('[rbacStore] fetchRoles failed:', err);
        }
      },
      addRole: async (data) => {
        try {
          await rbacService.createRole(data);
          await get().fetchRoles();
        } catch (err) {
          console.error('[rbacStore] addRole failed:', err);
          throw err;
        }
      },
      updateRole: async (id, data) => {
        try {
          await rbacService.updateRole(id, data);
          await get().fetchRoles();
        } catch (err) {
          console.error('[rbacStore] updateRole failed:', err);
          throw err;
        }
      },
      deleteRole: async (id) => {
        try {
          await rbacService.deleteRole(id);
          await get().fetchRoles();
        } catch (err) {
          console.error('[rbacStore] deleteRole failed:', err);
          throw err;
        }
      },

      fetchPermissions: async () => {
        try {
          const res = await rbacService.getPermissions();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            permissions: (data || []).map((p: any) => ({
              id: p.id,
              code: p.code,
              name: p.name,
              module: p.module,
              description: p.description,
            })),
          });
        } catch (err) {
          console.error('[rbacStore] fetchPermissions failed:', err);
        }
      },
      addPermission: async (data) => {
        try {
          await rbacService.createPermission(data);
          await get().fetchPermissions();
        } catch (err) {
          console.error('[rbacStore] addPermission failed:', err);
          throw err;
        }
      },
      updatePermission: async (id, data) => {
        try {
          await rbacService.updatePermission(id, data);
          await get().fetchPermissions();
        } catch (err) {
          console.error('[rbacStore] updatePermission failed:', err);
          throw err;
        }
      },
      deletePermission: async (id) => {
        try {
          await rbacService.deletePermission(id);
          await get().fetchPermissions();
        } catch (err) {
          console.error('[rbacStore] deletePermission failed:', err);
          throw err;
        }
      },

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
      fetchAllUserRoles: async () => {
        try {
          const res = await rbacService.getAllUserRoles();
          const apiRoles = res.data?.data || res.data || [];
          const allRoles = apiRoles.map((ur: any) => ({
            id: ur.id,
            userId: ur.userId,
            roleId: ur.roleId,
            scopeType: ur.scopeType || 'global',
            scopeId: ur.scopeId || undefined,
          }));
          set({ userRoles: allRoles });
        } catch { /* fallback ke data yang ada */ }
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

      addRolePermission: async (roleId, permissionId, scopeType, scopeId, stageId) => {
        try {
          await masterDataService.create('rolePermissions', { roleId, permissionId, scopeType, scopeId, stageId, accessLevel: 'write' } as any);
        } catch (err) {
          console.error('[rbacStore] addRolePermission API failed:', err);
        }
        set((s) => ({
          rolePermissions: [
            ...s.rolePermissions,
            { id: nextId(), roleId, permissionId, scopeType, scopeId, stageId: stageId || undefined, accessLevel: 'write' },
          ],
        }));
      },
      removeRolePermission: async (rpId) => {
        try {
          await masterDataService.delete('rolePermissions', rpId);
        } catch (err) {
          console.error('[rbacStore] removeRolePermission API failed:', err);
        }
        set((s) => ({
          rolePermissions: s.rolePermissions.filter((rp) => rp.id !== rpId),
        }));
      },
      getRolePermissions: (roleId, scopeType, scopeId) =>
        get().rolePermissions.filter((rp) => {
          if (rp.roleId !== roleId) return false;
          if (scopeType && rp.scopeType !== scopeType) return false;
          if (scopeId !== undefined && rp.scopeId !== scopeId) return false;
          return true;
        }),
      applyRolePermissions: async (draftChanges, defaultScope) => {
        try {
          const current = get().rolePermissions;
          const roleIds = new Set<string>();
          for (const key of Object.keys(draftChanges)) {
            const [roleId] = key.split(':');
            roleIds.add(roleId);
          }
          for (const roleId of roleIds) {
            const map = new Map<string, { permissionId: string; scopeType?: string; scopeId?: string; accessLevel: string }>();
            for (const rp of current.filter((r) => r.roleId === roleId)) {
              map.set(rp.permissionId, {
                permissionId: rp.permissionId,
                scopeType: rp.scopeType,
                scopeId: rp.scopeId,
                accessLevel: rp.accessLevel || 'write',
              });
            }
            for (const [key, action] of Object.entries(draftChanges)) {
              const [rid, ...rest] = key.split(':');
              if (rid !== roleId || !action) continue;
              const permissionId = rest.join(':');
              if (action === 'add') {
                map.set(permissionId, { permissionId, scopeType: defaultScope, scopeId: undefined, accessLevel: 'write' });
              } else {
                map.delete(permissionId);
              }
            }
            await rbacService.setRolePermissions(roleId, [...map.values()]);
          }
          await get().fetchRoles();
        } catch (err) {
          console.error('[rbacStore] applyRolePermissions failed:', err);
          throw err;
        }
      },

      fetchStages: async () => {
        try {
          const res = await rbacService.getWorkflowStages();
          const data = (res.data?.data ?? res.data) as any[];
          const allStageDepts: StageDepartment[] = [];
          set({
            workflowStages: (data || []).map((s: any) => {
              const depts: StageDepartment[] = (s.stageDepartments || []).map((sd: any) => ({
                id: sd.id,
                stageId: sd.stageId,
                departmentCode: sd.departmentCode,
                accessLevel: sd.accessLevel || 'read',
              }));
              allStageDepts.push(...depts);
              return {
                id: s.id,
                code: s.code,
                name: s.name,
                module: s.module,
                sequence: s.sequence,
                ownerDepartmentCode: s.ownerDepartmentCode,
                prevDepartmentCode: s.prevDepartmentCode ?? null,
                stageDepartments: depts,
              };
            }),
            stageDepartments: allStageDepts,
          });
        } catch (err) {
          console.error('[rbacStore] fetchStages failed:', err);
        }
      },
      addStage: async (data) => {
        try {
          const res = await rbacService.createStage(data);
          await get().fetchStages();
          const created = res.data?.data ?? res.data;
          return created?.id;
        } catch (err) {
          console.error('[rbacStore] addStage failed:', err);
          throw err;
        }
      },
      updateStage: async (id, data) => {
        try {
          await rbacService.updateStage(id, data);
          await get().fetchStages();
        } catch (err) {
          console.error('[rbacStore] updateStage failed:', err);
          throw err;
        }
      },
      deleteStage: async (id) => {
        try {
          await rbacService.deleteStage(id);
          await get().fetchStages();
        } catch (err) {
          console.error('[rbacStore] deleteStage failed:', err);
          throw err;
        }
      },
      getStagesByModule: (module) =>
        get().workflowStages.filter((st) => st.module === module).sort((a, b) => a.sequence - b.sequence),

      fetchStageDepartments: async (stageId) => {
        try {
          const res = await rbacService.getStageDepartments(stageId);
          const depts = (res.data?.data ?? res.data) as any[] || [];
          set({ stageDepartments: depts.map((d: any) => ({ id: d.id, stageId: d.stageId, departmentCode: d.departmentCode, accessLevel: d.accessLevel || 'read' })) });
        } catch (err) {
          console.error('[rbacStore] fetchStageDepartments failed:', err);
        }
      },
      setStageDepartments: async (stageId, assignments) => {
        try {
          await rbacService.setStageDepartments(stageId, assignments);
          await get().fetchStages();
        } catch (err) {
          console.error('[rbacStore] setStageDepartments failed:', err);
          throw err;
        }
      },

      addProjectDepartment: async (projectId, departmentId) => {
        try {
          await masterDataService.create('projectDepartments', { projectId, departmentId } as any);
        } catch (err) {
          console.error('[rbacStore] addProjectDepartment API failed:', err);
        }
        set((s) => {
          const exists = s.projectDepartments.find((pd) => pd.projectId === projectId && pd.departmentId === departmentId);
          if (exists) return s;
          return {
            projectDepartments: [...s.projectDepartments, { id: nextId(), projectId, departmentId }],
          };
        });
      },
      removeProjectDepartment: async (projectId, departmentId) => {
        try {
          const existing = get().projectDepartments.find((pd) => pd.projectId === projectId && pd.departmentId === departmentId);
          if (existing) {
            await masterDataService.delete('projectDepartments', existing.id);
          }
        } catch (err) {
          console.error('[rbacStore] removeProjectDepartment API failed:', err);
        }
        set((s) => ({
          projectDepartments: s.projectDepartments.filter(
            (pd) => !(pd.projectId === projectId && pd.departmentId === departmentId)
          ),
        }));
      },
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
      addProjectMember: async (projectId, userId, roleId, departmentId, assignedBy) => {
        try {
          await masterDataService.create('projectMembers', { projectId, userId, roleId, departmentId, assignedBy } as any);
        } catch (err) {
          console.error('[rbacStore] addProjectMember API failed:', err);
        }
        set((s) => ({
          projectMembers: [
            ...s.projectMembers,
            { id: nextId(), projectId, userId, roleId, departmentId, assignedBy },
          ],
        }));
      },
      removeProjectMember: async (projectId, userId) => {
        try {
          const existing = get().projectMembers.find((pm) => pm.projectId === projectId && pm.userId === userId);
          if (existing) {
            await masterDataService.delete('projectMembers', existing.id);
          }
        } catch (err) {
          console.error('[rbacStore] removeProjectMember API failed:', err);
        }
        set((s) => ({
          projectMembers: s.projectMembers.filter(
            (pm) => !(pm.projectId === projectId && pm.userId === userId)
          ),
        }));
      },
      getProjectMembers: (projectId) =>
        get().projectMembers.filter((pm) => pm.projectId === projectId),
    }),
);
