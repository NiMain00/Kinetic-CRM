import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prospectService } from '../../services/prospects';

export function useProspectMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: unknown) => prospectService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => prospectService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => prospectService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospects'] }),
  });

  return { create, update, remove };
}
