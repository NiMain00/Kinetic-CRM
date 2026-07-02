import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';

/**
 * Determines whether the current user is "staff-only" — i.e., only has
 * the `staff` role (no manager/admin/director).
 *
 * Per the RBAC architecture:
 * - Staff → only sees data they own (ownerUserId === userId)
 * - Manager/Admin/Director → sees all data in their department(s)
 */
export function useOwnerFilter() {
  const userId = useAuthStore((s) => s.user?.id);
  const userRoles = useRbacStore((s) => s.userRoles);
  const roles = useRbacStore((s) => s.roles);

  return useMemo(() => {
    if (!userId) return { isStaffOnly: false, userId: undefined };

    const userRoleIds = userRoles
      .filter((ur) => ur.userId === userId)
      .map((ur) => ur.roleId);

    const roleNames = roles
      .filter((r) => userRoleIds.includes(r.id))
      .map((r) => r.name);

    // Non-project roles only (exclude project_viewer/contributor/manager)
    const nonProjectRoles = roleNames.filter(
      (r) => !['project_viewer', 'project_contributor', 'project_manager'].includes(r),
    );

    // Staff-only if every non-project role is 'staff'
    const isStaffOnly = nonProjectRoles.length > 0 && nonProjectRoles.every((r) => r === 'staff');

    return { isStaffOnly, userId };
  }, [userId, userRoles, roles]);
}
