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

type ConfigEntityType = 'slaConfigs' | 'kpiTargets' | 'workflows' | 'connectors' | 'orgUnits';

interface ConfigState {
  slaConfigs: SlaConfig[];
  kpiTargets: KpiTarget[];
  workflows: WorkflowDefinition[];
  connectors: Connector[];
  uploadConfig: UploadConfig;
  orgUnits: OrgUnit[];
  projectPhases: ProjectPhase[];

  getConfigData: <T>(entity: ConfigEntityType) => T[];
  addConfigData: <T extends Record<string, any> = Record<string, any>>(entity: ConfigEntityType, item: T) => void;
  updateConfigData: <T extends Record<string, any> = Record<string, any>>(entity: ConfigEntityType, id: string, data: Partial<T>) => void;
  deleteConfigData: (entity: ConfigEntityType, id: string) => void;
  setConfigData: <T>(entity: ConfigEntityType, data: T[]) => void;

  updateUploadConfig: (config: Partial<UploadConfig>) => void;
}

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

      addConfigData: <T>(entity: ConfigEntityType, item: T) =>
        set((s) => {
          const arr = s[entity];
          if (Array.isArray(arr)) {
            return { [entity]: [...arr, item] } as any;
          }
          return {};
        }),

      updateConfigData: <T extends { id: string }>(entity: ConfigEntityType, id: string, data: Partial<T>) =>
        set((s) => {
          const arr = s[entity];
          if (!Array.isArray(arr)) return {};
          return {
            [entity]: arr.map((item: any) =>
              item.id === id ? { ...item, ...data } : item
            ),
          } as any;
        }),

      deleteConfigData: (entity: ConfigEntityType, id: string) =>
        set((s) => {
          const arr = s[entity];
          if (!Array.isArray(arr)) return {};
          return {
            [entity]: arr.filter((item: any) => item.id !== id),
          } as any;
        }),

      setConfigData: <T>(entity: ConfigEntityType, data: T[]) =>
        set({ [entity]: data } as any),

      updateUploadConfig: (config: Partial<UploadConfig>) =>
        set((s) => ({ uploadConfig: { ...s.uploadConfig, ...config } })),
    }),
    {
      name: 'kinetic-config',
      version: 5,
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
