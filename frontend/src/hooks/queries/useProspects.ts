import { useQuery } from '@tanstack/react-query';
import { prospectService } from '@/services/prospects';
import { unwrap } from '@/services/api-client';
import type { Prospect } from '@/types/domain';

export function useProspects(params?: Record<string, unknown>) {
  return useQuery<Prospect[]>({
    queryKey: ['prospects', params],
    queryFn: async () => {
      const res = await prospectService.list(params);
      return unwrap<Prospect[]>(res);
    },
  });
}

export function useProspect(id: string | undefined) {
  return useQuery<Prospect>({
    queryKey: ['prospects', id],
    queryFn: async () => {
      const res = await prospectService.get(id!);
      return unwrap<Prospect>(res);
    },
    enabled: !!id,
  });
}
