import { useMemo } from 'react';
import { useMasterDataStore, type MasterRole, type MasterProjectStatus, type MasterQuestionType, type MasterPeriod, type MasterNotifTemplate } from '@/stores/masterDataStore';
import { useConfigStore } from '@/stores/configStore';
import type {
  OrgUnit,
  SlaConfig,
  KpiTarget,
  WorkflowDefinition,
  Connector,
  UploadConfig,
  ProjectPhase,
} from '@/types/domain/config';

// ── READ from masterDataStore ──

export function useProjectStatuses() {
  return useMasterDataStore((s) => s.projectStatuses);
}

export function useStatusByCode(code: string): MasterProjectStatus | undefined {
  const statuses = useMasterDataStore((s) => s.projectStatuses);
  return useMemo(
    () => statuses.find((s) => s.code === code),
    [statuses, code],
  );
}

export function useMasterRoles(): MasterRole[] {
  return useMasterDataStore((s) => s.roles);
}

export function useAppRoles(): MasterRole[] {
  return useMasterDataStore((s) => s.roles);
}

export function useNotifTemplates() {
  return useMasterDataStore((s) => s.notifTemplates);
}

export function useMasterQuestionTypes() {
  return useMasterDataStore((s) => s.questionTypes);
}

export function useQuestionTypes(): MasterQuestionType[] {
  return useMasterDataStore((s) => s.questionTypes);
}

export function useMasterPeriods() {
  return useMasterDataStore((s) => s.periods);
}

export function useFiscalPeriods(): MasterPeriod[] {
  return useMasterDataStore((s) => s.periods);
}

export function useMasterDepartments() {
  return useMasterDataStore((s) => s.departments);
}

export function useRolePermissions(roleName: string): string[] {
  const roles = useMasterDataStore((s) => s.roles);
  return useMemo(() => {
    const role = roles.find((r) => r.name === roleName);
    return role?.permissions ?? [];
  }, [roles, roleName]);
}

// ── READ from configStore ──

export function useSlaConfigs(): SlaConfig[] {
  return useConfigStore((s) => s.slaConfigs);
}

export function useSlaRules(): SlaConfig[] {
  return useConfigStore((s) => s.slaConfigs);
}

export function useKpiTargets(): KpiTarget[] {
  return useConfigStore((s) => s.kpiTargets);
}

export function useWorkflows(): WorkflowDefinition[] {
  return useConfigStore((s) => s.workflows);
}

export function useWorkflowSteps(entityType: 'prospek' | 'rks' | 'lphs') {
  const workflows = useConfigStore((s) => s.workflows);
  return useMemo(
    () => workflows.find((w) => w.entityType === entityType)?.steps ?? [],
    [workflows, entityType],
  );
}

export function useConnectors(): Connector[] {
  return useConfigStore((s) => s.connectors);
}

export function useUploadConfig(): UploadConfig {
  return useConfigStore((s) => s.uploadConfig);
}

export function useUploadSettings(): UploadConfig {
  return useConfigStore((s) => s.uploadConfig);
}

export function useOrgUnits(): OrgUnit[] {
  return useConfigStore((s) => s.orgUnits);
}

export function useOrgUnitById(id: string | undefined | null): OrgUnit | undefined {
  const orgUnits = useConfigStore((s) => s.orgUnits);
  return useMemo(
    () => orgUnits.find((u) => u.id === id),
    [orgUnits, id],
  );
}

export function useActiveOrgUnits(): OrgUnit[] {
  const orgUnits = useConfigStore((s) => s.orgUnits);
  return useMemo(() => orgUnits.filter((u) => u.isActive), [orgUnits]);
}

export function useOrgBranches(): OrgUnit[] {
  const orgUnits = useConfigStore((s) => s.orgUnits);
  return useMemo(
    () => orgUnits.filter((u) => u.unitType === 'branch' && u.isActive),
    [orgUnits],
  );
}

export function useOrgDepartments(): OrgUnit[] {
  const orgUnits = useConfigStore((s) => s.orgUnits);
  return useMemo(
    () => orgUnits.filter((u) => u.unitType === 'department' && u.isActive),
    [orgUnits],
  );
}

// ── Project Lifecycle Phases ──

export function useProjectPhases(): ProjectPhase[] {
  return useConfigStore((s) => s.projectPhases);
}

export function useStatusStepMap(): Record<string, string> {
  const phases = useConfigStore((s) => s.projectPhases);
  return useMemo(() => {
    const map: Record<string, string> = {};
    phases.forEach((p) => { map[p.status] = p.phase; });
    return map;
  }, [phases]);
}

export function useNextPhaseMap(): Record<string, { status: string; phase: string; progress: number }> {
  const phases = useConfigStore((s) => s.projectPhases);
  const active = useMemo(() => phases.filter((p) => p.isActive).sort((a, b) => a.order - b.order), [phases]);
  return useMemo(() => {
    const map: Record<string, { status: string; phase: string; progress: number }> = {};
    const total = active.length - 1;
    const pct = (i: number) => Math.round(((i + 1) / total) * 100);
    active.slice(0, -1).forEach((step, i) => {
      const next = active[i + 1];
      map[step.status] = { status: next.status, phase: next.phase, progress: pct(i) };
    });
    return map;
  }, [active]);
}

// ── Computed / Helper Selectors ──

export function useSlaForEntity(
  entityType: SlaConfig['entityType'],
): SlaConfig | undefined {
  const configs = useConfigStore((s) => s.slaConfigs);
  return useMemo(
    () => configs.find((c) => c.entityType === entityType && c.active),
    [configs, entityType],
  );
}

export function useActivePeriod() {
  const periods = useMasterDataStore((s) => s.periods);
  return useMemo(() => periods.find((p) => p.is_active), [periods]);
}

// ── Mutations ──

export function useConfigMutations() {
  const addConfigData = useConfigStore((s) => s.addConfigData);
  const updateConfigData = useConfigStore((s) => s.updateConfigData);
  const deleteConfigData = useConfigStore((s) => s.deleteConfigData);
  const setConfigData = useConfigStore((s) => s.setConfigData);
  const updateUploadConfig = useConfigStore((s) => s.updateUploadConfig);

  const masterAddData = useMasterDataStore((s) => s.addData);
  const masterUpdateData = useMasterDataStore((s) => s.updateData);
  const masterDeleteData = useMasterDataStore((s) => s.deleteData);

  return {
    // configStore mutations
    addSla: (item: SlaConfig) => addConfigData('slaConfigs', item),
    updateSla: (id: string, data: Partial<SlaConfig>) =>
      updateConfigData('slaConfigs', id, data),
    deleteSla: (id: string) => deleteConfigData('slaConfigs', id),
    toggleSla: (id: string) => {
      const target = useConfigStore.getState().slaConfigs.find((c) => c.id === id);
      if (target) updateConfigData('slaConfigs', id, { active: !target.active });
    },

    addTarget: (item: KpiTarget) => addConfigData('kpiTargets', item),
    updateTarget: (id: string, data: Partial<KpiTarget>) =>
      updateConfigData('kpiTargets', id, data),
    deleteTarget: (id: string) => deleteConfigData('kpiTargets', id),

    addConnector: (item: Connector) => addConfigData('connectors', item),
    updateConnector: (id: string, data: Partial<Connector>) =>
      updateConfigData('connectors', id, data),
    toggleConnector: (id: string) => {
      const target = useConfigStore.getState().connectors.find((c) => c.id === id);
      if (target) updateConfigData('connectors', id, { active: !target.active });
    },

    addOrgUnit: (item: OrgUnit) => addConfigData('orgUnits', item),
    updateOrgUnit: (id: string, data: Partial<OrgUnit>) =>
      updateConfigData('orgUnits', id, data),
    deleteOrgUnit: (id: string) => deleteConfigData('orgUnits', id),

    updateUploadConfig,

    // masterDataStore mutations
    updateProjectStatus: (id: string, data: Record<string, unknown>) =>
      masterUpdateData('projectStatuses', id, data),
    toggleProjectStatus: (id: string) => {
      const target = useMasterDataStore
        .getState()
        .projectStatuses.find((s) => s.id === id);
      if (target) masterUpdateData('projectStatuses', id, { is_active: !target.is_active });
    },
    addProjectStatus: (item: Record<string, unknown>) =>
      masterAddData('projectStatuses', item),

    updateRole: (id: string, data: Partial<MasterRole>) =>
      masterUpdateData('roles', id, data),

    addNotifTemplate: (item: Record<string, unknown>) =>
      masterAddData('notifTemplates', item),
    updateNotifTemplate: (id: string, data: Record<string, unknown>) =>
      masterUpdateData('notifTemplates', id, data),
    deleteNotifTemplate: (id: string) => masterDeleteData('notifTemplates', id),
    toggleNotifTemplate: (id: string) => {
      const target = useMasterDataStore
        .getState()
        .notifTemplates.find((t) => t.id === id);
      if (target) masterUpdateData('notifTemplates', id, { is_active: !target.is_active });
    },

    addPeriod: (item: Record<string, unknown>) => masterAddData('periods', item),
    updatePeriod: (id: string, data: Record<string, unknown>) =>
      masterUpdateData('periods', id, data),
    togglePeriod: (id: string) => {
      const periods = useMasterDataStore.getState().periods;
      const target = periods.find((p) => p.id === id);
      if (!target) return;
      const newActive = !target.is_active;
      masterUpdateData('periods', id, { is_active: newActive });
      if (newActive) {
        periods.forEach((p) => {
          if (p.id !== id && p.is_active) {
            masterUpdateData('periods', p.id, { is_active: false });
          }
        });
      }
    },

    addQuestionType: (item: Record<string, unknown>) =>
      masterAddData('questionTypes', item),
    updateQuestionType: (id: string, data: Record<string, unknown>) =>
      masterUpdateData('questionTypes', id, data),
    toggleQuestionType: (id: string) => {
      const target = useMasterDataStore
        .getState()
        .questionTypes.find((t) => t.id === id);
      if (target)
        masterUpdateData('questionTypes', id, { is_active: !target.is_active });
    },
  };
}
