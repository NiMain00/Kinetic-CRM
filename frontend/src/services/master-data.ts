import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';
import type { Customer } from '@/types/domain';

export interface MasterDataEntity {
  id: string;
  name: string;
  code?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export const masterDataService = {
  customers: {
    list: (params?: { page?: number; search?: string; type?: string }) =>
      apiClient.get<ApiResponse<Customer[]>>('/master/customers', { params }),
    get: (id: string) => apiClient.get<ApiResponse<Customer>>(`/master/customers/${id}`),
    create: (data: Partial<Customer>) => apiClient.post<ApiResponse<Customer>>('/master/customers', data),
    update: (id: string, data: Partial<Customer>) => apiClient.put<ApiResponse<Customer>>(`/master/customers/${id}`, data),
    delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/master/customers/${id}`),
  },
  get: (entity: string, params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<MasterDataEntity[]>>(`/master/${entity}`, { params }),
  getById: (entity: string, id: string) =>
    apiClient.get<ApiResponse<MasterDataEntity>>(`/master/${entity}/${id}`),
  create: (entity: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<MasterDataEntity>>(`/master/${entity}`, data),
  update: (entity: string, id: string, data: Record<string, unknown>) =>
    apiClient.put<ApiResponse<MasterDataEntity>>(`/master/${entity}/${id}`, data),
  delete: (entity: string, id: string) =>
    apiClient.delete<ApiResponse<void>>(`/master/${entity}/${id}`),
};
