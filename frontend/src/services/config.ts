import { useMasterDataStore } from '@/stores/masterDataStore';
import { useConfigStore } from '@/stores/configStore';

/**
 * Config service — abstraction layer over Zustand stores.
 * Swap implementation to API calls when backend is available.
 */
export const configService = {
  // === From masterDataStore ===
  getProjectStatuses: () => useMasterDataStore.getState().projectStatuses,
  getMasterRoles: () => useMasterDataStore.getState().roles,
  getNotifTemplates: () => useMasterDataStore.getState().notifTemplates,
  getQuestionTypes: () => useMasterDataStore.getState().questionTypes,
  getPeriods: () => useMasterDataStore.getState().periods,
  getDepartments: () => useMasterDataStore.getState().departments,

  // === From configStore ===
  getSlaConfigs: () => useConfigStore.getState().slaConfigs,
  getKpiTargets: () => useConfigStore.getState().kpiTargets,
  getWorkflows: () => useConfigStore.getState().workflows,
  getConnectors: () => useConfigStore.getState().connectors,
  getUploadConfig: () => useConfigStore.getState().uploadConfig,
  getOrgUnits: () => useConfigStore.getState().orgUnits,
};
