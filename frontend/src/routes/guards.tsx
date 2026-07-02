import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authz } from '@/services/authz';

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permissions.length === 0) return <>{children}</>;

  const userId = (user as { id?: string })?.id;
  if (!userId) return <Navigate to="/403" replace />;

  const activeDeptId = useAuthStore.getState().activeDepartmentId || (user as any)?.departmentId;

  const hasAccess = permissions.some((p) =>
    authz.hasPermission(userId, p, { departmentId: activeDeptId }),
  );

  if (!hasAccess) return <Navigate to="/403" replace />;

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
