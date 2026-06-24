import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../services/audit';

export function useAuditLogs(params?: { action?: string; resourceType?: string; actorId?: string; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => auditService.list(params),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit', id],
    queryFn: () => auditService.get(id),
    enabled: !!id,
  });
}
