import { useQuery } from '@tanstack/react-query';
import { approvalService } from '../../services/approvals';

export function useApprovals(filters?: { status?: string; resourceType?: string; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: () => approvalService.list(filters),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: ['approvals', id],
    queryFn: () => approvalService.get(id),
    enabled: !!id,
  });
}
