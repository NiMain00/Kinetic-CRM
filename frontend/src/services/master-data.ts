import apiClient from './api-client';

export const masterDataService = {
  customers: () => apiClient.get('/master-data/customers'),
  branches: () => apiClient.get('/master-data/branches'),
  projectCategories: () => apiClient.get('/master-data/project-categories'),
  projectStatuses: () => apiClient.get('/master-data/project-statuses'),
};
