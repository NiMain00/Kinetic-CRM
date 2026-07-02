# Input Config Registry — Design Document

**Date:** 2026-07-02
**Status:** Approved for implementation
**Author:** Claude

## 1. Problem Statement

Saat ini banyak input dropdown, select, radio group, dan filter tabs di Kinetic CRM yang memiliki opsi hardcoded (inline constants, array literals, atau `Record` objects). Admin tidak bisa mengubah, menambah, atau menonaktifkan opsi-opsi ini tanpa mengubah kode sumber. Ini menjadi masalah ketika bisnis membutuhkan fleksibilitas (misalnya menambah tipe customer baru, mengubah label filter, atau menyesuaikan escalation roles).

## 2. Scope

### 2.1 Input yang Akan Dimigrasi (Prioritas Tinggi)

| Key | Deskripsi | Saat Ini | Lokasi |
|-----|-----------|----------|--------|
| `customer_types` | Tipe customer (`swasta`, `bumn`, dll) | `CUSTOMER_TYPES` constant | `types/domain/index.ts:212` |
| `project_types` | Tipe proyek (`Tender`, `Prospecting`) | `PROJECT_TYPES` array | `ProjectFormPage.tsx:17` |
| `escalation_roles` | Role untuk eskalasi SLA | Hardcoded `<option>` | `ConfigSlaPage.tsx:168-174` |
| `sla_entity_types` | Tipe entitas SLA | Hardcoded `<option>` | `ConfigSlaPage.tsx:141-146` |
| `sla_units` | Unit waktu SLA (`hours`, `days`) | Hardcoded `<option>` | `ConfigSlaPage.tsx:161-164` |
| `prospect_filter_tabs` | Filter tab di halaman daftar prospek | `FILTER_TABS` array | `ProspectsPage.tsx:22` |
| `pipeline_tabs` | Pipeline tab di halaman daftar proyek | `PIPELINE_TABS` array | `ProjectListPage.tsx:31` |
| `account_statuses` | Status akun user (`active`, `inactive`) | Hardcoded radio | `UsersPage.tsx`, `UserFormPage.tsx` |
| `workflow_entity_tabs` | Tab entitas di workflow config | `ENTITY_TABS` | `ConfigWorkflowPage.tsx:13` |

### 2.2 Input Prioritas Menengah (Future)

| Key | Deskripsi | Lokasi |
|-----|-----------|--------|
| `module_groups` | Grup modul permission | `ConfigRolesPage.tsx`, `ConfigAccessControlPage.tsx` |
| `dept_colors` | Warna badge per departemen | `ConfigAccessControlPage.tsx:64` |
| `role_badges` | Warna badge per role | `ConfigAccessControlPage.tsx:73` |
| `winner_outcomes` | Opsi hasil tender (`menang`, `kalah`) | `PemenangTab.tsx` |

### 2.3 Input Tetap Hardcoded (Tidak Dimigrasi)

- `workflow_status_config` (STATUS_CONFIG) — display-only, internal
- `scope_labels` (SCOPE_LABELS) — sangat jarang berubah
- `access_labels` (ACCESS_LABELS) — sangat jarang berubah

## 3. Data Model

### 3.1 Tipe Data

```typescript
// frontend/src/types/input-config.ts

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

### 3.2 Default Value untuk Setiap Group

**customer_types:**
```typescript
const DEFAULTS: Record<InputConfigGroupKey, InputOption[]> = {
  customer_types: [
    { value: 'swasta', label: 'Swasta', sort_order: 1, is_active: true },
    { value: 'bumn', label: 'BUMN', sort_order: 2, is_active: true },
    { value: 'pemerintah', label: 'Pemerintah', sort_order: 3, is_active: true },
    { value: 'asing', label: 'Asing', sort_order: 4, is_active: true },
  ],
  project_types: [
    { value: 'Tender', label: 'Tender', sort_order: 1, is_active: true },
    { value: 'Prospecting', label: 'Prospecting', sort_order: 2, is_active: true },
  ],
  // ... dan seterusnya
};
```

Setiap group memiliki **ID unik** (contoh: `GRP-customer_types`), dan semua opsi default diisi dengan nilai yang **sama persis** dengan constant hardcoded saat ini — sehingga migrasi tidak mengubah tampilan.

## 4. Store

### 4.1 `inputConfigStore` (Zustand + persist)

File: `frontend/src/stores/inputConfigStore.ts`

```typescript
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
```

**Persist:** LocalStorage dengan key `kinetic-input-config`, versi 1.
**Migrasi:** Merge default values — tambah opsi baru dari seed tanpa hapus opsi yang sudah diedit user.

### 4.2 Hook

File: `frontend/src/hooks/useInputConfig.ts`

```typescript
// Untuk komponen form — hanya opsi aktif, terurut
export function useActiveOptions(key: InputConfigGroupKey): InputOption[]

// Untuk halaman admin — semua opsi termasuk non-aktif
export function useInputGroup(key: InputConfigGroupKey): InputConfigGroup | undefined

// Utility — dapatkan label dari value
export function useOptionLabel(key: InputConfigGroupKey, value: string): string

// Mutations
export function useInputConfigMutations(): { addOption, updateOption, deleteOption, toggleOption, reorderOptions }
```

Semua hook menggunakan `useSyncExternalStore` atau selector Zustand agar component hanya re-render ketika data yang dipakai berubah.

## 5. Halaman Admin: ConfigInputPage

### 5.1 Routing

Halaman baru ditambahkan di modul **Config**, dengan route:

```
/config/input-options
```

### 5.2 Layout

```
┌─────────────────────────────────────────────────────┐
│ [Config Layout — sidebar tabs]                       │
│ ● Dashboard                                         │
│ ● Organisasi                                        │
│ ● Status Proyek                                     │
│ ● Periode                                           │
│ ● SLA & Eskalasi                                    │
│ ● Tipe Pertanyaan                                   │
│ ● Workflow                                          │
│ ● Notifikasi                                        │
│ ● ○ Konfigurasi Input  ← NEW                        │
│ ● Roles                                             │
│ ● Access Control                                    │
│ ● Integrasi                                         │
│ ● Upload                                            │
│ ● Target KPI                                        │
└─────────────────────────────────────────────────────┘
```

### 5.3 UI

Halaman terdiri dari:
1. **Filter kategori** — tabs: `Semua | Form | Filter | SLA | Workflow`
2. **Accordion per group** — expandable, menampilkan daftar opsi
3. **Setiap opsi** — card kecil dengan: chip value, label, toggle aktif/nonaktif, drag handle, tombol edit
4. **Drawer add/edit** — form untuk value, label, sort_order, warna
5. **Search** — cari group atau opsi

### 5.4 Komponen Baru

| Komponen | Path |
|----------|------|
| `ConfigInputPage` | `frontend/src/features/config/ConfigInputPage.tsx` |
| (drawer inline atau komponen terpisah) | |

## 6. Migrasi

### 6.1 Strategi

Setiap file yang menggunakan constant hardcoded akan diubah secara satu per satu:

1. **Identifikasi** — semua const arrays/literals yang akan diganti
2. **Buat store + seed data** — buat store dengan nilai default = nilai hardcoded saat ini
3. **Ganti di komponen** — `CUSTOMER_TYPES.map(...)` → `useActiveOptions('customer_types').map(...)`
4. **Verifikasi** — opsi yang tampil harus sama persis sebelum dan sesudah

### 6.2 Urutan Migrasi

| Langkah | File | Key |
|---------|------|-----|
| 1 | `types/input-config.ts` | — buat tipe |
| 2 | `stores/inputConfigStore.ts` | — buat store |
| 3 | `hooks/useInputConfig.ts` | — buat hooks |
| 4 | `features/config/ConfigInputPage.tsx` | — buat halaman admin |
| 5 | Update routing di config | — tambah route |
| 6 | `types/domain/index.ts` | `customer_types` |
| 7 | `ProjectFormPage.tsx` | `project_types` |
| 8 | `ConfigSlaPage.tsx` | `escalation_roles`, `sla_entity_types`, `sla_units` |
| 9 | `ProspectsPage.tsx` | `prospect_filter_tabs` |
| 10 | `ProjectListPage.tsx` | `pipeline_tabs` |
| 11 | `UsersPage.tsx`, `UserFormPage.tsx` | `account_statuses` |
| 12 | `ConfigWorkflowPage.tsx` | `workflow_entity_tabs` |

## 7. Non-Functional

- **Backward compatibility:** Semua default = nilai hardcoded eksisting. Tidak ada perubahan UI.
- **Persist:** Menggunakan Zustand persist middleware (localStorage), sama seperti store lainnya.
- **Performance:** Hook selector mencegah re-render di komponen yang tidak relevan.
- **Migration path:** Jika suatu saat opsi perlu disimpan di backend, tinggal ganti implementasi hook tanpa mengubah komponen.

### 7.1 TypeScript Types vs Runtime Config

Terdapat trade-off antara type safety dan fleksibilitas runtime:

- **Domain types** (misal `Customer.type: 'swasta' | 'bumn' | 'pemerintah' | 'asing'`) — **tetap dipertahankan** sebagai compile-time documentation. Ini mendefinisikan nilai yang *saat ini* valid.
- **Config store** — menjadi source of truth di *runtime*. Admin bisa menambah opsi baru yang belum tercakup union type.
- **Komponen** — membaca dari config store (`useActiveOptions`), bukan dari union type.
- **Konsekuensi:** Jika admin menambah nilai baru di config store, TypeScript tidak akan complain secara compile-time, tapi secara runtime akan berfungsi. Ini adalah trade-off yang disepakati untuk mencapai fleksibilitas yang dibutuhkan.

Untuk tipe yang lebih strict di masa depan, bisa ditambahkan validasi runtime (Zod) yang membaca dari config store.

## 8. File yang Akan Dibuat/Diubah

### Created:
- `frontend/src/types/input-config.ts`
- `frontend/src/stores/inputConfigStore.ts`
- `frontend/src/hooks/useInputConfig.ts`
- `frontend/src/features/config/ConfigInputPage.tsx`

### Modified:
- `frontend/src/features/config/ConfigLayout.tsx` (tambah tab)
- `frontend/src/types/domain/index.ts` (hapus CUSTOMER_TYPES)
- `frontend/src/features/projects/ProjectFormPage.tsx` (ganti PROJECT_TYPES)
- `frontend/src/features/config/ConfigSlaPage.tsx` (ganti hardcoded selects)
- `frontend/src/features/prospects/ProspectsPage.tsx` (ganti FILTER_TABS)
- `frontend/src/features/projects/ProjectListPage.tsx` (ganti PIPELINE_TABS)
- `frontend/src/features/users/UsersPage.tsx` (ganti status filter)
- `frontend/src/features/users/UserFormPage.tsx` (ganti status radio)
- `frontend/src/features/config/ConfigWorkflowPage.tsx` (ganti ENTITY_TABS)
- `frontend/src/features/prospects/ProspectFormPage.tsx` (ganti CUSTOMER_TYPES import)
