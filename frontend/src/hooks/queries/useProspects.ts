import { useQuery } from '@tanstack/react-query';
import { prospectService } from '../../services/prospects';

export function useProspects(filters?: unknown) {
  return useQuery({
    queryKey: ['prospects', filters],
    queryFn: () => prospectService.list(filters),
  });
}

export function useProspect(id: string) {
  return useQuery({
    queryKey: ['prospects', id],
    queryFn: () => prospectService.get(id),
    enabled: !!id,
  });
}
