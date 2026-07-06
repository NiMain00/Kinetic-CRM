import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/users';
import type { User } from '@/types/domain/users';

export function useUsers(params?: { role?: string; status?: string; branch?: string }) {
  return useQuery<User[]>({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await userService.list(params);
      return res.data.data;
    },
  });
}

export function useUser(id: string | undefined) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const res = await userService.get(id!);
      return res.data.data;
    },
    enabled: !!id,
  });
}
