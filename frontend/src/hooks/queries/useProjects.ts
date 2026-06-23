import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/projects';
import { rksService } from '../../services/rks';
import { lphsSiosService } from '../../services/lphs-sios';

export function useProjects(filters?: unknown) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.list(filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });
}

export function useRksByProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'rks'],
    queryFn: () => rksService.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useLphsSiosByProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'lphs-sios'],
    queryFn: () => lphsSiosService.getByProject(projectId),
    enabled: !!projectId,
  });
}
