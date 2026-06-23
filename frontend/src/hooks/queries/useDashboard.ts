import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard';

export function useDashboard(period?: { periodMonth?: number; periodYear?: number }) {
  return useQuery({
    queryKey: ['dashboard', 'summary', period],
    queryFn: () => dashboardService.getSummary(period),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['dashboard', 'approvals-pending'],
    queryFn: () => dashboardService.getPendingApprovals(),
  });
}

export function useApproachingDeadline() {
  return useQuery({
    queryKey: ['dashboard', 'approaching-deadline'],
    queryFn: () => dashboardService.getApproachingDeadline(),
  });
}
