import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SlaConfig,
  KpiTarget,
  WorkflowDefinition,
  Connector,
  UploadConfig,
  OrgUnit,
  ProjectPhase,
} from '@/types/domain/config';
import { DEFAULT_PROJECT_PHASES } from '@/utils/constants';
import { configService } from '@/services/config';

type ConfigEntityType = 'slaConfigs' | 'kpiTargets' | 'workflows' | 'connectors' | 'orgUnits' | 'projectPhases';

interface ConfigState {
  slaConfigs: SlaConfig[];
  kpiTargets: KpiTarget[];
  workflows: WorkflowDefinition[];
  connectors: Connector[];
  uploadConfig: UploadConfig;
  orgUnits: OrgUnit[];
  projectPhases: ProjectPhase[];

  getConfigData: <T>(entity: ConfigEntityType) => T[];
  addConfigData: <T extends Record<string, any> = Record<string, any>>(entity: ConfigEntityType, item: T) => Promise<void>;
  updateConfigData: <T extends Record<string, any> = Record<string, any>>(entity: ConfigEntityType, id: string, data: Partial<T>) => Promise<void>;
  deleteConfigData: (entity: ConfigEntityType, id: string) => Promise<void>;
  setConfigData: <T>(entity: ConfigEntityType, data: T[]) => void;

  updateUploadConfig: (config: Partial<UploadConfig>) => Promise<void>;

  fetchSlaConfigs: () => Promise<void>;
  fetchKpiTargets: () => Promise<void>;
  fetchConnectors: () => Promise<void>;
  fetchOrgUnits: () => Promise<void>;
  fetchProjectPhases: () => Promise<void>;
  fetchWorkflows: () => Promise<void>;
  fetchUploadConfig: () => Promise<void>;
}

const stripId = (item: Record<string, any>) => {
  const { id, ...rest } = item;
  return rest;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      slaConfigs: [],
      kpiTargets: [],
      workflows: [],
      connectors: [],
      uploadConfig: {
        maxFileSizeMb: 10,
        allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'],
        storagePath: '/uploads/documents/',
        maxFilesPerUpload: 5,
        enableCompression: true,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      },
      orgUnits: [],
      projectPhases: DEFAULT_PROJECT_PHASES,

      getConfigData: <T>(entity: ConfigEntityType) => get()[entity] as unknown as T[],

      addConfigData: async (entity, item) => {
        try {
          const payload = stripId(item);
          switch (entity) {
            case 'slaConfigs':
              await configService.createSlaPolicy(payload);
              await get().fetchSlaConfigs();
              break;
            case 'kpiTargets':
              await configService.createKpiTarget(payload);
              await get().fetchKpiTargets();
              break;
            case 'connectors':
              await configService.createConnector(payload);
              await get().fetchConnectors();
              break;
            case 'orgUnits':
              await configService.createOrgUnit(payload);
              await get().fetchOrgUnits();
              break;
            case 'projectPhases':
              await configService.createProjectPhase(payload);
              await get().fetchProjectPhases();
              break;
            case 'workflows':
              await configService.saveWorkflow(payload.entityType, payload.steps || []);
              await get().fetchWorkflows();
              break;
            default:
              set((s) => {
                const arr = s[entity];
                if (Array.isArray(arr)) return { [entity]: [...arr, item] } as any;
                return {};
              });
          }
        } catch (err) {
          console.error(`[configStore] addConfigData(${entity}) failed:`, err);
          throw err;
        }
      },

      updateConfigData: async (entity, id, data) => {
        try {
          switch (entity) {
            case 'slaConfigs':
              await configService.updateSlaPolicy(id, data);
              await get().fetchSlaConfigs();
              break;
            case 'kpiTargets':
              await configService.updateKpiTarget(id, data);
              await get().fetchKpiTargets();
              break;
            case 'connectors':
              await configService.updateConnector(id, data);
              await get().fetchConnectors();
              break;
            case 'orgUnits':
              await configService.updateOrgUnit(id, data);
              await get().fetchOrgUnits();
              break;
            case 'projectPhases':
              await configService.updateProjectPhase(id, data);
              await get().fetchProjectPhases();
              break;
            case 'workflows':
              await configService.saveWorkflow((data as any).entityType || id, (data as any).steps || []);
              await get().fetchWorkflows();
              break;
          }
        } catch (err) {
          console.error(`[configStore] updateConfigData(${entity}) failed:`, err);
          throw err;
        }
      },

      deleteConfigData: async (entity, id) => {
        try {
          switch (entity) {
            case 'slaConfigs':
              await configService.deleteSlaPolicy(id);
              await get().fetchSlaConfigs();
              break;
            case 'kpiTargets':
              await configService.deleteKpiTarget(id);
              await get().fetchKpiTargets();
              break;
            case 'connectors':
              await configService.deleteConnector(id);
              await get().fetchConnectors();
              break;
            case 'orgUnits':
              await configService.deleteOrgUnit(id);
              await get().fetchOrgUnits();
              break;
            case 'projectPhases':
              await configService.deleteProjectPhase(id);
              await get().fetchProjectPhases();
              break;
          }
        } catch (err) {
          console.error(`[configStore] deleteConfigData(${entity}) failed:`, err);
          throw err;
        }
      },

      setConfigData: <T>(entity: ConfigEntityType, data: T[]) =>
        set({ [entity]: data } as any),

      updateUploadConfig: async (config) => {
        try {
          await configService.updateUploadConfig(config);
          await get().fetchUploadConfig();
        } catch (err) {
          console.error('[configStore] updateUploadConfig failed:', err);
          throw err;
        }
      },

      fetchSlaConfigs: async () => {
        try {
          const res = await configService.listSlaPolicies();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            slaConfigs: (data || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              entityType: c.entityType,
              warningThreshold: c.warningThreshold,
              criticalThreshold: c.criticalThreshold,
              unit: c.unit,
              escalationRole: c.escalationRole,
              active: c.active ?? true,
            })),
          });
        } catch (err) {
          console.error('[configStore] fetchSlaConfigs failed:', err);
        }
      },

      fetchKpiTargets: async () => {
        try {
          const res = await configService.listKpiTargets();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            kpiTargets: (data || []).map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              targetValue: t.targetValue,
              actualValue: t.actualValue ?? 0,
              unit: t.unit,
              period: t.period,
              description: t.description,
            })),
          });
        } catch (err) {
          console.error('[configStore] fetchKpiTargets failed:', err);
        }
      },

      fetchConnectors: async () => {
        try {
          const res = await configService.listConnectors();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            connectors: (data || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              type: (c.type === 'Cloud_Storage' ? 'Cloud Storage' : c.type) as Connector['type'],
              description: c.description,
              status: c.status,
              active: c.active ?? true,
              lastTested: c.lastTested,
              configJson: c.configJson,
            })),
          });
        } catch (err) {
          console.error('[configStore] fetchConnectors failed:', err);
        }
      },

      fetchOrgUnits: async () => {
        try {
          const res = await configService.listOrgUnits();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            orgUnits: (data || []).map((u: any) => ({
              id: u.id,
              name: u.name,
              code: u.code,
              parentId: u.parentId,
              unitType: u.unitType,
              city: u.city,
              province: u.province,
              address: u.address,
              phone: u.phone,
              isActive: u.isActive ?? true,
              sortOrder: u.sortOrder ?? 0,
            })),
          });
        } catch (err) {
          console.error('[configStore] fetchOrgUnits failed:', err);
        }
      },

      fetchProjectPhases: async () => {
        try {
          const res = await configService.listProjectPhases();
          const data = (res.data?.data ?? res.data) as any[];
          set({
            projectPhases: (data || []).map((p: any) => ({
              id: p.id,
              status: p.status,
              phase: p.phase,
              order: p.order ?? 0,
              isActive: p.isActive ?? true,
            })),
          });
        } catch (err) {
          console.error('[configStore] fetchProjectPhases failed:', err);
        }
      },

      fetchWorkflows: async () => {
        try {
          const res = await configService.listWorkflows();
          const data = (res.data?.data ?? res.data) as any[];
          set({ workflows: (data || []) as WorkflowDefinition[] });
        } catch (err) {
          console.error('[configStore] fetchWorkflows failed:', err);
        }
      },

      fetchUploadConfig: async () => {
        try {
          const res = await configService.getUploadConfig();
          const data = (res.data?.data ?? res.data) as any;
          if (data) {
            set({
              uploadConfig: {
                id: data.id,
                maxFileSizeMb: data.maxFileSizeMb,
                allowedExtensions: Array.isArray(data.allowedExtensions) ? data.allowedExtensions : [],
                storagePath: data.storagePath,
                maxFilesPerUpload: data.maxFilesPerUpload,
                enableCompression: data.enableCompression,
                allowedMimeTypes: Array.isArray(data.allowedMimeTypes) ? data.allowedMimeTypes : [],
              },
            });
          }
        } catch (err) {
          console.error('[configStore] fetchUploadConfig failed:', err);
        }
      },
    }),
    {
      name: 'kinetic-config',
      version: 6,
      partialize: (state) => ({
        slaConfigs: state.slaConfigs,
        kpiTargets: state.kpiTargets,
        workflows: state.workflows,
        connectors: state.connectors,
        uploadConfig: state.uploadConfig,
        orgUnits: state.orgUnits,
        projectPhases: state.projectPhases,
      }),
      migrate: (persistedState: any, version: number) => {
        let current = persistedState || {};
        if (!current.projectPhases || current.projectPhases.length === 0) {
          current = { ...current, projectPhases: DEFAULT_PROJECT_PHASES };
        }
        return current;
      },
    },
  ),
);
