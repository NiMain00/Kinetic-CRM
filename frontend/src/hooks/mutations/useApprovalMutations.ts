import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '../../services/approvals';

export function useApprovalMutations() {
  const queryClient = useQueryClient();

  const decide = useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: 'approved' | 'rejected'; comment?: string }) =>
      approvalService.decide(id, { decision, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const reassign = useMutation({
    mutationFn: ({ id, newAssigneeUserId, reason }: { id: string; newAssigneeUserId: string; reason: string }) =>
      approvalService.reassign(id, { newAssigneeUserId, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });

  return { decide, reassign };
}
