import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { authz } from '@/services/authz';
import PageLoader from '@/components/layout/PageLoader';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRole = (user as { roleName?: string })?.roleName || '';
  if (roles.length > 0 && !roles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export function PermissionRoute({ children, permissions }: { children: React.ReactNode; permissions: string[] }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeDepartmentId = useAuthStore((s) => s.activeDepartmentId);
  // Subscribe to RBAC store to re-evaluate when roles/permissions load
  const rbacUserRoles = useRbacStore((s) => s.userRoles);
  const rbacRolePermissions = useRbacStore((s) => s.rolePermissions);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permissions.length === 0) return <>{children}</>;

  const userId = (user as { id?: string })?.id;
  if (!userId) return <Navigate to="/403" replace />;

  const deptId = activeDepartmentId || (user as any)?.departmentId;

  const hasAccess = permissions.some((p) =>
    authz.hasPermission(userId, p, { departmentId: deptId }),
  );

  // If no access and RBAC data exists, redirect to 403
  // If RBAC not yet loaded, show loader instead of false redirect
  if (!hasAccess) {
    if (rbacUserRoles.length === 0) {
      return <PageLoader />;
    }
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export function DepartmentRoute({ children, departmentId }: { children: React.ReactNode; departmentId: string }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userId = (user as { id?: string })?.id;
  if (!userId) return <Navigate to="/403" replace />;

  const accessible = authz.buildDepartmentFilter(userId, { includeProjectAccess: true });

  if (!accessible.includes(departmentId) && !authz.hasElevatedRole(userId)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
