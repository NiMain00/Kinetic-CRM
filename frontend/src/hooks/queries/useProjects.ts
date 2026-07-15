import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projects';
import { unwrap } from '@/services/api-client';
import type { Project } from '@/types/domain';

export function useProjects(params?: Record<string, unknown>) {
  return useQuery<Project[]>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await projectService.list(params);
      return unwrap<Project[]>(res);
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await projectService.get(id!);
      return unwrap<Project>(res);
    },
    enabled: !!id,
  });
}
