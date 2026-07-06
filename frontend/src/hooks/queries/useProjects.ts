import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projects';
import type { Project } from '@/types/domain';

export function useProjects(params?: Record<string, unknown>) {
  return useQuery<Project[]>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await projectService.list(params);
      return res.data.data;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await projectService.get(id!);
      return res.data.data;
    },
    enabled: !!id,
  });
}
