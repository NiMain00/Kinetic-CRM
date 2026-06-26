import { useMemo } from 'react';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useConfigStore } from '@/stores/configStore';
import { configService } from '@/services/config';

/** Wraps configService selectors as React hooks. */

export function useProjectStatuses() {
  return useMasterDataStore((s) => s.projectStatuses);
}

export function useMasterRoles() {
  return useMasterDataStore((s) => s.roles);
}

export function useNotifTemplates() {
  return useMasterDataStore((s) => s.notifTemplates);
}

export function useMasterQuestionTypes() {
  return useMasterDataStore((s) => s.questionTypes);
}

export function useMasterPeriods() {
  return useMasterDataStore((s) => s.periods);
}

export function useSlaConfigs() {
  return useConfigStore((s) => s.slaConfigs);
}

export function useKpiTargets() {
  return useConfigStore((s) => s.kpiTargets);
}

export function useWorkflows() {
  return useConfigStore((s) => s.workflows);
}

export function useConnectors() {
  return useConfigStore((s) => s.connectors);
}

export function useUploadConfig() {
  return useConfigStore((s) => s.uploadConfig);
}

export function useOrgUnits() {
  return useConfigStore((s) => s.orgUnits);
}
