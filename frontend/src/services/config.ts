import apiClient from './api-client';

export const configService = {
  // SLA Policies
  listSlaPolicies: () => apiClient.get('/config/sla-policies'),
  createSlaPolicy: (data: any) => apiClient.post('/config/sla-policies', data),
  updateSlaPolicy: (id: string, data: any) => apiClient.put(`/config/sla-policies/${id}`, data),
  deleteSlaPolicy: (id: string) => apiClient.delete(`/config/sla-policies/${id}`),

  // KPI Targets
  listKpiTargets: () => apiClient.get('/config/kpi-targets'),
  createKpiTarget: (data: any) => apiClient.post('/config/kpi-targets', data),
  updateKpiTarget: (id: string, data: any) => apiClient.put(`/config/kpi-targets/${id}`, data),
  deleteKpiTarget: (id: string) => apiClient.delete(`/config/kpi-targets/${id}`),

  // Connectors
  listConnectors: () => apiClient.get('/config/connectors'),
  createConnector: (data: any) => apiClient.post('/config/connectors', data),
  updateConnector: (id: string, data: any) => apiClient.put(`/config/connectors/${id}`, data),
  deleteConnector: (id: string) => apiClient.delete(`/config/connectors/${id}`),

  // Org Units
  listOrgUnits: () => apiClient.get('/config/org-units'),
  createOrgUnit: (data: any) => apiClient.post('/config/org-units', data),
  updateOrgUnit: (id: string, data: any) => apiClient.put(`/config/org-units/${id}`, data),
  deleteOrgUnit: (id: string) => apiClient.delete(`/config/org-units/${id}`),

  // Project Phases
  listProjectPhases: () => apiClient.get('/config/project-phases'),
  createProjectPhase: (data: any) => apiClient.post('/config/project-phases', data),
  updateProjectPhase: (id: string, data: any) => apiClient.put(`/config/project-phases/${id}`, data),
  deleteProjectPhase: (id: string) => apiClient.delete(`/config/project-phases/${id}`),

  // Workflows
  listWorkflows: () => apiClient.get('/config/workflows'),
  saveWorkflow: (entityType: string, steps: any[]) =>
    apiClient.put(`/config/workflows/${entityType}`, { steps }),

  // Upload Config
  getUploadConfig: () => apiClient.get('/config/upload'),
  updateUploadConfig: (data: any) => apiClient.put('/config/upload', data),
};
