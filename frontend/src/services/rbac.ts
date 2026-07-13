import apiClient from './api-client';

export const rbacService = {
  getRoles: () => apiClient.get('/rbac/roles'),
  getPermissions: () => apiClient.get('/rbac/permissions'),
  getUserRoles: (userId: string) => apiClient.get(`/rbac/users/${userId}/roles`),
  getAllUserRoles: () => apiClient.get('/rbac/user-roles'),
  assignRole: (userId: string, roleId: string, scopeType: string, scopeId?: string) =>
    apiClient.post('/rbac/user-roles', { userId, roleId, scopeType, scopeId }),
  removeRole: (userRoleId: string) => apiClient.delete(`/rbac/user-roles/${userRoleId}`),
  getWorkflowStages: () => apiClient.get('/rbac/workflow-stages'),

  getDepartments: () => apiClient.get('/rbac/departments'),
  createDepartment: (data: { code: string; name: string; description?: string; isActive?: boolean; unitType?: string }) =>
    apiClient.post('/rbac/departments', data),
  updateDepartment: (id: string, data: Partial<{ code: string; name: string; description: string; isActive: boolean }>) =>
    apiClient.put(`/rbac/departments/${id}`, data),
  deleteDepartment: (id: string) => apiClient.delete(`/rbac/departments/${id}`),

  createRole: (data: { name: string; description?: string }) => apiClient.post('/rbac/roles', data),
  updateRole: (id: string, data: Partial<{ name: string; description: string }>) =>
    apiClient.put(`/rbac/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete(`/rbac/roles/${id}`),
  setRolePermissions: (
    roleId: string,
    permissions: { permissionId: string; scopeType?: string; scopeId?: string; accessLevel?: string }[],
  ) => apiClient.put(`/rbac/roles/${roleId}/permissions`, { permissions }),

  createPermission: (data: { code: string; name: string; module: string; description?: string }) =>
    apiClient.post('/rbac/permissions', data),
  updatePermission: (id: string, data: Partial<{ code: string; name: string; module: string; description: string }>) =>
    apiClient.put(`/rbac/permissions/${id}`, data),
  deletePermission: (id: string) => apiClient.delete(`/rbac/permissions/${id}`),

  createStage: (data: { code: string; name: string; module: string; sequence: number; ownerDepartmentCode: string; prevDepartmentCode?: string | null }) =>
    apiClient.post('/rbac/workflow-stages', data),
  updateStage: (id: string, data: Partial<{ code: string; name: string; module: string; sequence: number; ownerDepartmentCode: string; prevDepartmentCode: string | null }>) =>
    apiClient.put(`/rbac/workflow-stages/${id}`, data),
  deleteStage: (id: string) => apiClient.delete(`/rbac/workflow-stages/${id}`),
};
