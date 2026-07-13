import apiClient from './api-client';

export const inputConfigService = {
  createOption: (data: {
    groupId: string;
    value: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
    colorHex?: string;
  }) => apiClient.post('/master/inputConfigOptions', data),

  updateOption: (id: string, data: {
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
    colorHex?: string;
  }) => apiClient.put(`/master/inputConfigOptions/${id}`, data),

  deleteOption: (id: string) => apiClient.delete(`/master/inputConfigOptions/${id}`),
};
