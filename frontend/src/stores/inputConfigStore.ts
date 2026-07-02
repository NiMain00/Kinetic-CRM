import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InputConfigGroup, InputOption, InputConfigGroupKey } from '@/types/input-config';

// ── Seed Data ──

const SEED_GROUPS: InputConfigGroup[] = [
  {
    id: 'GRP-customer_types',
    key: 'customer_types',
    name: 'Tipe Customer',
    description: 'Klasifikasi tipe customer untuk prospek dan proyek',
    category: 'form',
    is_system: true,
    options: [
      { value: 'swasta', label: 'Swasta', sort_order: 1, is_active: true },
      { value: 'bumn', label: 'BUMN', sort_order: 2, is_active: true },
      { value: 'pemerintah', label: 'Pemerintah', sort_order: 3, is_active: true },
      { value: 'asing', label: 'Asing', sort_order: 4, is_active: true },
    ],
  },
  {
    id: 'GRP-project_types',
    key: 'project_types',
    name: 'Tipe Proyek',
    description: 'Klasifikasi jenis proyek (Tender / Prospecting)',
    category: 'form',
    is_system: true,
    options: [
      { value: 'Tender', label: 'Tender', sort_order: 1, is_active: true },
      { value: 'Prospecting', label: 'Prospecting', sort_order: 2, is_active: true },
    ],
  },
  {
    id: 'GRP-escalation_roles',
    key: 'escalation_roles',
    name: 'Role Eskalasi SLA',
    description: 'Role yang menerima eskalasi ketika SLA melewati batas',
    category: 'sla',
    is_system: true,
    options: [
      { value: 'Admin', label: 'Admin', sort_order: 1, is_active: true },
      { value: 'PM', label: 'PM', sort_order: 2, is_active: true },
      { value: 'Branch Manager', label: 'Branch Manager', sort_order: 3, is_active: true },
      { value: 'Dept Head', label: 'Dept Head', sort_order: 4, is_active: true },
      { value: 'Super Admin', label: 'Super Admin', sort_order: 5, is_active: true },
    ],
  },
  {
    id: 'GRP-sla_entity_types',
    key: 'sla_entity_types',
    name: 'Tipe Entitas SLA',
    description: 'Jenis entitas yang memiliki aturan SLA',
    category: 'sla',
    is_system: true,
    options: [
      { value: 'prospek', label: 'Prospek Review', sort_order: 1, is_active: true },
      { value: 'rks', label: 'RKS Approval', sort_order: 2, is_active: true },
      { value: 'lphs', label: 'LPHS Review', sort_order: 3, is_active: true },
      { value: 'approval', label: 'General Approval', sort_order: 4, is_active: true },
    ],
  },
  {
    id: 'GRP-sla_units',
    key: 'sla_units',
    name: 'Unit Waktu SLA',
    description: 'Satuan waktu untuk threshold SLA',
    category: 'sla',
    is_system: true,
    options: [
      { value: 'hours', label: 'Jam', sort_order: 1, is_active: true },
      { value: 'days', label: 'Hari', sort_order: 2, is_active: true },
    ],
  },
  {
    id: 'GRP-prospect_filter_tabs',
    key: 'prospect_filter_tabs',
    name: 'Filter Tab Prospek',
    description: 'Tab filter yang muncul di halaman daftar prospek',
    category: 'filter',
    is_system: true,
    options: [
      { value: 'All', label: 'Semua', sort_order: 1, is_active: true },
      { value: 'Butuh Approval', label: 'Butuh Approval', sort_order: 2, is_active: true },
      { value: 'Non Potensial', label: 'Non Potensial', sort_order: 3, is_active: true },
      { value: 'Potensial', label: 'Potensial', sort_order: 4, is_active: true },
      { value: 'Revision', label: 'Revisi', sort_order: 5, is_active: true },
      { value: 'Approved', label: 'Disetujui', sort_order: 6, is_active: true },
    ],
  },
  {
    id: 'GRP-pipeline_tabs',
    key: 'pipeline_tabs',
    name: 'Pipeline Tab Proyek',
    description: 'Tab filter yang muncul di halaman daftar proyek',
    category: 'filter',
    is_system: true,
    options: [
      { value: 'all', label: 'Semua Proyek', sort_order: 1, is_active: true },
      { value: 'aktif', label: 'Aktif', sort_order: 2, is_active: true },
      { value: 'menang', label: 'Menang', sort_order: 3, is_active: true },
      { value: 'kalah', label: 'Kalah', sort_order: 4, is_active: true },
      { value: 'selesai', label: 'Selesai', sort_order: 5, is_active: true },
    ],
  },
  {
    id: 'GRP-account_statuses',
    key: 'account_statuses',
    name: 'Status Akun',
    description: 'Status aktif/nonaktif untuk akun pengguna',
    category: 'form',
    is_system: true,
    options: [
      { value: 'active', label: 'Aktif', sort_order: 1, is_active: true },
      { value: 'inactive', label: 'Non-Aktif', sort_order: 2, is_active: true },
    ],
  },
  {
    id: 'GRP-workflow_entity_tabs',
    key: 'workflow_entity_tabs',
    name: 'Tab Entitas Workflow',
    description: 'Tab entitas di halaman konfigurasi workflow',
    category: 'workflow',
    is_system: true,
    options: [
      { value: 'prospek', label: 'Prospek', sort_order: 1, is_active: true, metadata: { icon: 'travel_explore' } },
      { value: 'rks', label: 'RKS', sort_order: 2, is_active: true, metadata: { icon: 'description' } },
      { value: 'lphs', label: 'LPHS', sort_order: 3, is_active: true, metadata: { icon: 'assessment' } },
    ],
  },
];

// ── Helpers ──

function getDefaultGroups(): InputConfigGroup[] {
  return JSON.parse(JSON.stringify(SEED_GROUPS));
}

// ── Store ──

interface InputConfigState {
  groups: InputConfigGroup[];

  // Queries
  getGroup: (key: InputConfigGroupKey) => InputConfigGroup | undefined;
  getActiveOptions: (key: InputConfigGroupKey) => InputOption[];

  // Mutations
  addOption: (groupKey: InputConfigGroupKey, option: InputOption) => void;
  updateOption: (groupKey: InputConfigGroupKey, value: string, data: Partial<InputOption>) => void;
  deleteOption: (groupKey: InputConfigGroupKey, value: string) => void;
  toggleOption: (groupKey: InputConfigGroupKey, value: string) => void;
  reorderOptions: (groupKey: InputConfigGroupKey, optionIds: string[]) => void;
}

export const useInputConfigStore = create<InputConfigState>()(
  persist(
    (set, get) => ({
      groups: getDefaultGroups(),

      getGroup: (key) => get().groups.find((g) => g.key === key),

      getActiveOptions: (key) => {
        const group = get().groups.find((g) => g.key === key);
        if (!group) return [];
        return group.options
          .filter((o) => o.is_active)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      addOption: (groupKey, option) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? { ...g, options: [...g.options, option] }
              : g,
          ),
        })),

      updateOption: (groupKey, value, data) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: g.options.map((o) =>
                    o.value === value ? { ...o, ...data } : o,
                  ),
                }
              : g,
          ),
        })),

      deleteOption: (groupKey, value) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? { ...g, options: g.options.filter((o) => o.value !== value) }
              : g,
          ),
        })),

      toggleOption: (groupKey, value) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: g.options.map((o) =>
                    o.value === value ? { ...o, is_active: !o.is_active } : o,
                  ),
                }
              : g,
          ),
        })),

      reorderOptions: (groupKey, optionValues) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: optionValues
                    .map((v, i) => {
                      const opt = g.options.find((o) => o.value === v);
                      return opt ? { ...opt, sort_order: i + 1 } : null;
                    })
                    .filter(Boolean) as InputOption[],
                }
              : g,
          ),
        })),
    }),
    {
      name: 'kinetic-input-config',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0) {
          const persistedGroups: InputConfigGroup[] = current.groups || [];
          const defaultGroups = getDefaultGroups();
          const merged = defaultGroups.map((defaultG) => {
            const existing = persistedGroups.find((pg) => pg.key === defaultG.key);
            if (!existing) return defaultG;
            const existingValues = new Set(existing.options.map((o) => o.value));
            const mergedOptions = [...existing.options];
            for (const defOpt of defaultG.options) {
              if (!existingValues.has(defOpt.value)) {
                mergedOptions.push(defOpt);
              }
            }
            return { ...defaultG, ...existing, options: mergedOptions };
          });
          return { groups: merged };
        }
        return current;
      },
    },
  ),
);
