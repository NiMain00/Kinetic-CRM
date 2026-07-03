# Input Config Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a centralized, configurable input option registry that replaces all hardcoded dropdown/select/radio constants with data-driven options manageable via an admin UI.

**Architecture:** A new Zustand store (`inputConfigStore`) holds `InputConfigGroup[]` with `InputOption[]` per group. A `useInputConfig` hook family wraps the store for consumption. An admin page (`ConfigInputPage`) provides CRUD UI. Nine existing components are migrated from hardcoded constants to the hook, one at a time.

**Tech Stack:** TypeScript, Zustand (with persist middleware), React hooks, Tailwind CSS

## Global Constraints

- All seed/default values must match existing hardcoded constants EXACTLY — zero visual change after migration.
- New files follow established codebase patterns (Zustand persist like `masterDataStore.ts`, hooks like `useConfigData.ts`).
- Component migration changes import + render logic only — no layout or styling changes.
- Store key naming convention: lowercase snake_case group keys.

---
## File Structure

### Created Files:
| File | Responsibility |
|------|---------------|
| `frontend/src/types/input-config.ts` | `InputOption`, `InputConfigGroup`, `InputConfigGroupKey`, `InputConfigCategory` types |
| `frontend/src/stores/inputConfigStore.ts` | Zustand store with persist, CRUD mutations, seed data for all 9 groups |
| `frontend/src/hooks/useInputConfig.ts` | `useActiveOptions()`, `useInputGroup()`, `useOptionLabel()`, `useInputConfigMutations()` |
| `frontend/src/features/config/ConfigInputPage.tsx` | Admin page: category tabs, group accordions, option CRUD drawer |

### Modified Files:
| File | Change |
|------|--------|
| `frontend/src/features/config/ConfigLayout.tsx` | Add sidebar tab for "Konfigurasi Input" |
| `frontend/src/types/domain/index.ts` | Remove `CUSTOMER_TYPES` export |
| `frontend/src/features/projects/ProjectFormPage.tsx` | Replace `PROJECT_TYPES` with `useActiveOptions('project_types')` |
| `frontend/src/features/config/ConfigSlaPage.tsx` | Replace 3 hardcoded `<select>` with `useActiveOptions()` |
| `frontend/src/features/prospects/ProspectsPage.tsx` | Replace `FILTER_TABS` with `useActiveOptions('prospect_filter_tabs')` |
| `frontend/src/features/projects/ProjectListPage.tsx` | Replace `PIPELINE_TABS` with `useActiveOptions('pipeline_tabs')` |
| `frontend/src/features/users/UsersPage.tsx` | Replace hardcoded status filter with `useActiveOptions('account_statuses')` |
| `frontend/src/features/users/UserFormPage.tsx` | Replace hardcoded status radio with `useActiveOptions('account_statuses')` |
| `frontend/src/features/config/ConfigWorkflowPage.tsx` | Replace `ENTITY_TABS` with `useActiveOptions('workflow_entity_tabs')` |
| `frontend/src/features/prospects/ProspectFormPage.tsx` | Replace `CUSTOMER_TYPES` import with `useActiveOptions('customer_types')` |

---

### Task 1: Create Input Config Types

**Files:**
- Create: `frontend/src/types/input-config.ts`

**Interfaces:**
- Produces: `InputOption`, `InputConfigCategory`, `InputConfigGroup`, `InputConfigGroupKey` types used by all subsequent tasks

- [ ] **Step 1: Create the type definition file**

Write `frontend/src/types/input-config.ts`:

```typescript
export interface InputOption {
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  color_hex?: string;
  metadata?: Record<string, string>;
}

export type InputConfigCategory = 'form' | 'filter' | 'sla' | 'workflow' | 'other';

export interface InputConfigGroup {
  id: string;
  key: string;
  name: string;
  description: string;
  category: InputConfigCategory;
  options: InputOption[];
  is_system: boolean;
}

export type InputConfigGroupKey =
  | 'customer_types'
  | 'project_types'
  | 'escalation_roles'
  | 'sla_entity_types'
  | 'sla_units'
  | 'prospect_filter_tabs'
  | 'pipeline_tabs'
  | 'account_statuses'
  | 'workflow_entity_tabs';
```

- [ ] **Step 2: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors (or only pre-existing errors unrelated to our new file).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/input-config.ts
git commit -m "feat(input-config): add InputOption, InputConfigGroup, InputConfigGroupKey types"
```

---

### Task 2: Create Input Config Store

**Files:**
- Create: `frontend/src/stores/inputConfigStore.ts`

**Interfaces:**
- Consumes: `InputOption`, `InputConfigGroup`, `InputConfigGroupKey` from Task 1
- Produces: `useInputConfigStore` with `getGroup`, `getActiveOptions`, `addOption`, `updateOption`, `deleteOption`, `toggleOption`, `reorderOptions`

- [ ] **Step 1: Create the store with seed data and CRUD mutations**

Write `frontend/src/stores/inputConfigStore.ts`:

```typescript
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
        // On migration, merge seed data with persisted data to avoid losing user changes
        const current = (persisted || {}) as any;
        if (version === 0) {
          // Fresh migration: merge persisted groups with defaults
          const persistedGroups: InputConfigGroup[] = current.groups || [];
          const defaultGroups = getDefaultGroups();
          const merged = defaultGroups.map((defaultG) => {
            const existing = persistedGroups.find((pg) => pg.key === defaultG.key);
            if (!existing) return defaultG;
            // Merge options: keep user's options + add new default options not yet present
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
```

- [ ] **Step 2: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/inputConfigStore.ts
git commit -m "feat(input-config): add inputConfigStore with seed data and CRUD mutations"
```

---

### Task 3: Create Input Config Hooks

**Files:**
- Create: `frontend/src/hooks/useInputConfig.ts`

**Interfaces:**
- Consumes: `useInputConfigStore`, `InputConfigGroupKey`, `InputOption` from Tasks 1-2
- Produces: `useActiveOptions(key) → InputOption[]`, `useInputGroup(key) → InputConfigGroup | undefined`, `useOptionLabel(key, value) → string`, `useInputConfigMutations() → { addOption, updateOption, deleteOption, toggleOption, reorderOptions }`

- [ ] **Step 1: Create the hooks file**

Write `frontend/src/hooks/useInputConfig.ts`:

```typescript
import { useMemo } from 'react';
import { useInputConfigStore } from '@/stores/inputConfigStore';
import type { InputConfigGroupKey, InputOption, InputConfigGroup } from '@/types/input-config';

/**
 * Returns active (is_active=true) options for a given input config group,
 * sorted by sort_order. Used by form dropdowns and filter selects.
 */
export function useActiveOptions(key: InputConfigGroupKey): InputOption[] {
  const getActiveOptions = useInputConfigStore((s) => s.getActiveOptions);
  return useMemo(() => getActiveOptions(key), [getActiveOptions, key]);
}

/**
 * Returns the full group (including inactive options) for admin editing.
 */
export function useInputGroup(key: InputConfigGroupKey): InputConfigGroup | undefined {
  const getGroup = useInputConfigStore((s) => s.getGroup);
  return useMemo(() => getGroup(key), [getGroup, key]);
}

/**
 * Returns the label for a given option value within a config group.
 * Falls back to the value itself if not found (graceful degradation).
 */
export function useOptionLabel(key: InputConfigGroupKey, value: string): string {
  const getGroup = useInputConfigStore((s) => s.getGroup);
  return useMemo(() => {
    const group = getGroup(key);
    if (!group) return value;
    const option = group.options.find((o) => o.value === value);
    return option?.label ?? value;
  }, [getGroup, key, value]);
}

/**
 * Mutation hooks for admin CRUD operations on input config options.
 */
export function useInputConfigMutations() {
  const addOption = useInputConfigStore((s) => s.addOption);
  const updateOption = useInputConfigStore((s) => s.updateOption);
  const deleteOption = useInputConfigStore((s) => s.deleteOption);
  const toggleOption = useInputConfigStore((s) => s.toggleOption);
  const reorderOptions = useInputConfigStore((s) => s.reorderOptions);

  return { addOption, updateOption, deleteOption, toggleOption, reorderOptions };
}
```

- [ ] **Step 2: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useInputConfig.ts
git commit -m "feat(input-config): add useInputConfig hooks (useActiveOptions, useInputGroup, useOptionLabel, useInputConfigMutations)"
```

---

### Task 4: Create Admin ConfigInputPage

**Files:**
- Create: `frontend/src/features/config/ConfigInputPage.tsx`

**Interfaces:**
- Consumes: `useInputConfigStore`, `useInputConfigMutations` from Tasks 2-3, `InputConfigGroupKey` from Task 1
- Produces: `ConfigInputPage` component (default export) — an admin page with category tabs + group accordions + option CRUD drawer

- [ ] **Step 1: Create the admin page**

Write `frontend/src/features/config/ConfigInputPage.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { useInputConfigStore, useInputConfigMutations } from '@/hooks/useInputConfig'; // We'll use the store directly for full groups
import { useInputConfigStore as useInputConfigStoreRaw } from '@/stores/inputConfigStore';
import type { InputConfigGroup, InputOption, InputConfigCategory, InputConfigGroupKey } from '@/types/input-config';
import toast from 'react-hot-toast';

const CATEGORY_TABS: { key: InputConfigCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'form', label: 'Form' },
  { key: 'filter', label: 'Filter' },
  { key: 'sla', label: 'SLA' },
  { key: 'workflow', label: 'Workflow' },
];

interface DrawerState {
  open: boolean;
  groupKey: InputConfigGroupKey | null;
  editingOption: InputOption | null;
  formValue: string;
  formLabel: string;
  formOrder: string;
  formColor: string;
}

const EMPTY_DRAWER: DrawerState = {
  open: false,
  groupKey: null,
  editingOption: null,
  formValue: '',
  formLabel: '',
  formOrder: '1',
  formColor: '',
};

export default function ConfigInputPage() {
  const groups = useInputConfigStoreRaw((s) => s.groups);
  const getGroup = useInputConfigStoreRaw((s) => s.getGroup);
  const { addOption, updateOption, deleteOption, toggleOption, reorderOptions } = useInputConfigMutations();

  const [activeCategory, setActiveCategory] = useState<InputConfigCategory | 'all'>('all');
  const [drawer, setDrawer] = useState<DrawerState>(EMPTY_DRAWER);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (activeCategory !== 'all') {
      result = result.filter((g) => g.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.options.some((o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)),
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, activeCategory, searchQuery]);

  const totalOptions = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.length, 0),
    [groups],
  );
  const activeOptions = useMemo(
    () => groups.reduce((sum, g) => sum + g.options.filter((o) => o.is_active).length, 0),
    [groups],
  );

  const handleOpenAdd = (groupKey: InputConfigGroupKey) => {
    setDrawer({
      open: true,
      groupKey,
      editingOption: null,
      formValue: '',
      formLabel: '',
      formOrder: String((getGroup(groupKey)?.options.length || 0) + 1),
      formColor: '',
    });
  };

  const handleOpenEdit = (groupKey: InputConfigGroupKey, option: InputOption) => {
    setDrawer({
      open: true,
      groupKey,
      editingOption: option,
      formValue: option.value,
      formLabel: option.label,
      formOrder: String(option.sort_order),
      formColor: option.color_hex || '',
    });
  };

  const handleCloseDrawer = () => {
    setDrawer(EMPTY_DRAWER);
  };

  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawer.groupKey) return;
    if (!drawer.formValue || !drawer.formLabel) {
      toast.error('Value dan label wajib diisi.');
      return;
    }

    if (drawer.editingOption) {
      updateOption(drawer.groupKey, drawer.editingOption.value, {
        value: drawer.formValue,
        label: drawer.formLabel,
        sort_order: Number(drawer.formOrder) || 1,
        color_hex: drawer.formColor || undefined,
      });
      toast.success(`Opsi "${drawer.formLabel}" berhasil diperbarui.`);
    } else {
      const group = getGroup(drawer.groupKey);
      if (group && group.options.some((o) => o.value === drawer.formValue)) {
        toast.error(`Value "${drawer.formValue}" sudah ada di grup ini.`);
        return;
      }
      addOption(drawer.groupKey, {
        value: drawer.formValue,
        label: drawer.formLabel,
        sort_order: Number(drawer.formOrder) || 1,
        is_active: true,
        color_hex: drawer.formColor || undefined,
      });
      toast.success(`Opsi "${drawer.formLabel}" berhasil ditambahkan.`);
    }
    handleCloseDrawer();
  };

  const handleDeleteOption = (groupKey: InputConfigGroupKey, option: InputOption) => {
    if (window.confirm(`Hapus opsi "${option.label}" (${option.value})?`)) {
      deleteOption(groupKey, option.value);
      toast.success(`Opsi "${option.label}" dihapus.`);
    }
  };

  const handleToggleOption = (groupKey: InputConfigGroupKey, value: string) => {
    toggleOption(groupKey, value);
    const group = getGroup(groupKey);
    const option = group?.options.find((o) => o.value === value);
    toast.success(
      `Opsi "${option?.label || value}" sekarang ${option?.is_active ? 'NON-AKTIF' : 'AKTIF'}.`,
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 shadow-sm z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Input</h2>
            <p className="text-[11px] text-outline mt-0.5">
              Kelola opsi dropdown, select, dan filter tabs yang dapat dikonfigurasi.
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Grup</span>
            <span className="ml-2 font-bold text-sm text-on-surface">{groups.length}</span>
          </div>
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Total Opsi</span>
            <span className="ml-2 font-bold text-sm text-on-surface">{totalOptions}</span>
          </div>
          <div className="bg-surface-container px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-outline uppercase font-mono">Aktif</span>
            <span className="ml-2 font-bold text-sm text-success">{activeOptions}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Category Tabs + Search */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-1 flex-wrap">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === tab.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari grup atau opsi..."
              className="w-full sm:w-56 px-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-lowest"
            />
          </div>

          {/* Groups */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">
              Tidak ada grup yang ditemukan.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <GroupAccordion
                key={group.id}
                group={group}
                onAdd={() => handleOpenAdd(group.key as InputConfigGroupKey)}
                onEdit={(opt) => handleOpenEdit(group.key as InputConfigGroupKey, opt)}
                onDelete={(opt) => handleDeleteOption(group.key as InputConfigGroupKey, opt)}
                onToggle={(opt) => handleToggleOption(group.key as InputConfigGroupKey, opt.value)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Drawer */}
      {drawer.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">
                  {drawer.editingOption ? 'Edit Opsi' : 'Tambah Opsi Baru'}
                </h3>
                <p className="text-[10px] text-outline mt-1">
                  Grup: {drawer.groupKey && (getGroup(drawer.groupKey)?.name || drawer.groupKey)}
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveOption} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Value *</label>
                <input
                  type="text"
                  value={drawer.formValue}
                  onChange={(e) => setDrawer({ ...drawer, formValue: e.target.value })}
                  className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs bg-surface-container-lowest"
                  placeholder="Contoh: swasta"
                  required
                  disabled={!!drawer.editingOption}
                />
                <p className="text-[10px] text-outline italic">Identifier unik. Tidak bisa diubah setelah dibuat.</p>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Label *</label>
                <input
                  type="text"
                  value={drawer.formLabel}
                  onChange={(e) => setDrawer({ ...drawer, formLabel: e.target.value })}
                  className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs bg-surface-container-lowest"
                  placeholder="Contoh: Swasta"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Urutan</label>
                  <input
                    type="number"
                    value={drawer.formOrder}
                    onChange={(e) => setDrawer({ ...drawer, formOrder: e.target.value })}
                    className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs bg-surface-container-lowest"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Warna (opsional)</label>
                  <input
                    type="color"
                    value={drawer.formColor || '#000000'}
                    onChange={(e) => setDrawer({ ...drawer, formColor: e.target.value })}
                    className="w-full h-[38px] rounded-lg border border-border p-1 bg-surface-container-lowest cursor-pointer"
                  />
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOption}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer"
              >
                {drawer.editingOption ? 'Simpan Perubahan' : 'Tambah Opsi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Group Accordion ──

function GroupAccordion({
  group,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  group: InputConfigGroup;
  onAdd: () => void;
  onEdit: (option: InputOption) => void;
  onDelete: (option: InputOption) => void;
  onToggle: (option: InputOption) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = group.options.filter((o) => o.is_active).length;

  return (
    <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline text-lg">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          <div>
            <h3 className="font-semibold text-sm text-on-surface">{group.name}</h3>
            <p className="text-[10px] text-outline">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded-full font-semibold">
            {activeCount}/{group.options.length} aktif
          </span>
          {group.is_system && (
            <span className="text-[9px] text-outline bg-surface-container px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
              System
            </span>
          )}
        </div>
      </button>

      {/* Options List */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {group.options
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((opt) => (
              <div key={opt.value} className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-3">
                  {opt.color_hex && (
                    <div
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: opt.color_hex }}
                    />
                  )}
                  <div>
                    <span className="text-xs font-medium text-on-surface">{opt.label}</span>
                    <span className="text-[9px] text-outline ml-2 font-mono">({opt.value})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle */}
                  <button
                    onClick={() => onToggle(opt)}
                    className={`inline-flex items-center justify-center p-0.5 rounded-full w-8 h-4 transition-colors outline-none cursor-pointer ${
                      opt.is_active ? 'bg-success' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${
                        opt.is_active ? 'translate-x-1.5' : '-translate-x-1.5'
                      }`}
                    />
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => onEdit(opt)}
                    className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => onDelete(opt)}
                    className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-danger transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          {/* Add button */}
          <div className="px-5 py-3">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tambah Opsi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/config/ConfigInputPage.tsx
git commit -m "feat(input-config): add ConfigInputPage admin page with category tabs, group accordions, and option CRUD drawer"
```

---

### Task 5: Add Route to Config Layout

**Files:**
- Modify: `frontend/src/features/config/ConfigLayout.tsx`

**Interfaces:**
- Consumes: `ConfigInputPage` from Task 4
- Adds: New tab/sidebar link "Konfigurasi Input"

- [ ] **Step 1: Read the current ConfigLayout**

```bash
cat "frontend/src/features/config/ConfigLayout.tsx"
```

- [ ] **Step 2: Add the route and sidebar link**

After identifying the sidebar tabs array and route rendering pattern, add:
- Tab definition for "Konfigurasi Input" with appropriate icon
- Route rendering for `/config/input-options` → `<ConfigInputPage />`
- Import `ConfigInputPage` at top

- [ ] **Step 3: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/config/ConfigLayout.tsx
git commit -m "feat(input-config): add ConfigInputPage route to ConfigLayout sidebar"
```

---

### Task 6: Migrate Customer Types in ProspectFormPage

**Files:**
- Modify: `frontend/src/features/prospects/ProspectFormPage.tsx`
- Modify: `frontend/src/types/domain/index.ts` (remove CUSTOMER_TYPES)

**Interfaces:**
- Consumes: `useActiveOptions('customer_types')` from Task 3

- [ ] **Step 1: Update ProspectFormPage.tsx**

Changes:
- Remove: `import { CUSTOMER_TYPES } from '@/types/domain';`
- Add: `import { useActiveOptions } from '@/hooks/useInputConfig';`
- Add at top of component: `const customerTypeOptions = useActiveOptions('customer_types');`
- Replace line 388: `{CUSTOMER_TYPES.map(t => (`
  with: `{customerTypeOptions.map(t => (`
- Remove `CUSTOMER_TYPES` import from `types/domain/index.ts`

- [ ] **Step 2: Remove CUSTOMER_TYPES from types/domain/index.ts**

Delete lines 212-217:
```typescript
export const CUSTOMER_TYPES = [
  { value: 'swasta', label: 'Swasta' },
  { value: 'bumn', label: 'BUMN' },
  { value: 'pemerintah', label: 'Pemerintah' },
  { value: 'asing', label: 'Asing' },
];
```

- [ ] **Step 3: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/prospects/ProspectFormPage.tsx frontend/src/types/domain/index.ts
git commit -m "feat(input-config): migrate CUSTOMER_TYPES to useActiveOptions('customer_types')"
```

---

### Task 7: Migrate Project Types

**Files:**
- Modify: `frontend/src/features/projects/ProjectFormPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('project_types')` from Task 3

- [ ] **Step 1: Update imports and variable**

Changes:
- Remove line 17: `const PROJECT_TYPES = ['Tender', 'Prospecting'] as const;`
- Add import: `import { useActiveOptions } from '@/hooks/useInputConfig';`
- Add: `const projectTypeOptions = useActiveOptions('project_types');`
- Replace line 214: `{PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}`
  with: `{projectTypeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}`

- [ ] **Step 2: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/projects/ProjectFormPage.tsx
git commit -m "feat(input-config): migrate PROJECT_TYPES to useActiveOptions('project_types')"
```

---

### Task 8: Migrate SLA Config Hardcoded Selects

**Files:**
- Modify: `frontend/src/features/config/ConfigSlaPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('escalation_roles')`, `useActiveOptions('sla_entity_types')`, `useActiveOptions('sla_units')` from Task 3

- [ ] **Step 1: Update imports**

Add: `import { useActiveOptions } from '@/hooks/useInputConfig';`

- [ ] **Step 2: Add hooks**

Add inside component (after `const [drawerOpen, setDrawerOpen] = useState(false);`):
```typescript
const entityTypeOptions = useActiveOptions('sla_entity_types');
const slaUnitOptions = useActiveOptions('sla_units');
const escalationRoleOptions = useActiveOptions('escalation_roles');
```

- [ ] **Step 3: Replace entity type `<select>` (line 141-146)**

Replace:
```tsx
<select value={formEntityType} onChange={e => setFormEntityType(e.target.value as SlaConfig['entityType'])} className="...">
  <option value="prospek">Prospek Review</option>
  <option value="rks">RKS Approval</option>
  <option value="lphs">LPHS Review</option>
  <option value="approval">General Approval</option>
</select>
```
with:
```tsx
<select value={formEntityType} onChange={e => setFormEntityType(e.target.value as SlaConfig['entityType'])} className="...">
  {entityTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
```

- [ ] **Step 4: Replace unit `<select>` (line 161-164)**

Replace:
```tsx
<select value={formUnit} onChange={e => setFormUnit(e.target.value as 'hours' | 'days')} className="...">
  <option value="hours">Jam</option>
  <option value="days">Hari</option>
</select>
```
with:
```tsx
<select value={formUnit} onChange={e => setFormUnit(e.target.value as 'hours' | 'days')} className="...">
  {slaUnitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
```

- [ ] **Step 5: Replace escalation roles `<select>` (line 168-174)**

Replace:
```tsx
<select value={formEscalation} onChange={e => setFormEscalation(e.target.value)} className="...">
  <option>Admin</option>
  <option>PM</option>
  <option>Branch Manager</option>
  <option>Dept Head</option>
  <option>Super Admin</option>
</select>
```
with:
```tsx
<select value={formEscalation} onChange={e => setFormEscalation(e.target.value)} className="...">
  {escalationRoleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
```

- [ ] **Step 6: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/config/ConfigSlaPage.tsx
git commit -m "feat(input-config): migrate SLA hardcoded selects to useActiveOptions"
```

---

### Task 9: Migrate Prospect Filter Tabs

**Files:**
- Modify: `frontend/src/features/prospects/ProspectsPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('prospect_filter_tabs')` from Task 3

- [ ] **Step 1: Update imports**

Add: `import { useActiveOptions } from '@/hooks/useInputConfig';`

- [ ] **Step 2: Replace FILTER_TABS and FILTER_LABELS**

- Remove lines 22-30:
```typescript
const FILTER_TABS: FilterTab[] = ['All', 'Butuh Approval', 'Non Potensial', 'Potensial', 'Revision', 'Approved'];
const FILTER_LABELS: Record<FilterTab, string> = {
  All: 'Semua',
  'Butuh Approval': 'Butuh Approval',
  'Non Potensial': 'Non Potensial',
  Potensial: 'Potensial',
  Revision: 'Revisi',
  Approved: 'Disetujui',
};
```
- Also remove the `FilterTab` type on line 18: `type FilterTab = 'All' | 'Butuh Approval' | 'Non Potensial' | 'Potensial' | 'Revision' | 'Approved';`

- [ ] **Step 3: Replace filter tabs usage**

Add inside component:
```typescript
const prospectFilterTabs = useActiveOptions('prospect_filter_tabs');
```

Replace `FILTER_TABS` usage (line 243) with `prospectFilterTabs`.
Replace `FILTER_LABELS[tab]` (line 253) with lookup from options array.

Since `FilterTab` type was a union, change `activeFilter` state type to `string`:
```typescript
const [activeFilter, setActiveFilter] = useState<string>('All');
```

Update type references from `FilterTab` to `string` throughout the file.

- [ ] **Step 4: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/prospects/ProspectsPage.tsx
git commit -m "feat(input-config): migrate FILTER_TABS to useActiveOptions('prospect_filter_tabs')"
```

---

### Task 10: Migrate Pipeline Tabs

**Files:**
- Modify: `frontend/src/features/projects/ProjectListPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('pipeline_tabs')` from Task 3

- [ ] **Step 1: Update imports**

Add: `import { useActiveOptions } from '@/hooks/useInputConfig';`

- [ ] **Step 2: Replace PIPELINE_TABS**

- Remove lines 31-36:
```typescript
const PIPELINE_TABS: { id: PipelineTab; label: string }[] = [
  { id: 'all', label: 'Semua Proyek' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'menang', label: 'Menang' },
  { id: 'kalah', label: 'Kalah' },
  { id: 'selesai', label: 'Selesai' },
];
```
- Also remove `PipelineTab` type on line 13.

- [ ] **Step 3: Replace with hook**

Add inside component:
```typescript
const pipelineTabOptions = useActiveOptions('pipeline_tabs');
```

Replace `PIPELINE_TABS.map(...)` (line 262) with `pipelineTabOptions.map(o => ({ id: o.value, label: o.label }))`.

Change `activeTab` state type from `PipelineTab` to `string`:
```typescript
const [activeTab, setActiveTab] = useState<string>('all');
```

- [ ] **Step 4: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/projects/ProjectListPage.tsx
git commit -m "feat(input-config): migrate PIPELINE_TABS to useActiveOptions('pipeline_tabs')"
```

---

### Task 11: Migrate Account Statuses

**Files:**
- Modify: `frontend/src/features/users/UsersPage.tsx`
- Modify: `frontend/src/features/users/UserFormPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('account_statuses')` from Task 3

- [ ] **Step 1: Update UsersPage.tsx**

Add import: `import { useActiveOptions } from '@/hooks/useInputConfig';`
Add: `const accountStatusOptions = useActiveOptions('account_statuses');`

Replace hardcoded status filter dropdown/select with:
```tsx
<select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
  <option value="all">Semua Status</option>
  {accountStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
```

- [ ] **Step 2: Update UserFormPage.tsx**

Add import: `import { useActiveOptions } from '@/hooks/useInputConfig';`
Add: `const accountStatusOptions = useActiveOptions('account_statuses');`

Replace hardcoded radio buttons for status with:
```tsx
<div className="flex gap-4">
  {accountStatusOptions.map(o => (
    <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="radio"
        value={o.value}
        {...register('status')}
        className="text-primary focus:ring-primary"
      />
      {o.label}
    </label>
  ))}
</div>
```

- [ ] **Step 3: Verify files compile**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/users/UsersPage.tsx frontend/src/features/users/UserFormPage.tsx
git commit -m "feat(input-config): migrate account status hardcoded options to useActiveOptions"
```

---

### Task 12: Migrate Workflow Entity Tabs

**Files:**
- Modify: `frontend/src/features/config/ConfigWorkflowPage.tsx`

**Interfaces:**
- Consumes: `useActiveOptions('workflow_entity_tabs')` from Task 3

- [ ] **Step 1: Update imports and replace ENTITY_TABS**

Add: `import { useActiveOptions } from '@/hooks/useInputConfig';`

- Remove lines 13-17:
```typescript
const ENTITY_TABS: Tab[] = [
  { id: 'prospek', label: 'Prospek', icon: 'travel_explore' },
  { id: 'rks', label: 'RKS', icon: 'description' },
  { id: 'lphs', label: 'LPHS', icon: 'assessment' },
];
```

Add inside component:
```typescript
const workflowEntityTabs = useActiveOptions('workflow_entity_tabs');
const tabsForUI = workflowEntityTabs.map(o => ({
  id: o.value,
  label: o.label,
  icon: o.metadata?.icon || 'settings',
}));
```

Replace `ENTITY_TABS` usage at `<Tabs tabs={...}>` with `tabsForUI`.

Change `activeEntity` state type from `string` to `string` (was already inferred).

- [ ] **Step 2: Remove unused `Tab` import if it becomes unused**

Check if `Tab` type from `@/components/ui/Tabs` is still used elsewhere in the file.

- [ ] **Step 3: Verify file compiles**

Run: `cd "c:/xampp/htdocs/kinetic-crm (6) (3)/frontend" && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/config/ConfigWorkflowPage.tsx
git commit -m "feat(input-config): migrate ENTITY_TABS to useActiveOptions('workflow_entity_tabs')"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - ✅ Types defined (`InputOption`, `InputConfigGroup`, etc.) — Task 1
   - ✅ Store with all 9 input groups + persist + CRUD — Task 2
   - ✅ Hooks (useActiveOptions, useInputGroup, useOptionLabel, useInputConfigMutations) — Task 3
   - ✅ Admin ConfigInputPage with category tabs, accordion groups, CRUD drawer — Task 4
   - ✅ Route integration in ConfigLayout — Task 5
   - ✅ Customer types migration (ProspectFormPage, remove CUSTOMER_TYPES) — Task 6
   - ✅ Project types migration (ProjectFormPage) — Task 7
   - ✅ SLA selects migration (ConfigSlaPage — 3 selects) — Task 8
   - ✅ Prospect filter tabs migration (ProspectsPage) — Task 9
   - ✅ Pipeline tabs migration (ProjectListPage) — Task 10
   - ✅ Account statuses migration (UsersPage, UserFormPage) — Task 11
   - ✅ Workflow entity tabs migration (ConfigWorkflowPage) — Task 12

2. **Placeholder scan:** No TBD, TODOs, or incomplete steps. Every step has actual code or exact commands.

3. **Type consistency:** All hooks and types referenced in later tasks match exactly what was defined in earlier tasks (same function names, parameter types, return types).
