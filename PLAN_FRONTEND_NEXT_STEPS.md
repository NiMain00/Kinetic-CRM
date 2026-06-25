# PLAN IMPLEMENTASI FRONTEND — NEXT STEPS

> **Tujuan**: Merapikan arsitektur frontend, memastikan flow data konsisten, dan menyinkronkan master data dengan Zustand stores.
> **Prinsip**: Backward compatibility — jangan hapus kode existing sebelum penggantinya berfungsi penuh.
> **Target**: Semua flow Prospek → Proyek berjalan mulus tanpa backend.

---

## RINGKASAN MASALAH SAAT INI

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **Dual type system** — 3 definisi type berbeda untuk entitas yang sama | Konflik import, bugs, maintenance berat |
| 2 | **Inkonsistensi pola** — PageAdapter vs direct hooks di komponen | Kebingungan developer, kode susah diprediksi |
| 3 | **Dead code** — `ProspectListPage.tsx` tidak dipakai | 143 baris sampah |
| 4 | **MasterDataPage monolitik** — 2000+ baris dalam 1 file | Sulit dibaca, sulit di-maintain |
| 5 | **Master data tidak sinkron** — `masterDataStore.ts` ada tapi tidak dipakai | Data ganda, inkonsisten |
| 6 | **INDUSTRIES duplikasi** — 3 tempat define array yang sama | Risk inconsistency |
| 7 | **authStore tanpa persist** — login hilang saat refresh | UX jelek |
| 8 | **react-hook-form + zod tidak dipakai** — form manual | Validasi rapuh, kode panjang |
| 9 | **Service layer mati** — 15 file services tidak terpakai | Dead code, bingung developer |
| 10 | **Tidak ada loading/error states** — akses store langsung | UX jelek saat data kosong/gagal |

---

## FASE 0 — TYPE SYSTEM & ARSITEKTUR (FOUNDATION)

### 0.1 Satukan type system

**File: `frontend/src/types/domain/index.ts`** — ✅ SUDAH LENGKAP
Tidak perlu perubahan besar. Yang perlu dilakukan:

- **Hapus file duplikat** setelah dipastikan tidak ada import ke sana:
  - `types/domain/prospect.ts` — cek dulu apakah ada import
  - `types/domain/project.ts` — cek dulu apakah ada import

**Cek import:**
```bash
# Cari file yang masih import dari prospect.ts atau project.ts
rg "from.*types/domain/prospect" --type ts
rg "from.*types/domain/project" --type ts
```

**Jika tidak ada yang pakai** → hapus kedua file.
**Jika ada yang pakai** → ubah import-nya ke `@/types/domain`.

### 0.2 Standarisasi pola komponen

**Keputusan**: Gunakan **direct hooks** (lebih modern, lebih bersih).
**File legacy yang pakai PageAdapter**:
- `ProspectDetailPage.tsx` — ⚠️ masih props `onShowNotification` + `onNavigatePage` di signature function
- `ProspectsPage.tsx` — ⚠️ masih props legacy
- `ProjectDetailPage.tsx` — ⚠️ masih props legacy `onShowNotification` + `onNavigatePage`
- `MasterDataPage.tsx` — ⚠️ masih props `onShowNotification`

**Aksi**: Buat file baru seperti `ProspectsPageNew.tsx`, `MasterDataPageNew.tsx` — pake hooks langsung. Setelah semua fitur jalan, baru ganti routing.

### 0.3 Hapus dead code

**File: `frontend/src/features/prospects/ProspectListPage.tsx`**
- 🔴 HAPUS — fungsinya sudah digantikan oleh `ProspectsPage.tsx`
- Cek dulu apakah ada import ke file ini (biasanya di router.tsx)
- Jika ada, redirect routing ke `ProspectsPage.tsx`

### 0.4 authStore — tambah persist

**File: `frontend/src/stores/authStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';  // TAMBAH

export const useAuthStore = create<AuthState>()(
  persist(                                      // BUNGKUS dengan persist
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'kinetic-auth' },                   // TAMBAH key persist
  ),
);
```

---

## FASE 1 — MASTER DATA SYNC (KRITIS)

### 1.1 Gunakan masterDataStore di MasterDataPage

**Masalah**: `MasterDataPage.tsx` saat ini:
- Define type lokal sendiri (Customer, Industry, Competitor, dll) — duplikasi dari domain types
- Pakai local `useState` — data tidak persist
- Tidak sinkron dengan `masterDataStore.ts`

**Solusi**: Refactor `MasterDataPage.tsx` pake `useMasterDataStore`.

**Detail perubahan:**

#### a) Hapus local type definitions di `MasterDataPage.tsx`
Hapus interface: `Customer`, `Industry`, `ProjectCategory`, `Competitor`, `ProjectStatus`, `DocumentType`, `MasterQuestion`, `ReportingPeriod`, `PublicHoliday`, `LossReason`, `ApprovalLevel`, `NotificationTemplate`, `Department`, `MasterUser`, `AuditLog`

#### b) Ganti local state dengan store
```ts
// SEBELUM:
const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

// SESUDAH:
const customers = useMasterDataStore((s) => s.customers);
const { addData, updateData, deleteData } = useMasterDataStore();
```

#### c) Sinkronkan INDUSTRIES
Industries saat ini hardcoded di `MasterDataPage.tsx` → pindahkan ke `masterDataStore.ts` sebagai entity baru `industries`.

**File: `frontend/src/stores/masterDataStore.ts`** — TAMBAH entity industries:

```ts
export interface MasterIndustry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

// Di INITIAL_DATA:
const INITIAL_INDUSTRIES: MasterIndustry[] = [
  { id: 'IND-01', name: 'Energi & Pertambangan', code: 'ENERGI', is_active: true },
  { id: 'IND-02', name: 'Konstruksi & Infrastruktur', code: 'KONSTRUKSI', is_active: true },
  { id: 'IND-03', name: 'Teknologi Informasi', code: 'TI', is_active: true },
  { id: 'IND-04', name: 'Perbankan & Keuangan', code: 'BANK', is_active: true },
  { id: 'IND-05', name: 'Manufaktur', code: 'MANUFAKTUR', is_active: true },
  { id: 'IND-06', name: 'Pemerintahan', code: 'PEMERINTAH', is_active: true },
  { id: 'IND-07', name: 'Kesehatan', code: 'KESEHATAN', is_active: true },
  { id: 'IND-08', name: 'Pendidikan', code: 'PENDIDIKAN', is_active: true },
  { id: 'IND-09', name: 'Retail & Distribusi', code: 'RETAIL', is_active: true },
  { id: 'IND-10', name: 'Telekomunikasi', code: 'TELKO', is_active: true },
  { id: 'IND-11', name: 'Lainnya', code: 'LAINNYA', is_active: true },
];
```

### 1.2 Sinkronkan data di ProspectFormPage & ProspectDetailPage

**File: `ProspectFormPage.tsx`** dan **`ProspectDetailPage.tsx`**

**Masalah**: Kedua file ini punya array `INDUSTRIES` dan `PROVIDER_EXISTING` hardcoded lokal.

**Solusi**: Ambil dari `masterDataStore`:

```ts
// GANTI:
const INDUSTRIES = [ ... ];  // lokal hardcoded

// JADI:
const industries = useMasterDataStore((s) => s.industries);
```

### 1.3 Sinkronkan PROVIDER_EXISTING

Provider Existing harusnya merujuk ke **Master Kompetitor**.
Saat ini `PROVIDER_EXISTING` array hardcoded di `ProspectFormPage.tsx`.

**Aksi**: Hapus array lokal, ganti dengan data dari `masterDataStore.competitors`.

---

## FASE 2 — REFACTOR MASTER DATA PAGE (PECAH FILE BESAR)

### 2.1 Buat komponen per tab

Pecah `MasterDataPage.tsx` menjadi file-file terpisah:

| Komponen Baru | Path | Isi |
|--------------|------|-----|
| `MasterCustomerTab.tsx` | `features/master-data/tabs/MasterCustomerTab.tsx` | Tabel Customer |
| `MasterIndustryTab.tsx` | `features/master-data/tabs/MasterIndustryTab.tsx` | Tabel Industri |
| `MasterCategoryTab.tsx` | `features/master-data/tabs/MasterCategoryTab.tsx` | Kategori Proyek |
| `MasterCompetitorTab.tsx` | `features/master-data/tabs/MasterCompetitorTab.tsx` | Kompetitor |
| `MasterProjectStatusTab.tsx` | `features/master-data/tabs/MasterProjectStatusTab.tsx` | Status Proyek |
| `MasterDocTypeTab.tsx` | `features/master-data/tabs/MasterDocTypeTab.tsx` | Tipe Dokumen |
| `MasterQuestionTab.tsx` | `features/master-data/tabs/MasterQuestionTab.tsx` | Pertanyaan |
| `MasterQuestionTypeTab.tsx` | `features/master-data/tabs/MasterQuestionTypeTab.tsx` | Tipe Respon |
| `MasterPeriodTab.tsx` | `features/master-data/tabs/MasterPeriodTab.tsx` | Periode |
| `MasterHolidayTab.tsx` | `features/master-data/tabs/MasterHolidayTab.tsx` | Hari Libur |
| `MasterLossReasonTab.tsx` | `features/master-data/tabs/MasterLossReasonTab.tsx` | Alasan Kekalahan |
| `MasterApprovalLevelTab.tsx` | `features/master-data/tabs/MasterApprovalLevelTab.tsx` | Level Approval |
| `MasterNotifTemplateTab.tsx` | `features/master-data/tabs/MasterNotifTemplateTab.tsx` | Template Notif |
| `MasterDepartmentTab.tsx` | `features/master-data/tabs/MasterDepartmentTab.tsx` | Departemen |
| `MasterUserTab.tsx` | `features/master-data/tabs/MasterUserTab.tsx` | Hak Pengguna |
| `MasterAuditLogTab.tsx` | `features/master-data/tabs/MasterAuditLogTab.tsx` | Audit Log |

### 2.2 Setiap tab component menggunakan template standar:

```tsx
interface TabProps {
  searchQuery: string;
  onShowNotification: (msg: string, type: 'success' | 'warning' | 'error') => void;
}

export default function MasterCustomerTab({ searchQuery, onShowNotification }: TabProps) {
  const customers = useMasterDataStore((s) => s.customers);
  const { addData, updateData, deleteData } = useMasterDataStore();
  // ... render table
}
```

### 2.3 MasterDataPage.tsx jadi thin shell:

```tsx
export default function MasterDataView({ onShowNotification }: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<SuperTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="...">
      {/* Tab navigator (same as now) */}
      {/* Search bar (same as now) */}
      {/* Content area — render komponen sesuai activeTab */}
      {activeTab === 'customers' && <MasterCustomerTab searchQuery={searchQuery} onShowNotification={onShowNotification} />}
      {activeTab === 'industries' && <MasterIndustryTab searchQuery={searchQuery} onShowNotification={onShowNotification} />}
      {/* ...dst */}
    </div>
  );
}
```

---

## FASE 3 — FLOW DATA (PROSPEK → PROYEK)

### 3.1 INDUSTRIES — ganti hardcoded dengan store

**File: `ProspectFormPage.tsx`**
- Hapus array `INDUSTRIES` (line 11-23)
- Ganti dengan: `const industries = useMasterDataStore((s) => s.industries);`

**File: `ProspectDetailPage.tsx`**
- Hapus object `INDUSTRIES` (line 10-22)
- Ganti dengan ambil dari store: `const industries = useMasterDataStore((s) => s.industries);`

### 3.2 PROVIDER_EXISTING — ganti hardcoded dengan store

**File: `ProspectFormPage.tsx`**
- Hapus array `PROVIDER_EXISTING` (line 26-32)
- Ganti dengan: `const competitors = useMasterDataStore((s) => s.competitors);`
- Dropdown provider existing pakai data competitors dari store

### 3.3 customerStore — sync data baru dari form ke master data

**Sudah berjalan** di `ProspectFormPage.tsx` line 218: `addCustomer(customerData)`

**Yang kurang**: Setelah customer ditambahkan via form prospek, customer baru juga harus muncul di **Master Data Customer**.

**Aksi**: Saat `addCustomer` di prospectStore, juga panggil `addData('customers', ...)` di masterDataStore.

### 3.4 Sinkronkan data antar store

**File: `frontend/src/features/prospects/ProspectFormPage.tsx`**

Di fungsi `saveProspect`:
```ts
// SUDAH ADA:
if (customerMode === 'new') {
  addCustomer(customerData);  // ke customerStore
}

// TAMBAH: juga simpan ke masterDataStore
import { useMasterDataStore } from '@/stores/masterDataStore';
const addMasterCustomer = useMasterDataStore((s) => s.addData);

if (customerMode === 'new') {
  addCustomer(customerData);
  addMasterCustomer('customers', {
    id: customerData.id,
    name: customerData.name,
    code: customerData.code,
    type: customerData.type,
    pic_name: customerData.picName,
    pic_email: '',
    pic_phone: customerData.picPhone,
    city: customerData.city,
    is_active: true,
  });
}
```

---

## FASE 4 — IMPLEMENTASI REACT-HOOK-FORM + ZOD

### 4.1 Form prospek — refactor ke react-hook-form

**File: `ProspectFormPage.tsx`**

Ganti manual state dengan `react-hook-form` + `zod` validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const prospectSchema = z.object({
  name: z.string().min(1, 'Nama Prospek harus diisi'),
  estimatedValue: z.number().optional(),
  potensiUnit: z.number().min(0),
  description: z.string().optional(),
});

type ProspectFormData = z.infer<typeof prospectSchema>;

export default function ProspectFormPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      name: existingProspect?.name || '',
      estimatedValue: existingProspect?.estimatedValue || undefined,
      potensiUnit: existingProspect?.potensiUnit || 0,
    },
  });
  // ...
}
```

### 4.2 Form proyek — refactor ke react-hook-form

**File: `ProjectDetailPage.tsx`** — bagian RKS form, pricing form, dll.

---

## FASE 5 — SERVICE LAYER CLEANUP

### 5.1 Evaluasi service files

| File Service | Status | Action |
|-------------|--------|--------|
| `services/mock-data.ts` | ✅ Dipakai | Tetap |
| `services/api-client.ts` | ❌ Tidak dipakai | Hapus atau arsip |
| `services/auth.ts` | ❌ Tidak dipakai | Hapus |
| `services/prospects.ts` | ❌ Tidak dipakai | Hapus |
| `services/projects.ts` | ❌ Tidak dipakai | Hapus |
| `services/master-data.ts` | ❌ Tidak dipakai | Hapus |
| `services/approvals.ts` | ❌ Tidak dipakai | Hapus |
| `services/dashboard.ts` | ❌ Tidak dipakai | Hapus |
| `services/notifications.ts` | ❌ Tidak dipakai | Hapus |
| `services/reports.ts` | ❌ Tidak dipakai | Hapus |
| `services/users.ts` | ❌ Tidak dipakai | Hapus |
| `services/config.ts` | ❌ Tidak dipakai | Hapus |
| `services/rks.ts` | ❌ Tidak dipakai | Hapus |
| `services/lphs-sios.ts` | ❌ Tidak dipakai | Hapus |
| `services/ai.ts` | ❌ Tidak dipakai | Hapus |

**Catatan**: Jangan hapus dulu! Cek dulu import dari file-file ini di seluruh project.

```bash
# Cek apakah ada yang masih import dari service files
rg "from.*services/" --type ts
```

---

## FASE 6 — LOADING & ERROR STATES

### 6.1 Buat custom hook useAsyncStore

**File: `frontend/src/hooks/useAsyncStore.ts`**

```ts
import { useState, useEffect } from 'react';

export function useAsyncStore<T>(fetcher: () => T, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      const result = fetcher();
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  return { data, loading, error };
}
```

### 6.2 Tambah loading/error di setiap page

**Template pattern:**
```tsx
const prospects = useProspectStore((s) => s.prospects);

if (!prospects || prospects.length === 0) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-outline">info</span>
        <p className="text-secondary mt-2">Belum ada data prospek</p>
      </div>
    </div>
  );
}
```

---

## FASE 7 — FINAL POLISHING

### 7.1 Hapus file-file yang sudah di-refactor

Setelah semua komponen baru berfungsi:
- Hapus `ProspectListPage.tsx`
- Hapus `types/domain/prospect.ts` dan `project.ts` (jika tidak dipakai)
- Hapus service files yang tidak dipakai

### 7.2 Update router jika perlu

**File: `frontend/src/routes/router.tsx`**
- Pastikan semua route point ke file yang benar
- Redirect `/users/list` → `/master-data/users` (✅ sudah ada)

### 7.3 Update nav-items jika perlu

**File: `frontend/src/routes/nav-items.ts`**
- ✅ Pengguna: Super Admin only
- ✅ Audit Log: Super Admin only
- ✅ Konfigurasi: Super Admin only

---

## URUTAN EKSEKUSI

```
Fase 0 — Type System & Arsitektur (1-2 jam)
  ├── 0.1 Hapus/rapikan type duplikat
  ├── 0.2 authStore + persist
  └── 0.3 Hapus dead code (ProspectListPage)

Fase 1 — Master Data Sync (3-4 jam)
  ├── 1.1 Tambah entity industries ke masterDataStore
  ├── 1.2 Refactor MasterDataPage → pake store
  └── 1.3 Synkronkan INDUSTRIES di form prospek & detail

Fase 2 — Pecah MasterDataPage (4-5 jam)
  ├── 2.1 Buat folder tabs/
  ├── 2.2 Pindah setiap tab ke file terpisah
  └── 2.3 MasterDataPage jadi thin shell

Fase 3 — Flow Data Sync (2-3 jam)
  ├── 3.1 Sinkronkan form prospek → master data customer
  ├── 3.2 Sinkronkan industryId antar entity
  └── 3.3 Sinkronkan providerExisting antar entity

Fase 4 — RHF + Zod (2-3 jam)
  ├── 4.1 Refactor ProspectFormPage ke react-hook-form
  └── 4.2 Tambah validasi zod

Fase 5 — Service Layer Cleanup (1 jam)
  ├── 5.1 Cek dependency
  └── 5.2 Hapus file yang aman dihapus

Fase 6 — Loading & Error (1-2 jam)
  ├── 6.1 Buat useAsyncStore hook
  └── 6.2 Tambah di setiap page

Fase 7 — Final Polish (1 jam)
  ├── 7.1 Hapus file refactor
  ├── 7.2 Update router
  └── 7.3 Testing alur lengkap
```

---

## DEPENDENSI & CATATAN

- **Fase 0** harus selesai dulu sebelum fase lain (foundation)
- **Fase 1 & 2** bisa jalan paralel setelah Fase 0
- **Fase 3** tergantung Fase 1 (master data harus sync dulu)
- **Fase 4** independen — bisa dikerjakan kapan saja
- **Fase 5** sebaiknya dilakukan setelah semua fase lain (takut ada yang masih import)
- **Fase 6** bisa dikerjakan paralel dengan fase lain
- **Fase 7** adalah final step — lakukan setelah semua selesai

---

## FILE PLAN (urutan pengerjaan)

```
 1.  frontend/src/stores/authStore.ts                   — UPDATE (tambah persist)
 2.  frontend/src/stores/masterDataStore.ts              — UPDATE (tambah entity industries)
 3.  frontend/src/types/domain/prospect.ts               — HAPUS (jika tidak dipakai)
 4.  frontend/src/types/domain/project.ts                — HAPUS (jika tidak dipakai)
 5.  frontend/src/features/prospects/ProspectListPage.tsx — HAPUS (dead code)
 6.  frontend/src/features/master-data/tabs/*            — BARU (16 file per tab)
 7.  frontend/src/features/master-data/MasterDataPage.tsx — UPDATE (thin shell)
 8.  frontend/src/features/prospects/ProspectFormPage.tsx — UPDATE (rhf+zod, store sync)
 9.  frontend/src/features/prospects/ProspectDetailPage.tsx — UPDATE (industries dari store)
10.  frontend/src/hooks/useAsyncStore.ts                 — BARU
11.  frontend/src/services/ — HAPUS FILE YANG AMAN
```
