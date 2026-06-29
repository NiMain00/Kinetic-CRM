import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';

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
  const roles = useMasterDataStore((s) => s.roles);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Roles belum ter-load — jangan redirect ke 403, tunggu
  if (roles.length === 0) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const userRole = (user as { roleName?: string })?.roleName || '';
  const roleConfig = roles.find((r) => r.name === userRole);

  // Role user tidak ditemukan di konfigurasi — jangan akses
  if (!roleConfig) return <Navigate to="/403" replace />;

  const hasAccess = permissions.length === 0 || permissions.some((p) => roleConfig.permissions?.includes(p));

  if (!hasAccess) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
