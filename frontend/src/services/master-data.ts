import apiClient from './api-client';

function createMasterCrud(resource: string) {
  return {
    list: (params?: unknown) => apiClient.get(`/master/${resource}`, { params }),
    get: (id: string) => apiClient.get(`/master/${resource}/${id}`),
    create: (data: unknown) => apiClient.post(`/master/${resource}`, data),
    update: (id: string, data: unknown) => apiClient.patch(`/master/${resource}/${id}`, data),
    delete: (id: string) => apiClient.delete(`/master/${resource}/${id}`),
  };
}

export const masterDataService = {
  customers: createMasterCrud('customers'),
  industries: createMasterCrud('industries'),
  categories: createMasterCrud('categories'),
  competitors: createMasterCrud('competitors'),
  statuses: createMasterCrud('statuses'),
  docTypes: createMasterCrud('document-types'),
  questions: createMasterCrud('questions'),
  questionTypes: createMasterCrud('question-types'),
  periods: createMasterCrud('periods'),
  holidays: createMasterCrud('holidays'),
  lossReasons: createMasterCrud('loss-reasons'),
  approvalLevels: createMasterCrud('approval-levels'),
  departments: createMasterCrud('departments'),
  companies: createMasterCrud('companies'),
  branches: createMasterCrud('branches'),
};
