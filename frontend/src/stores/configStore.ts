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

// ── Initial Data ──

const INITIAL_SLA: SlaConfig[] = [
  { id: 'SLA-001', name: 'Prospek Review SLA', entityType: 'prospek', warningThreshold: 24, criticalThreshold: 48, unit: 'hours', escalationRole: 'Branch Manager', active: true },
  { id: 'SLA-002', name: 'RKS Approval SLA', entityType: 'rks', warningThreshold: 48, criticalThreshold: 72, unit: 'hours', escalationRole: 'PM', active: true },
  { id: 'SLA-003', name: 'LPHS Review SLA', entityType: 'lphs', warningThreshold: 3, criticalThreshold: 5, unit: 'days', escalationRole: 'Dept Head', active: true },
  { id: 'SLA-004', name: 'General Approval SLA', entityType: 'approval', warningThreshold: 24, criticalThreshold: 48, unit: 'hours', escalationRole: 'Admin', active: false },
];

const INITIAL_TARGETS: KpiTarget[] = [
  { id: 'TGT-001', name: 'Win Rate', category: 'KPI', targetValue: 75, actualValue: 68.4, unit: '%', period: 'Q2 2026', description: 'Persentase prospek menjadi proyek' },
  { id: 'TGT-002', name: 'Revenue Target', category: 'KPI', targetValue: 50000000000, actualValue: 42800000000, unit: 'Rp', period: 'Q2 2026', description: 'Target pendapatan triwulan' },
  { id: 'TGT-003', name: 'Jumlah Proyek', category: 'KPI', targetValue: 25, actualValue: 18, unit: 'unit', period: 'Q2 2026', description: 'Jumlah proyek baru' },
  { id: 'TGT-004', name: 'Avg Margin', category: 'KPI', targetValue: 18, actualValue: 15.5, unit: '%', period: 'Q2 2026', description: 'Rata-rata margin proyek' },
  { id: 'TGT-005', name: 'SLA Compliance', category: 'KPI', targetValue: 95, actualValue: 92, unit: '%', period: 'Q2 2026', description: 'Kepatuhan terhadap SLA' },
  { id: 'TGT-006', name: 'Approval Time', category: 'Approval', targetValue: 24, actualValue: 36, unit: 'jam', period: 'Q2 2026', description: 'Waktu penyelesaian approval' },
  { id: 'TGT-007', name: 'Customer Satisfaction', category: 'KPI', targetValue: 4.5, actualValue: 4.2, unit: 'skor', period: 'Q2 2026', description: 'Skor kepuasan pelanggan' },
];

const INITIAL_WORKFLOWS: WorkflowDefinition[] = [
  {
    entityType: 'prospek',
    steps: [
      { id: 'P1', entityType: 'prospek', name: 'Registrasi Prospek', order: 1, description: 'Staff mencatat data prospek baru', assigneeRole: 'Staff', isRequired: true, isActive: true },
      { id: 'P2', entityType: 'prospek', name: 'Review Marketing', order: 2, description: 'Tim marketing memverifikasi prospek', assigneeRole: 'Marketing', isRequired: true, isActive: true },
      { id: 'P3', entityType: 'prospek', name: 'Penilaian Kualifikasi', order: 3, description: 'Penilaian kelayakan prospek', assigneeRole: 'Branch Manager', isRequired: true, isActive: true },
      { id: 'P4', entityType: 'prospek', name: 'Approval BM', order: 4, description: 'Persetujuan Branch Manager', assigneeRole: 'Branch Manager', isRequired: true, isActive: true },
      { id: 'P5', entityType: 'prospek', name: 'Konversi ke Proyek', order: 5, description: 'Prospek siap dikonversi', assigneeRole: 'PM', isRequired: true, isActive: true },
    ],
  },
  {
    entityType: 'rks',
    steps: [
      { id: 'R1', entityType: 'rks', name: 'Draft RKS', order: 1, description: 'Pembuatan dokumen RKS', assigneeRole: 'PM', isRequired: true, isActive: true },
      { id: 'R2', entityType: 'rks', name: 'Review RKS', order: 2, description: 'Review oleh Dept Head', assigneeRole: 'Dept Head', isRequired: true, isActive: true },
      { id: 'R3', entityType: 'rks', name: 'Approval RKS', order: 3, description: 'Persetujuan final RKS', assigneeRole: 'Branch Manager', isRequired: true, isActive: true },
      { id: 'R4', entityType: 'rks', name: 'Publikasi RKS', order: 4, description: 'RKS siap dipublikasikan', assigneeRole: 'Admin', isRequired: true, isActive: true },
    ],
  },
  {
    entityType: 'lphs',
    steps: [
      { id: 'L1', entityType: 'lphs', name: 'Draft LPHS', order: 1, description: 'Pembuatan LPHS oleh PM', assigneeRole: 'PM', isRequired: true, isActive: true },
      { id: 'L2', entityType: 'lphs', name: 'Review Teknis', order: 2, description: 'Review aspek teknis', assigneeRole: 'Dept Head', isRequired: true, isActive: true },
      { id: 'L3', entityType: 'lphs', name: 'Review Harga', order: 3, description: 'Review dan validasi harga', assigneeRole: 'Finance', isRequired: true, isActive: true },
      { id: 'L4', entityType: 'lphs', name: 'Approval LPHS', order: 4, description: 'Persetujuan final LPHS', assigneeRole: 'Direktur', isRequired: true, isActive: true },
      { id: 'L5', entityType: 'lphs', name: 'Finalisasi LPHS', order: 5, description: 'LPHS siap digunakan', assigneeRole: 'Admin', isRequired: true, isActive: true },
    ],
  },
];

const INITIAL_CONNECTORS: Connector[] = [
  { id: 'CONN-001', name: 'REST API Gateway', type: 'API', description: 'Integrasi REST API dengan sistem eksternal', status: 'connected', active: true, lastTested: '2026-06-22 08:15' },
  { id: 'CONN-002', name: 'Webhook Notifikasi', type: 'Webhook', description: 'Webhook untuk notifikasi ke pihak ketiga', status: 'connected', active: true, lastTested: '2026-06-22 07:30' },
  { id: 'CONN-003', name: 'SMTP Email Service', type: 'Email', description: 'Layanan pengiriman email notifikasi', status: 'connected', active: true, lastTested: '2026-06-21 16:45' },
  { id: 'CONN-004', name: 'Database Replication', type: 'Database', description: 'Replikasi data ke data warehouse', status: 'disconnected', active: false, lastTested: '2026-06-15 10:00' },
  { id: 'CONN-005', name: 'Google Cloud Storage', type: 'Cloud Storage', description: 'Penyimpanan dokumen di cloud', status: 'connected', active: true, lastTested: '2026-06-22 06:00' },
  { id: 'CONN-006', name: 'LDAP Authentication', type: 'LDAP', description: 'Autentikasi pengguna via LDAP/AD', status: 'error', active: false, lastTested: '2026-06-20 09:30' },
];

const INITIAL_PHASES: ProjectPhase[] = [
  { id: 'PH-01', status: 'Prospecting', phase: 'Overview', order: 1, isActive: true },
  { id: 'PH-02', status: 'RKS', phase: 'RKS', order: 2, isActive: true },
  { id: 'PH-03', status: 'Review RKS', phase: 'Review RKS', order: 3, isActive: true },
  { id: 'PH-04', status: 'LPHS/SIOS', phase: 'LPHS/SIOS', order: 4, isActive: true },
  { id: 'PH-05', status: 'Input Harga', phase: 'Harga', order: 5, isActive: true },
  { id: 'PH-06', status: 'Kompetitor', phase: 'Kompetitor', order: 6, isActive: true },
  { id: 'PH-07', status: 'Pemenang', phase: 'Pemenang', order: 7, isActive: true },
  { id: 'PH-08', status: 'Kalah', phase: 'Selesai', order: 8, isActive: true },
  { id: 'PH-09', status: 'Revisi', phase: 'Revisi', order: 9, isActive: true },
  { id: 'PH-10', status: 'Selesai', phase: 'Selesai', order: 10, isActive: true },
];

const INITIAL_UPLOAD: UploadConfig = {
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
};

const INITIAL_ORG: OrgUnit[] = [
  // Company
  { id: 'org-root', name: 'Kinetic Enterprise Group', code: 'CORP-01', parentId: null, unitType: 'company', isActive: true, sortOrder: 1 },

  // ── Branches (direct under company) ──
  { id: 'br-ho', name: 'Head Office', code: 'BR-HO-001', parentId: 'org-root', unitType: 'branch', city: 'Jakarta', province: 'DKI Jakarta', isActive: true, sortOrder: 10 },
  { id: 'br-jkt-pst', name: 'Jakarta Pusat', code: 'BR-JKT-001', parentId: 'org-root', unitType: 'branch', city: 'Jakarta Pusat', province: 'DKI Jakarta', isActive: true, sortOrder: 11 },
  { id: 'br-jkt-sel', name: 'Jakarta Selatan', code: 'BR-JKT-002', parentId: 'org-root', unitType: 'branch', city: 'Jakarta Selatan', province: 'DKI Jakarta', isActive: true, sortOrder: 12 },
  { id: 'br-sub', name: 'Surabaya', code: 'BR-SUB-003', parentId: 'org-root', unitType: 'branch', city: 'Surabaya', province: 'Jawa Timur', isActive: true, sortOrder: 13 },
  { id: 'br-bdg', name: 'Bandung', code: 'BR-BDG-004', parentId: 'org-root', unitType: 'branch', city: 'Bandung', province: 'Jawa Barat', isActive: true, sortOrder: 14 },
  { id: 'br-mdn', name: 'Medan', code: 'BR-MDN-005', parentId: 'org-root', unitType: 'branch', city: 'Medan', province: 'Sumatera Utara', isActive: true, sortOrder: 15 },
  { id: 'br-mks', name: 'Makassar', code: 'BR-MKS-006', parentId: 'org-root', unitType: 'branch', city: 'Makassar', province: 'Sulawesi Selatan', isActive: true, sortOrder: 16 },
  { id: 'br-bpn', name: 'Balikpapan', code: 'BR-BPN-007', parentId: 'org-root', unitType: 'branch', city: 'Balikpapan', province: 'Kalimantan Timur', isActive: true, sortOrder: 17 },

  // ── Head Office Departments ──
  { id: 'dept-ho-ops', name: 'Operations', code: 'DEPT-HO-OPS', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-ho-pmo', name: 'Project Management Office', code: 'DEPT-HO-PMO', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 21 },
  { id: 'dept-ho-it', name: 'IT', code: 'DEPT-HO-IT', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 22 },
  { id: 'dept-ho-qa', name: 'Quality Assurance', code: 'DEPT-HO-QA', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 23 },
  { id: 'dept-ho-fin', name: 'Finance', code: 'DEPT-HO-FIN', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 24 },
  { id: 'dept-ho-mkt', name: 'Marketing', code: 'DEPT-HO-MKT', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 25 },
  { id: 'dept-ho-hr', name: 'Human Resources', code: 'DEPT-HO-HR', parentId: 'br-ho', unitType: 'department', isActive: true, sortOrder: 26 },

  // ── Jakarta Pusat Departments ──
  { id: 'dept-jkt-ops', name: 'Operations', code: 'DEPT-JKT-OPS', parentId: 'br-jkt-pst', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-jkt-sales', name: 'Sales', code: 'DEPT-JKT-SALES', parentId: 'br-jkt-pst', unitType: 'department', isActive: true, sortOrder: 21 },
  { id: 'dept-jkt-finance', name: 'Finance', code: 'DEPT-JKT-FIN', parentId: 'br-jkt-pst', unitType: 'department', isActive: true, sortOrder: 22 },

  // ── Jakarta Selatan Departments ──
  { id: 'dept-js-ops', name: 'Operations', code: 'DEPT-JS-OPS', parentId: 'br-jkt-sel', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-js-sales', name: 'Sales', code: 'DEPT-JS-SALES', parentId: 'br-jkt-sel', unitType: 'department', isActive: true, sortOrder: 21 },

  // ── Surabaya Departments ──
  { id: 'dept-sub-ops', name: 'Operations', code: 'DEPT-SUB-OPS', parentId: 'br-sub', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-sub-sales', name: 'Sales', code: 'DEPT-SUB-SALES', parentId: 'br-sub', unitType: 'department', isActive: true, sortOrder: 21 },
  { id: 'dept-sub-finance', name: 'Finance', code: 'DEPT-SUB-FIN', parentId: 'br-sub', unitType: 'department', isActive: true, sortOrder: 22 },

  // ── Bandung Departments ──
  { id: 'dept-bdg-ops', name: 'Operations', code: 'DEPT-BDG-OPS', parentId: 'br-bdg', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-bdg-sales', name: 'Sales', code: 'DEPT-BDG-SALES', parentId: 'br-bdg', unitType: 'department', isActive: true, sortOrder: 21 },

  // ── Medan Departments ──
  { id: 'dept-mdn-ops', name: 'Operations', code: 'DEPT-MDN-OPS', parentId: 'br-mdn', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-mdn-sales', name: 'Sales', code: 'DEPT-MDN-SALES', parentId: 'br-mdn', unitType: 'department', isActive: true, sortOrder: 21 },

  // ── Makassar Departments ──
  { id: 'dept-mks-ops', name: 'Operations', code: 'DEPT-MKS-OPS', parentId: 'br-mks', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-mks-sales', name: 'Sales', code: 'DEPT-MKS-SALES', parentId: 'br-mks', unitType: 'department', isActive: true, sortOrder: 21 },

  // ── Balikpapan Departments ──
  { id: 'dept-bpn-ops', name: 'Operations', code: 'DEPT-BPN-OPS', parentId: 'br-bpn', unitType: 'department', isActive: true, sortOrder: 20 },
  { id: 'dept-bpn-sales', name: 'Sales', code: 'DEPT-BPN-SALES', parentId: 'br-bpn', unitType: 'department', isActive: true, sortOrder: 21 },
];

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
      slaConfigs: INITIAL_SLA,
      kpiTargets: INITIAL_TARGETS,
      workflows: INITIAL_WORKFLOWS,
      connectors: INITIAL_CONNECTORS,
      uploadConfig: INITIAL_UPLOAD,
      orgUnits: INITIAL_ORG,
      projectPhases: INITIAL_PHASES,

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
      version: 3,
      migrate: (persistedState: any, version: number) => {
        let current = persistedState || {};
        if (version < 2) {
          // Merge: tambah item baru dari INITIAL_* yang belum ada di persisted, tanpa hapus data user
          const mergeById = <T extends { id: string }>(persisted: T[] | undefined, initial: T[]): T[] => {
            if (!persisted) return initial;
            const map = new Map(persisted.map((item) => [item.id, item]));
            const result = [...persisted];
            for (const item of initial) {
              if (!map.has(item.id)) {
                result.push(item);
              }
            }
            return result;
          };
          current = {
            ...current,
            orgUnits: mergeById(current.orgUnits, INITIAL_ORG),
            slaConfigs: mergeById(current.slaConfigs, INITIAL_SLA),
            kpiTargets: mergeById(current.kpiTargets, INITIAL_TARGETS),
            connectors: mergeById(current.connectors, INITIAL_CONNECTORS),
            projectPhases: mergeById(current.projectPhases, INITIAL_PHASES),
          };
        }
        if (version < 3) {
          // Remove deprecated phases (Target Delivery, Executing, Completed)
          const deprecatedIds = new Set(['PH-08', 'PH-09', 'PH-10']);
          current = {
            ...current,
            projectPhases: (current.projectPhases || []).filter(
              (p: any) => !deprecatedIds.has(p.id),
            ),
          };
        }
        return current;
      },
    },
  ),
);
