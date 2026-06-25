# PLAN IMPLEMENTASI FRONTEND — KINETIC CRM

> **Tujuan**: Perbaiki frontend agar flow berjalan sesuai `md Kinetic CRM` docs, menggunakan **Zustand persist (localStorage)** untuk penyimpanan sementara (tanpa backend).
> **Prinsip**: Backward implementation — jangan hapus kode existing, tambah/timpa secara bertahap.

---

## RINGKASAN STATUS SAAT INI

Banyak fitur utama **sudah diimplementasi** di kode existing:
- ✅ Two-column customer (Existing/New) dengan radio toggle
- ✅ PIC Customer fields (nama, jabatan, no HP)
- ✅ Potensi Penambahan Unit (angka) — menentukan status Non Potensial/Potensial
- ✅ Branch dropdown (non-mandatory) — akan diubah jadi readonly dari user login
- ✅ "Pertanyaan Standar" (rename dari "Evaluasi & Ketentuan Teknis")
- ✅ 2 pertanyaan baru: jenis pengadaan beli putus + detail kebutuhan unit
- ✅ Filter tab Non Potensial / Potensial di daftar prospek
- ✅ Status badge warna (Non Potensial = slate, Potensial = emerald, Perlu Verifikasi = amber)
- ✅ Overview section di detail prospek
- ✅ Conditional button "Buat Proyek" (hanya untuk Potensial)
- ✅ Stepper kondisional (Prospecting vs Tender)
- ✅ Master Data dengan banyak tab (Customer, Industri, Kategori, Kompetitor, dll)

**Yang BELUM**: Data masih dari mock-data.ts (tidak persist), RBAC belum ketat, Users belum pindah ke Master Data, branch belum terrelasi dengan user login, existing customer auto-fill.

---

## KEPUTUSAN FINAL

| # | Item | Keputusan |
|---|------|-----------|
| 1 | **Provider Existing** | Diisi di **Form Prospek** (non-mandatory). Saat prospek dikonversi ke proyek, nilai `providerExisting` otomatis diwariskan ke Project. Tidak perlu field terpisah di Project Form. |
| 2 | **Branch** | **Readonly** dari user login. User tidak bisa ganti cabang. Diambil dari `authStore.user.branchName`. |
| 3 | **Verifikasi Customer** | **Hanya Super Admin** yang bisa verifikasi. Admin hanya bisa lihat. |
| 4 | **Progress Stepper** | Desain stepper tidak diubah. Yang diubah: jika Non Potensial → stepper **disembunyikan**. Jika Potensial → stepper tampil normal. |
| 5 | **Kategori Proyek vs Industri** | Flow prospek pakai **Master Industri**. Kategori Proyek tetap ada untuk workflow proyek (tender). |
| 6 | **Estimasi Nilai Proyek & Tanggal Closing** | **Non-mandatory** — tidak wajib diisi. |
| 7 | **New Customer auto-save** | Saat simpan prospek dengan customer baru, customer otomatis tersimpan ke Master Customer. |

---

## 7 POIN TAMBAHAN (HASIL REVIEW)

| # | Poin | Detail |
|---|------|--------|
| **A** | **sourceProspectId di Project** | Saat konversi, simpan `sourceProspectId` di project — untuk tracking & breadcrumb |
| **B** | **isConverted & projectId di Prospect** | Setelah konversi, `isConverted: true`, `projectId: "PRJ-001"` — tombol berubah jadi "Lihat Proyek" |
| **C** | **Verification fields di Customer** | `needsVerification`, `verifiedAt`, `verifiedBy` — frontend badge & RBAC: **hanya Super Admin** bisa verifikasi |
| **D** | **Existing Customer auto-fill** | Saat pilih existing customer: PIC, bidang, provider existing **auto-fill readonly** — user tidak perlu isi ulang |
| **E** | **Semua store pakai persist(localStorage)** | `prospectStore`, `customerStore`, `projectStore` — data survive refresh browser |
| **F** | **Branch readonly dari user login** | Cabang tidak bisa diubah — diambil dari `authStore.user.branchName`, ditampilkan readonly |
| **G** | **Kategori Proyek digantikan Industri** | Flow prospek pakai **Master Industri**, bukan kategori proyek. Kategori proyek tetap ada untuk workflow proyek nanti |

---

## FASE 0 — PERSIAPAN: ZUSTAND STORES (persist localStorage)

Buat 3 store baru untuk backbone data. Semua menggunakan `persist` middleware agar data tidak hilang saat refresh.

### 0.1 `stores/prospectStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';

interface ProspectState {
  prospects: Prospect[];
  addProspect: (p: Prospect) => void;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      prospects: INITIAL_PROSPECTS,
      addProspect: (p) => set((s) => ({ prospects: [...s.prospects, p] })),
      updateProspect: (id, data) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProspect: (id) =>
        set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) })),
      getProspectById: (id) => get().prospects.find((p) => p.id === id),
    }),
    { name: 'kinetic-prospects' },
  ),
);
```

### 0.2 `stores/customerStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/domain';
import { INITIAL_CUSTOMERS } from '@/services/mock-data';

interface CustomerState {
  customers: Customer[];
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  verifyCustomer: (id: string, verifiedBy: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: INITIAL_CUSTOMERS,
      addCustomer: (c) => set((s) => ({ customers: [...s.customers, c] })),
      updateCustomer: (id, data) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      verifyCustomer: (id, verifiedBy) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? { ...c, needsVerification: false, verifiedAt: new Date().toISOString(), verifiedBy }
              : c,
          ),
        })),
      getCustomerById: (id) => get().customers.find((c) => c.id === id),
    }),
    { name: 'kinetic-customers' },
  ),
);
```

### 0.3 `stores/projectStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';

interface ProjectState {
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),
      updateProject: (id, data) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      getProjectById: (id) => get().projects.find((p) => p.id === id),
    }),
    { name: 'kinetic-projects' },
  ),
);
```

---

## FASE 1 — PROSPEK FORM (ProspectFormPage.tsx)

| # | Perubahan | Detail |
|---|-----------|--------|
| 1.1 | Branch **readonly** dari user login | Ambil `user.branchName` dari authStore → tampil readonly. User **tidak bisa** mengganti cabang. |
| 1.2 | Existing Customer **auto-fill** | Saat pilih existing customer: Nama, Bidang/Industri, PIC (nama, jabatan, no HP), Provider Existing langsung terisi **readonly**. |
| 1.3 | Simpan ke prospectStore | Ganti mock data → panggil `useProspectStore().addProspect()` |
| 1.4 | New customer auto-save ke customerStore | Saat submit dengan mode `new`, panggil `useCustomerStore().addCustomer()` |
| 1.5 | Provider Existing (non-mandatory) | Tambah field dropdown "Provider Existing" (referensi ke master kompetitor). Non-mandatory. |
| 1.6 | Industri/Bidang Customer | Tambah dropdown "Bidang Customer" yang merujuk ke Master Industri. |
| 1.7 | Estimasi Nilai & Tanggal Closing | **Non-mandatory** — tanpa validasi required. |

**Detail Auto-fill saat pilih Existing Customer:**
```
Pilih Customer → auto isi:
├── Nama Customer       → readonly
├── Bidang/Industri     → readonly (dari customer.industryId)
├── PIC Nama            → readonly (dari customer.picName)
├── PIC Jabatan         → readonly (dari customer.picPosition)
├── PIC No HP           → readonly (dari customer.picPhone)
└── Provider Existing   → readonly (dari customer.providerExisting)
```

**Detail auto-save New Customer:**
```ts
if (customerMode === 'new') {
  const newCust: Customer = {
    id: `new-${Date.now()}`,
    name: newCustName,
    code: newCustCode || newCustName.substring(0, 3).toUpperCase(),
    type: newCustType,
    city: newCustCity,
    npwp: newCustNpwp || undefined,
    picName,
    picPosition,
    picPhone,
    industryId,           // dari dropdown bidang customer
    providerExisting,     // dari dropdown provider existing
    isNew: true,
    needsVerification: true,
  };
  addCustomer(newCust);
}
addProspect(payload);
```

---

## FASE 2 — LIST PROSPEK (ProspectsPage.tsx)

| # | Perubahan | Detail |
|---|-----------|--------|
| 2.1 | Ambil data dari prospectStore | Ganti `useState(INITIAL_PROSPECTS)` → `useProspectStore(s => s.prospects)` |
| 2.2 | Delete panggil store | Ganti `setProspects(prospects.filter(...))` → `deleteProspect(id)` |
| 2.3 | Filter "Perlu Verifikasi" | Tambah tab filter khusus untuk prospek dengan customer `needsVerification: true` |
| 2.4 | Badge "Perlu Verifikasi" | tetap pakai warna amber (✅ sudah ada) |

---

## FASE 3 — DETAIL PROSPEK (ProspectDetailPage.tsx)

| # | Perubahan | Detail |
|---|-----------|--------|
| 3.1 | Ambil data dari prospectStore | Ganti `INITIAL_PROSPECTS.find` → `getProspectById(id)` |
| 3.2 | Approve/Revisi update store | Panggil `updateProspect(id, { status: 'Approved' / 'Revision' })` |
| 3.3 | Konversi ke Proyek | Tombol "Buat Proyek" → create project dengan `sourceProspectId`, update prospect `isConverted: true`, navigasi ke `/project/:id/overview` |
| 3.4 | Jika sudah converted | Tombol berubah jadi **"Lihat Proyek"** → navigasi ke project |
| 3.5 | Verifikasi new customer | Tombol "Verifikasi" — **hanya tampil untuk Super Admin** → panggil `verifyCustomer(id, user.name)` |

**Flow konversi ke proyek (lengkap):**
```ts
const handleBuatProyek = () => {
  const newProject = {
    id: `PRJ-${Date.now()}`,
    code: `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(4, '0')}`,
    name: prospect.name,
    client: prospect.client,
    sourceProspectId: prospect.id,      // tracking asal prospek
    providerExisting: prospect.providerExisting,  // wariskan provider
    status: 'Prospecting',
    phase: 'Overview',
    location: prospect.branch || '-',
    author: prospect.author,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    progress: 0,
    estimatedValue: prospect.estimatedValue || 0,
    type: 'Prospecting',
  };
  addProject(newProject);
  updateProspect(prospect.id, {
    isConverted: true,
    projectId: newProject.id,
  });
  navigate(`/project/${newProject.id}/overview`);
  toast.success('Prospek berhasil dikonversi ke proyek!');
};
```

---

## FASE 4 — PROJECT DETAIL (ProjectDetailPage.tsx)

| # | Perubahan | Detail |
|---|-----------|--------|
| 4.1 | Ambil data dari projectStore | Ganti `INITIAL_PROJECTS.find` → `getProjectById(projectId)` |
| 4.2 | Kondisi Non Potensial | Jika project type Prospecting & berasal dari prospek Non Potensial → **stepper disembunyikan**, info overview terbatas |
| 4.3 | Kondisi Potensial | Jika project type Prospecting & potensi > 0 → stepper tampil **normal** |
| 4.4 | Stepper Tender | Tidak ada perubahan desain — tetap 5 langkah (RKS → Dept Review → LPHS/SIOS → Harga → Pemenang) |
| 4.5 | Provider Existing | Nilai dari prospek otomatis muncul di tab Overview (readonly) |

---

## FASE 5 — RBAC & NAVIGASI

### 5.1 Nav-items (`routes/nav-items.ts`)

| Item | Current Roles | New Roles |
|------|-------------|-----------|
| Pengguna | `['Super Admin', 'Admin']` | `['Super Admin']` |
| Konfigurasi | `['Super Admin', 'Admin']` | `['Super Admin']` |
| Audit Log | `['Super Admin', 'Admin']` | `['Super Admin']` |

### 5.2 Router (`routes/router.tsx`)

- Route `/users/*` → bungkus dengan `RoleRoute roles={['Super Admin']}`
- Route `/config/*` → bungkus dengan `RoleRoute roles={['Super Admin']}`
- Tambah route `/master-data/users` → `UserListPage`
- Route `/users/list` → redirect ke `/master-data/users`

### 5.3 MasterDataPage — Tambah tab Users

Tambah tab **"Hak Pengguna"** di tab navigator MasterDataPage (setelah Departemen).
Tampilkan daftar users dari mock data yang sudah ada atau dari store baru.

### 5.4 Integrasi (Oracle)

Di `ConfigIntegrationPage` (sudah ada), tambah opsi integrasi **Oracle** sebagai opsi tambahan.

---

## FASE 6 — TIPE & RELASI DATA

### 6.1 Perubahan di `types/domain/index.ts`

```ts
export interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  city: string;
  npwp?: string;
  picName: string;
  picPosition: string;
  picPhone: string;
  industryId?: string;              // relasi ke Master Industri
  providerExisting?: string;        // relasi ke Master Kompetitor
  isNew?: boolean;
  needsVerification?: boolean;
  verifiedAt?: string;              // timestamp verifikasi
  verifiedBy?: string;              // user yang verifikasi
}

export interface Prospect {
  id: string;
  name: string;
  client: string;
  customerId?: string;
  customerType?: 'existing' | 'new';
  customerData?: Customer;
  status: 'Non Potensial' | 'Potensial' | 'Waiting PM' | 'Revision' | 'Approved';
  prospectType?: 'non_potensial' | 'potensial';
  potensiUnit: number;
  author: string;
  date: string;
  estimatedValue?: number;
  description?: string;
  branch?: string;
  answers?: Record<string, string>;
  industryId?: string;              // bidang customer
  providerExisting?: string;        // provider existing
  isConverted?: boolean;            // sudah dikonversi ke proyek?
  projectId?: string;               // referensi ke project hasil konversi
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  phase: string;
  location: string;
  author: string;
  date: string;
  progress: number;
  estimatedValue: number;
  type: 'Tender' | 'Prospecting';
  sourceProspectId?: string;        // tracking asal prospek
  providerExisting?: string;        // diwariskan dari prospek
  deadlineTender?: string;
  pricing?: { ... };
  winnerDetails?: { ... };
  delivery?: { ... };
}
```

### 6.2 Relasi Customer ↔ Industri

- Di **MasterCustomerPage**: tambah kolom "Industri" yang refer ke master industri
- Di **ProspectFormPage**: tambah dropdown "Bidang Customer" (industri) di section customer
- Saat pilih Existing Customer → industri auto-fill **readonly**

### 6.3 Kategori Proyek digantikan Industri di flow Prospek

```
Flow lama:
Prospek → Kategori Proyek

Flow baru (revisi):
Prospek → Bidang Customer (Master Industri)

Kategori Proyek tetap ada untuk workflow proyek TENDER.
```

---

## FASE 7 — VERIFIKASI NEW CUSTOMER

| # | Item | Detail | RBAC |
|---|------|--------|------|
| 7.1 | Badge "Perlu Verifikasi" | ✅ Sudah ada (amber) di list & detail | Semua user lihat |
| 7.2 | Tombol Verifikasi | Di detail prospect — hanya Super Admin | Super Admin ✅, Admin ❌ |
| 7.3 | Filter tab | Tambah tab "Perlu Verifikasi" di ProspectsPage | Semua user lihat |
| 7.4 | Setelah verifikasi | Badge hilang, customer jadi normal | - |

```ts
// Hanya Super Admin yang bisa akses tombol verifikasi
const userRole = useAuthStore((s) => s.user?.roleName);
const isSuperAdmin = userRole === 'Super Admin';

// Tombol hanya tampil jika:
// 1. Customer needsVerification === true
// 2. User adalah Super Admin
{isSuperAdmin && needsVerification && (
  <button onClick={handleVerifikasi}>Verifikasi Customer</button>
)}
```

---

## RBAC MATRIX (LENGKAP)

| Aksi | Staff | Cabang | PM | Dept Head | Admin | Super Admin |
|------|-------|--------|----|-----------|-------|-------------|
| Lihat Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD Prospek | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve Prospek | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| CRUD Proyek | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verifikasi Customer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Master Data | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Users / Pengguna | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Konfigurasi | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approval | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Laporan | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Audit Log | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## URUTAN IMPLEMENTASI

```
Fase 0: Zustand Stores (prospectStore, customerStore, projectStore) + persist localStorage
    ↓
Fase 1: ProspectFormPage — connect store, auto-fill, branch readonly, provider existing
    ↓
Fase 2: ProspectsPage — connect store, filter Perlu Verifikasi
    ↓
Fase 3: ProspectDetailPage — connect store, konversi proyek, verifikasi
    ↓
Fase 4: ProjectDetailPage — connect store, kondisional stepper
    ↓
Fase 5: RBAC & Navigasi (nav-items, router, MasterDataPage + Users tab)
    ↓
Fase 6: Relasi data (industryId, providerExisting, sourceProspectId)
    ↓
Fase 7: Verifikasi new customer (Super Admin only)
```

---

## FILE PLAN (urutan pengerjaan)

```
 1. frontend/src/stores/prospectStore.ts               — BARU   (Zustand + persist)
 2. frontend/src/stores/customerStore.ts                — BARU   (Zustand + persist)
 3. frontend/src/stores/projectStore.ts                  — BARU   (Zustand + persist)
 4. frontend/src/types/domain/index.ts                   — UPDATE (tambah field baru)
 5. frontend/src/stores/authStore.ts                     — UPDATE (tambah branchName, branchId)
 6. frontend/src/features/prospects/ProspectFormPage.tsx — UPDATE (connect store, auto-fill, branch readonly)
 7. frontend/src/features/prospects/ProspectsPage.tsx    — UPDATE (connect store, filter)
 8. frontend/src/features/prospects/ProspectDetailPage.tsx — UPDATE (connect store, konversi, verifikasi)
 9. frontend/src/features/projects/ProjectDetailPage.tsx  — UPDATE (connect store, kondisional)
10. frontend/src/routes/nav-items.ts                     — UPDATE (RBAC)
11. frontend/src/routes/router.tsx                       — UPDATE (route guards + master-data/users)
12. frontend/src/features/master-data/MasterDataPage.tsx  — UPDATE (+ Users tab)
```

---

## DEPENDENSI & CATATAN

- Fase 0 harus selesai **sebelum** fase 1-4 (stores diperlukan oleh semua komponen)
- Fase 5-7 bisa dikerjakan **paralel** setelah Fase 0
- Semua store menggunakan `persist` middleware → data tidak hilang saat browser di-refresh
- Tidak ada perubahan backend — semua data di frontend (Zustand localStorage)
- File `mock-data.ts` tetap ada sebagai initial data seed
