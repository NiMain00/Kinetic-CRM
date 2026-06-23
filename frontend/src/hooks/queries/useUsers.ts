import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/users';

export function useUsers(filters?: { search?: string; role?: string; branchId?: string; isActive?: boolean; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.list(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.get(id),
    enabled: !!id,
  });
}
