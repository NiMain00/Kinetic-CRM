import { useRbacStore, type RbacDepartment } from '@/stores/rbacStore';
import { useAuthStore } from '@/stores/authStore';
import {
  GLOBAL_PERMISSIONS,
  ROLE_HIERARCHY,
  ACCESS_LEVELS,
  RBAC_CONFIG,
  ROLES,
  ELEVATED_ROLES,
  type RoleLevel,
} from '@/config';

type StageAccessLevel = 'none' | 'read' | 'write';

function extractStageFromPermission(code: string): string | null {
  const parts = code.split(RBAC_CONFIG.SEPARATOR);
  if (parts.length === RBAC_CONFIG.LENGTH_TO_CHECK) return parts[RBAC_CONFIG.INDEX_TO_CHECK];
  return null;
}

// ── Engine ──

class AuthorizationEngine {
  /**
   * Check if a user has a specific permission.
   * Optionally provide context (departmentId, projectId) for scoped checks.
   */
  hasPermission(
    userId: string,
    permissionCode: string,
    context?: { departmentId?: string; projectId?: string },
  ): boolean {
    const store = useRbacStore.getState();

    if (GLOBAL_PERMISSIONS.includes(permissionCode)) return true;

    // Bypass: jika user dari API scope global / Super Admin, grant semua permission
    const authUser = useAuthStore.getState().user;
    if (authUser?.id === userId && (authUser?.scopeType === 'global' || authUser?.roleName === 'Super Admin' || authUser?.roleName === 'super_admin')) return true;

    if (this.checkDirectorBypass(userId, permissionCode)) return true;

    const userRoles = store.userRoles.filter((ur) => {
      if (ur.userId !== userId) return false;
      if (ur.expiresAt && new Date(ur.expiresAt) <= new Date()) return false;
      return true;
    });

    if (userRoles.length === 0) return false;

    for (const ur of userRoles) {
      const rolePerms = store.rolePermissions.filter((rp) => rp.roleId === ur.roleId);
      for (const rp of rolePerms) {
        const perm = store.permissions.find((p) => p.id === rp.permissionId);
        if (!perm || perm.code !== permissionCode) continue;

        if (rp.scopeType === 'global') return true;
        if (rp.scopeType === 'department') {
          const deptId = context?.departmentId || ur.scopeId;
          if (rp.scopeId === deptId || !rp.scopeId) return true;
        }
        if (rp.scopeType === 'project') {
          if (rp.scopeId === context?.projectId || !rp.scopeId) return true;
        }
        if (!rp.scopeType) return true;
      }
    }

    return false;
  }

  /**
   * Get stage-based access level for a user on a record.
   * activeDepartmentId should be passed from the caller (authStore or hook).
   */
  getStageAccess(
    userId: string,
    currentStageCode: string,
    recordDepartmentId: string,
    activeDepartmentId?: string,
  ): StageAccessLevel {
    const store = useRbacStore.getState();
    const stage = store.workflowStages.find((s) => s.code === currentStageCode);
    if (!stage) return ACCESS_LEVELS.NONE;

    if (this.hasElevatedRole(userId)) return ACCESS_LEVELS.WRITE;

    if (!activeDepartmentId) return ACCESS_LEVELS.NONE;

    const userDept = store.departments.find((d) => d.id === activeDepartmentId);
    if (!userDept) return ACCESS_LEVELS.NONE;

    if (userDept.code === stage.ownerDepartmentCode) return ACCESS_LEVELS.WRITE;

    if (stage.prevDepartmentCode && userDept.code === stage.prevDepartmentCode) return ACCESS_LEVELS.READ;

    return ACCESS_LEVELS.NONE;
  }

  /**
   * Enhanced permission check with stage-bound support.
   * For permissions with stage encoding (e.g., prospect:write:prospecting),
   * additionally verifies the user's stage access level meets the minimum.
   *
   * @param recordStageCode - current stage code of the record (optional)
   * @param recordDepartmentId - owning department of the record
   */
  hasStagePermission(
    userId: string,
    permissionCode: string,
    recordStageCode: string | null,
    recordDepartmentId: string,
    activeDepartmentId?: string,
  ): boolean {
    // Must have the base permission
    if (!this.hasPermission(userId, permissionCode, { departmentId: activeDepartmentId })) {
      return false;
    }

    // If no stage context, base permission is sufficient
    if (!recordStageCode) return true;

    // Check if the permission is stage-bound
    const boundStage = extractStageFromPermission(permissionCode);
    if (boundStage && boundStage !== recordStageCode) return false;

    // For stage-bound permissions, additionally require write-stage access
    // Elevated roles (admin/director with global scope) bypass stage access check
    if (this.hasElevatedRole(userId)) return true;

    const access = this.getStageAccess(userId, recordStageCode, recordDepartmentId, activeDepartmentId);
    return access === ACCESS_LEVELS.WRITE;
  }

  /**
   * Check if a user can write to a record based on stage ownership.
   * This is a convenience combining permission check + workflow stage ownership.
   *
   * Unlike `hasStagePermission`, this does NOT require the permission code
   * to match a specific stage — it uses getStageAccess directly.
   * Used for any write operation on a record (edit, delete, transition).
   */
  canWriteRecord(
    userId: string,
    permissionCode: string,
    stageCode: string,
    recordDepartmentId: string,
    activeDepartmentId?: string,
  ): boolean {
    // Must have the base permission first
    if (!this.hasPermission(userId, permissionCode, { departmentId: activeDepartmentId })) {
      return false;
    }

    // Elevated roles (admin/director with global scope) bypass stage access check
    if (this.hasElevatedRole(userId)) return true;

    // For regular roles, also require write-level stage access
    return this.getStageAccess(userId, stageCode, recordDepartmentId, activeDepartmentId) === ACCESS_LEVELS.WRITE;
  }

  /**
   * Get the highest role level for a user across all non-project roles.
   * Used for owner filtering: staff → own data only; manager/admin/director → all data.
   * Returns: 'super_admin' | 'director' | 'admin' | 'manager' | 'staff'
   */
  getUserHighestRole(userId: string): string {
    const store = useRbacStore.getState();
    const userRoleIds = store.userRoles
      .filter((ur) => ur.userId === userId)
      .map((ur) => ur.roleId);

    const roleNames = store.roles
      .filter((r) => userRoleIds.includes(r.id))
      .map((r) => r.name)
      .filter((name) => ![ROLES.PROJECT_VIEWER, ROLES.PROJECT_CONTRIBUTOR, ROLES.PROJECT_MANAGER].includes(name as any));

    let highest: string = ROLES.STAFF;
    let highestLevel = 0;
    for (const name of roleNames) {
      const level = ROLE_HIERARCHY[name as RoleLevel] || 0;
      if (level > highestLevel) {
        highestLevel = level;
        highest = name;
      }
    }
    return highest;
  }

  /**
   * Check if user has elevated role (manager, admin, director, or super_admin).
   * Elevated roles see ALL data in their department(s).
   */
  hasElevatedRole(userId: string): boolean {
    const role = this.getUserHighestRole(userId);
    return ELEVATED_ROLES.includes(role);
  }

  /**
   * Check if user has director bypass for a specific permission.
   */
  checkDirectorBypass(userId: string, permissionCode: string): boolean {
    const store = useRbacStore.getState();

    const directorRole = store.roles.find((r) => r.name === ROLES.DIRECTOR);
    if (!directorRole) return false;

    const hasDirectorRole = store.userRoles.some(
      (ur) => ur.userId === userId && ur.roleId === directorRole.id && ur.scopeType === 'global',
    );
    if (!hasDirectorRole) return false;

    return store.rolePermissions
      .filter((rp) => rp.roleId === directorRole.id)
      .some((rp) => {
        const perm = store.permissions.find((p) => p.id === rp.permissionId);
        return perm?.code === permissionCode;
      });
  }

  buildDepartmentFilter(
    userId: string,
    options?: { includeProjectAccess?: boolean; activeDepartmentId?: string },
  ): string[] {
    const store = useRbacStore.getState();
    const deptIds = new Set<string>();

    store.userRoles
      .filter((ur) => ur.userId === userId && ur.scopeType === 'department' && ur.scopeId)
      .forEach((ur) => deptIds.add(ur.scopeId!));

    if (options?.includeProjectAccess) {
      store.projectMembers
        .filter((pm) => pm.userId === userId)
        .forEach((pm) => deptIds.add(pm.departmentId));
    }

    // If active department specified and user has access, filter to just that
    if (options?.activeDepartmentId && deptIds.has(options.activeDepartmentId)) {
      return [options.activeDepartmentId];
    }

    return [...deptIds];
  }

  /**
   * Get departments accessible by the user.
   */
  getAccessibleDepartments(userId: string): RbacDepartment[] {
    const store = useRbacStore.getState();

    const directorRole = store.roles.find((r) => r.name === ROLES.DIRECTOR);
    if (directorRole) {
      const isDirector = store.userRoles.some(
        (ur) => ur.userId === userId && ur.roleId === directorRole.id && ur.scopeType === 'global',
      );
      if (isDirector) return store.departments.filter((d) => d.is_active);
    }

    const adminRole = store.roles.find((r) => r.name === ROLES.ADMIN);
    if (adminRole) {
      const isGlobalAdmin = store.userRoles.some(
        (ur) => ur.userId === userId && ur.roleId === adminRole.id && ur.scopeType === 'global',
      );
      if (isGlobalAdmin) return store.departments.filter((d) => d.is_active);
    }

    const superAdminRole = store.roles.find((r) => r.name === ROLES.SUPER_ADMIN);
    if (superAdminRole) {
      const isSuperAdmin = store.userRoles.some(
        (ur) => ur.userId === userId && ur.roleId === superAdminRole.id,
      );
      if (isSuperAdmin) return store.departments.filter((d) => d.is_active);
    }

    const deptIds = this.buildDepartmentFilter(userId, { includeProjectAccess: true });
    return store.departments.filter((d) => deptIds.includes(d.id) && d.is_active);
  }
}

export const authz = new AuthorizationEngine();
