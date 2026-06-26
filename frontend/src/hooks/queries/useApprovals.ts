import { useQuery } from '@tanstack/react-query';
import { approvalService } from '@/services/approvals';
import type { ApprovalItem } from '@/types/domain';

export function useApprovals(params?: { type?: string; status?: string }) {
  return useQuery<ApprovalItem[]>({
    queryKey: ['approvals', params],
    queryFn: async () => {
      const res = await approvalService.list(params);
      return res.data.data;
    },
  });
}
