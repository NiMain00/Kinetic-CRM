import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { authz } from '@/services/authz';

/**
 * Convenience hook wrapping AuthorizationEngine for React components.
 */
export function useAuthz() {
  const user = useAuthStore((s) => s.user);
  const activeDepartmentId = useAuthStore((s) => s.activeDepartmentId);
  const departments = useRbacStore((s) => s.departments);
  const userRoles = useRbacStore((s) => s.userRoles);
  const rolePermissions = useRbacStore((s) => s.rolePermissions);
  const permissions = useRbacStore((s) => s.permissions);
  const roles = useRbacStore((s) => s.roles);
  const userId = user?.id;

  return useMemo(() => {
    return {
      can: (permission: string): boolean => {
        if (!userId) return false;
        return authz.hasPermission(userId, permission, {
          departmentId: activeDepartmentId || user?.departmentId,
        });
      },

      stageAccess: (stageCode: string, recordDeptId: string): 'none' | 'read' | 'write' => {
        if (!userId) return 'none';
        return authz.getStageAccess(userId, stageCode, recordDeptId, activeDepartmentId ?? undefined);
      },

      // Combined check: user has permission AND stage access grants write
      canWrite: (permission: string, stageCode: string, recordDeptId: string): boolean => {
        if (!userId) return false;
        return authz.canWriteRecord(userId, permission, stageCode, recordDeptId, activeDepartmentId ?? undefined);
      },

      // Stage-bound permission check (permission code encodes target stage)
      canOnStage: (permission: string, stageCode: string | null, recordDeptId: string): boolean => {
        if (!userId) return false;
        return authz.hasStagePermission(userId, permission, stageCode, recordDeptId, activeDepartmentId ?? undefined);
      },

      isDirector: (): boolean => {
        if (!userId) return false;
        const directorRole = roles.find((r) => r.name === 'director');
        if (!directorRole) return false;
        return userRoles.some(
          (ur) => ur.userId === userId && ur.roleId === directorRole.id && ur.scopeType === 'global',
        );
      },

      /** Highest non-project role: 'director' | 'admin' | 'manager' | 'staff' */
      highestRole: (): string => {
        if (!userId) return 'staff';
        return authz.getUserHighestRole(userId);
      },

      /** True if user is manager/admin/director — sees all data in dept */
      hasElevatedRole: (): boolean => {
        if (!userId) return false;
        return authz.hasElevatedRole(userId);
      },

      accessibleDepartments: () => {
        if (!userId) return [];
        return authz.getAccessibleDepartments(userId);
      },
    };
  }, [userId, activeDepartmentId, user?.departmentId, userRoles, rolePermissions, permissions, roles, departments]);
}
