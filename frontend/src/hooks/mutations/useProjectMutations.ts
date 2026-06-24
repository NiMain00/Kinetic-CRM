import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/projects';
import { rksService } from '../../services/rks';
import { lphsSiosService } from '../../services/lphs-sios';

export function useProjectMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: unknown) => projectService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => projectService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const rksCreate = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { content: string; attachmentIds?: string[] } }) =>
      rksService.create(projectId, data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'rks'] }),
  });

  const rksSubmit = useMutation({
    mutationFn: (id: string) => rksService.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const rksApprove = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rksService.approve(id, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const rksReject = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => rksService.reject(id, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const lphsCreate = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { departmentIds: string[]; attachmentIds?: string[] } }) =>
      lphsSiosService.create(projectId, data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'lphs-sios'] }),
  });

  const lphsSubmit = useMutation({
    mutationFn: (id: string) => lphsSiosService.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const lphsDepartmentApprove = useMutation({
    mutationFn: ({ id, deptId, comment }: { id: string; deptId: string; comment?: string }) =>
      lphsSiosService.departmentApprove(id, deptId, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const lphsDepartmentReject = useMutation({
    mutationFn: ({ id, deptId, comment }: { id: string; deptId: string; comment: string }) =>
      lphsSiosService.departmentReject(id, deptId, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const lphsPmApprove = useMutation({
    mutationFn: (id: string) => lphsSiosService.pmApprove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['projects', id] });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['projects'] }), 200);
    },
  });

  return {
    create, update, remove,
    rksCreate, rksSubmit, rksApprove, rksReject,
    lphsCreate, lphsSubmit, lphsDepartmentApprove, lphsDepartmentReject, lphsPmApprove,
  };
}
