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
};
