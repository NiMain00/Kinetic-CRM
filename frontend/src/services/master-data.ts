import apiClient from './api-client';

export const masterDataService = {
  customers: () => apiClient.get('/master-data/customers'),
  branches: () => apiClient.get('/master-data/branches'),
  projectCategories: () => apiClient.get('/master-data/project-categories'),
  projectStatuses: () => apiClient.get('/master-data/project-statuses'),
  competitors: () => apiClient.get('/master-data/competitors'),
  competitor: (id: string) => apiClient.get(`/master-data/competitors/${id}`),
  documentTypes: () => apiClient.get('/master-data/document-types'),
  questionTypes: () => apiClient.get('/master-data/question-types'),
  questions: (context?: string) => apiClient.get('/master-data/questions', { params: { context } }),
  holidays: () => apiClient.get('/master-data/holidays'),
  lossReasons: () => apiClient.get('/master-data/loss-reasons'),
  periods: () => apiClient.get('/master-data/periods'),
  departments: () => apiClient.get('/master-data/departments'),
  divisions: () => apiClient.get('/master-data/divisions'),
  positions: () => apiClient.get('/master-data/positions'),
};
