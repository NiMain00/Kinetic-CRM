import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prospectService } from '@/services/prospects';

export function useCreateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => prospectService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });
}

export function useUpdateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      prospectService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prospectService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });
}
