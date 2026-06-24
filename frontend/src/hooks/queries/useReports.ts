import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reports';

export function useWinLoss(params?: { periodId?: string; branchId?: string; categoryId?: string }) {
  return useQuery({
    queryKey: ['reports', 'win-loss', params],
    queryFn: () => reportService.getWinLoss(params),
  });
}

export function usePipeline() {
  return useQuery({
    queryKey: ['reports', 'pipeline'],
    queryFn: () => reportService.getPipeline(),
  });
}

export function useProgressVsTarget() {
  return useQuery({
    queryKey: ['reports', 'progress-vs-target'],
    queryFn: () => reportService.getProgressVsTarget(),
  });
}
