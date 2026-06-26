import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';

export function usePermission() {
  const userRole = useAuthStore((s) => s.user?.roleName);
  const roles = useMasterDataStore((s) => s.roles);

  return useMemo(() => {
    const roleConfig = roles.find((r) => r.name === userRole);
    const permissions = roleConfig?.permissions ?? [];
    return {
      can: (perm: string) => permissions.includes(perm),
      permissions,
    };
  }, [userRole, roles]);
}
