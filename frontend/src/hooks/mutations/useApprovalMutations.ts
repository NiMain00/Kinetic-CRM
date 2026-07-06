import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '@/services/approvals';

export function useApproveApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approvalService.approve(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });
}

export function useRejectApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approvalService.reject(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });
}
