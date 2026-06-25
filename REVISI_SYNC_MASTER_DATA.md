# RENCANA SINKRONISASI MASTER DATA — ZUSTAND STORE

> **Tujuan**: Menyambungkan semua tab Master Data yang sudah benar ke Zustand store (persist localStorage), tanpa mengubah UI yang sudah ada.
> **Prinsip**: Semua data master dari tab-tab yang sudah benar harus persist dan bisa dipakai bersama oleh halaman lain (Prospek, Proyek, dll).

---

## 📊 MASTER DATA TABS SAAT INI (di MasterDataPage.tsx)

| # | Tab | Local State di MasterDataPage | Type Lokal (duplikasi) | Apakah ada di masterDataStore? |
|---|-----|------------------------------|----------------------|-------------------------------|
| 1 | Customer | `useState<Customer[]>` | ✅ lokal | ✅ ada (MasterCustomer) — beda type |
| 2 | Industri | `useState<Industry[]>` | ✅ lokal | ❌ belum ada |
| 3 | Kategori Proyek | `useState<ProjectCategory[]>` | ✅ lokal | ✅ ada (MasterCategory) |
| 4 | Kompetitor | `useState<Competitor[]>` | ✅ lokal | ✅ ada (MasterCompetitor) — beda field |
| 5 | Status Proyek | `useState<ProjectStatus[]>` | ✅ lokal | ❌ belum ada |
| 6 | Tipe Dokumen | `useState<DocumentType[]>` | ✅ lokal | ✅ ada (MasterDocType) — beda field |
| 7 | Pertanyaan | `useState<MasterQuestion[]>` | ✅ lokal | ✅ ada (MasterQuestion) — beda field |
| 8 | Tipe Respon | `useState<QuestionType[]>` | ✅ lokal | ❌ belum ada |
| 9 | Periode | `useState<ReportingPeriod[]>` | ✅ lokal | ✅ ada (MasterPeriod) — beda field |
| 10 | Hari Libur | `useState<PublicHoliday[]>` | ✅ lokal | ✅ ada (MasterHoliday) — beda field |
| 11 | Alasan Kekalahan | `useState<LossReason[]>` | ✅ lokal | ✅ ada (MasterLossReason) — beda field |
| 12 | Departemen | `useState<Department[]>` | ✅ lokal | ❌ belum ada |
| 13 | Hak Pengguna | `useState<MasterUser[]>` | ✅ lokal | ❌ belum ada |
| 14 | Audit Log | `useState<AuditLog[]>` | ✅ lokal | ❌ belum ada |
| 15 | Approval Level | `useState<ApprovalLevel[]>` | ✅ lokal | ❌ belum ada |
| 16 | Notif Template | `useState<NotificationTemplate[]>` | ✅ lokal | ❌ belum ada |

---

## 🎯 STRATEGI

**TIDAK** mengubah UI tab yang sudah benar.
**TIDAK** menghapus data awal yang sudah ada.

Yang diubah:
1. **masterDataStore.ts** → tambah semua entity yang belum ada (industries, projectStatuses, documentTypes, questionTypes, departments, users, auditLogs, approvalLevels, notifTemplates)
2. **MasterDataPage.tsx** → ganti `useState` + data lokal dengan `useMasterDataStore`
3. **ProspectFormPage.tsx** → ganti array INDUSTRIES hardcoded dengan data dari store
4. **ProspectDetailPage.tsx** → ganti object INDUSTRIES hardcoded dengan data dari store
5. **Sinkronisasi auto-save** → form prospek simpan customer baru juga ke masterDataStore

---

## 📋 LANGKAH-LANGKAH

### LANGKAH 1: Update masterDataStore.ts — tambah entity yang belum ada

**File: `frontend/src/stores/masterDataStore.ts`**

Tambah type dan initial data untuk entity yang belum ada:

#### a) MasterIndustry (tab Industri)
```ts
export interface MasterIndustry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}
```

#### b) MasterProjectStatus (tab Status Proyek)
```ts
export interface MasterProjectStatus {
  id: string;
  code: string;
  label: string;
  description: string;
  color_hex: string;
  text_color_hex: string;
  sort_order: number;
  is_system: boolean;
  is_terminal: boolean;
  is_active: boolean;
  applicable_to: string;
}
```

#### c) MasterDocumentType (tab Tipe Dokumen)
```ts
export interface MasterDocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  allowed_extensions: string[];
  max_size_mb: number;
  is_required_at_stage: string[] | null;
  applicable_to: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}
```

#### d) MasterQuestionType (tab Tipe Respon)
```ts
export interface MasterQuestionType {
  id: string;
  name: string;
  code: string;
  description: string;
  has_options: boolean;
  validation_config: string;
  is_system: boolean;
  is_active: boolean;
}
```

#### e) MasterDepartment (tab Departemen)
```ts
export interface MasterDepartment {
  id: string;
  name: string;
  code: string;
  head: string;
  division: string;
  status: boolean;
}
```

#### f) MasterUser (tab Hak Pengguna)
```ts
export interface MasterUser {
  id: string;
  name: string;
  branch: string;
  username: string;
  email: string;
  role: string;
  roleColor: string;
  active: boolean;
  avatarColor: string;
}
```

#### g) MasterAuditLog (tab Audit Log)
```ts
export interface MasterAuditLog {
  id: string;
  time: string;
  user: string;
  userInitials: string;
  action: string;
  actionColor: string;
  entity: string;
  entityName: string;
  impact: 'Low' | 'Medium' | 'High';
  beforeJson: string;
  afterJson: string;
}
```

#### h) MasterApprovalLevel (tab Approval Level)
```ts
export interface MasterApprovalLevel {
  id: string;
  name: string;
  code: string;
  level_number: number;
  escalates_to_level_id: string | null;
  description: string;
  is_active: boolean;
}
```

#### i) MasterNotifTemplate (tab Notif Template)
```ts
export interface MasterNotifTemplate {
  id: string;
  event_code: string;
  event_name: string;
  template_inapp: string;
  recipient_roles: string[];
  available_variables: string[];
  is_active: boolean;
  is_system: boolean;
}
```

#### j) Update EntityType union
```ts
type EntityType = 'categories' | 'competitors' | 'docTypes' | 'questions' | 'holidays' | 'lossReasons' | 'periods' | 'customers' | 'industries' | 'projectStatuses' | 'documentTypes' | 'questionTypes' | 'departments' | 'users' | 'auditLogs' | 'approvalLevels' | 'notifTemplates';
```

#### k) Update INITIAL_DATA dengan data dari MasterDataPage.tsx
Copy paste initial data arrays dari MasterDataPage.tsx ke masterDataStore.ts:

- `INITIAL_INDUSTRIES` → dari MasterDataPage (sudah ada di line 309-321)
- `INITIAL_PROJECT_STATUSES` → dari MasterDataPage (line 332-343)
- `INITIAL_DOCUMENT_TYPES` → dari MasterDataPage (line 345-354)
- `INITIAL_QUESTION_TYPES` → dari MasterDataPage (line 266-274)
- `INITIAL_DEPARTMENTS` → dari MasterDataPage (line 289-293)
- `INITIAL_USERS` → dari MasterDataPage (line 276-281)
- `INITIAL_AUDIT_LOGS` → dari MasterDataPage (line 211-264)
- `INITIAL_APPROVAL_LEVELS` → dari MasterDataPage (line 393-397)
- `INITIAL_NOTIF_TEMPLATES` → dari MasterDataPage (line 399-406)

---

### LANGKAH 2: Update MasterDataPage.tsx — ganti useState dengan useMasterDataStore

**Prinsip**: UI tidak berubah sama sekali. Hanya sumber data yang berubah.

#### a) Hapus initial data arrays lokal
Hapus semua `INITIAL_*` arrays dari MasterDataPage.tsx (kecuali yang mungkin masih dipakai untuk mock di drawer).

#### b) Hapus semua `useState` untuk master data
Ganti pola:
```tsx
// SEBELUM:
const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
const addCustomer = (data: Customer) => setCustomers(prev => [...prev, data]);

// SESUDAH:
const customers = useMasterDataStore((s) => s.customers) as Customer[];
const addData = useMasterDataStore((s) => s.addData);
```

#### c) Perhatikan type mismatch
Type lokal di MasterDataPage.tsx (misal `Customer`) berbeda dengan type store (`MasterCustomer`). Ada 2 opsi:

**Opsi A (Recommended)**: Biarkan type lokal tetap ada di MasterDataPage.tsx untuk UI rendering. Cast saja dari store:
```tsx
const customers = useMasterDataStore((s) => s.customers) as unknown as Customer[];
```

**Opsi B**: Sinkronkan type — ubah `MasterDataPage.tsx` pakai type dari store. Ini lebih bersih tapi perlu refactor lebih.

**Rekomendasi**: Pakai Opsi A dulu (cepat, aman). Nanti kalau waktu ada, refactor ke Opsi B.

#### d) Fungsi CRUD — panggil store
```tsx
// SEBELUM: (add customer)
const handleAddCustomer = () => {
  setCustomers([...customers, newData]);
};

// SESUDAH:
const handleAddCustomer = () => {
  addData('customers', newData);
};
```

---

### LANGKAH 3: Update ProspectFormPage.tsx — ganti INDUSTRIES hardcoded

**File: `frontend/src/features/prospects/ProspectFormPage.tsx`**

#### a) Ambil industri dari store
```tsx
// HAPUS:
const INDUSTRIES = [ ... ]; // line 11-23

// TAMBAH:
import { useMasterDataStore } from '@/stores/masterDataStore';
// ...
const industries = useMasterDataStore((s) => s.industries);
```

#### b) Ambil kompetitor dari store (untuk Provider Existing)
```tsx
// HAPUS:
const PROVIDER_EXISTING = [ ... ]; // line 26-32

// GANTI:
const competitors = useMasterDataStore((s) => s.competitors);
```

#### c) Ubah referensi INDUSTRIES → industries
Cari semua `INDUSTRIES.find(...)` → ganti jadi `industries.find(...)`
Cari semua `INDUSTRIES.map(...)` → ganti jadi `industries.map(...)`

#### d) Ubah referensi PROVIDER_EXISTING → competitors
```tsx
// SEBELUM:
<option value="">Tidak Ada</option>
{PROVIDER_EXISTING.map(prov => (
  <option key={prov.id} value={prov.name}>{prov.name}</option>
))}

// SESUDAH:
<option value="">Tidak Ada</option>
{competitors.map(comp => (
  <option key={comp.id} value={comp.name}>{comp.name}</option>
))}
```

---

### LANGKAH 4: Update ProspectDetailPage.tsx — ganti INDUSTRIES hardcoded

**File: `frontend/src/features/prospects/ProspectDetailPage.tsx`**

```tsx
// HAPUS:
const INDUSTRIES: Record<string, string> = { ... }; // line 10-22

// TAMBAH:
import { useMasterDataStore } from '@/stores/masterDataStore';

// Di dalam komponen:
const industries = useMasterDataStore((s) => s.industries);
const industryMap = Object.fromEntries(
  industries.map(i => [i.id, i.name])
);
```

Ganti semua `INDUSTRIES[...]` → `industryMap[...]`

---

### LANGKAH 5: Sinkronisasi silang — customer auto-save

**File: `frontend/src/features/prospects/ProspectFormPage.tsx`**

Di fungsi `saveProspect`, setelah `addCustomer(customerData)`, tambah:

```tsx
import { useMasterDataStore } from '@/stores/masterDataStore';

// Di dalam komponen:
const addMasterData = useMasterDataStore((s) => s.addData);

// Di saveProspect, setelah addCustomer(customerData):
if (customerMode === 'new') {
  addMasterData('customers', {
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

### LANGKAH 6: Hapus duplikasi type files (jika aman)

Setelah memastikan tidak ada yang import:

```bash
# Cek dulu
rg "from.*types/domain/prospect" --type ts
rg "from.*types/domain/project" --type ts

# Jika tidak ada yang pakai:
# Hapus frontend/src/types/domain/prospect.ts
# Hapus frontend/src/types/domain/project.ts
```

---

## 📐 SKEMA DATA FLOW (SESUDAH)

```
┌─────────────────────────────────────────────┐
│             masterDataStore                  │
│  (Zustand + persist localStorage)            │
│                                             │
│  industries  ───────┬─── ProspectFormPage   │
│  competitors ───────┤─── ProspectDetailPage │
│  customers   ───────┤                       │
│  categories         │                       │
│  projectStatuses    │                       │
│  documentTypes      │                       │
│  questions          │                       │
│  questionTypes      │                       │
│  periods            │                       │
│  holidays           │                       │
│  lossReasons        │                       │
│  departments        │                       │
│  users              │                       │
│  auditLogs          │                       │
│  approvalLevels     │                       │
│  notifTemplates     │                       │
└─────────────────────┴───────────────────────┘
         │
         ▼
┌─────────────────┐
│  MasterDataPage │  ← membaca dari store (read)
│  (UI tetap sama)│  ← CRUD via store methods
└─────────────────┘
```

---

## ⏱ URUTAN EKSEKUSI

| Step | File | Apa yang dilakukan | Estimasi |
|------|------|-------------------|----------|
| 1 | `masterDataStore.ts` | Tambah 9 entity baru + initial data dari MasterDataPage | 30 menit |
| 2 | `masterDataStore.ts` | Update EntityType union + INITIAL_DATA | 5 menit |
| 3 | `MasterDataPage.tsx` | Ganti 16 useState → useMasterDataStore (satu per satu) | 1-2 jam |
| 4 | `MasterDataPage.tsx` | Hapus 13 INITIAL_* arrays (sudah pindah ke store) | 10 menit |
| 5 | `ProspectFormPage.tsx` | Ganti INDUSTRIES hardcoded → store.industries | 10 menit |
| 6 | `ProspectFormPage.tsx` | Ganti PROVIDER_EXISTING hardcoded → store.competitors | 10 menit |
| 7 | `ProspectDetailPage.tsx` | Ganti INDUSTRIES hardcoded → store.industries | 10 menit |
| 8 | `ProspectFormPage.tsx` | Tambah auto-sync customer ke masterDataStore | 10 menit |
| 9 | Test | Buka semua tab, tambah/edit/delete data, refresh browser | 15 menit |

**Total**: ~3-4 jam

---

## ⚠️ HAL YANG PERLU DIPERHATIKAN

1. **Type casting**: Karena type lokal di MasterDataPage berbeda dengan type di store, perlu `as unknown as LokalType[]` sementara. Ini temporary sampai type diseragamkan nanti.

2. **Persist**: Semua data di `masterDataStore` sudah pakai `persist` middleware dengan key `kinetic-master-data`. Data survive refresh.

3. **Data awal**: Initial data di store harus persis sama dengan yang sekarang ada di MasterDataPage agar data tidak berubah saat migrasi.

4. **Backward compatibility**: Jangan hapus type lokal di MasterDataPage dulu. Nanti setelah semua jalan, baru bisa dirapikan.

5. **Penamaan field**: Ada perbedaan naming convention antara type lokal (snake_case: `industry_id`, `pic_name`) dan domain types (camelCase: `industryId`, `picName`). Untuk sekarang biarkan dulu, nanti bisa diseragamkan.
