# Rencana Perbaikan Konfigurasi — Kinetic CRM
## Menyatukan Config & Features dalam Satu Ekosistem Data

---

## Ringkasan Masalah

| Aspek | Kondisi Saat Ini |
|-------|-----------------|
| **Config Pages (11 halaman)** | Semua UI sudah jadi, tapi data hanya di `useState` lokal — hilang saat refresh |
| **Feature Pages** | Tidak membaca data dari config — semua value **hardcoded** (status, branch, SLA, period, dll) |
| **Hook & Service** | `useConfig()` no-op, `configService` kosong |
| **API Client** | `apiClient` sudah ada (axios), tapi belum digunakan |
| **Satu-satunya yang persist** | `ConfigRolesPage` via `masterDataStore` (Zustand + localStorage) |

---

## Visi: Arsitektur Data Terpadu

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND APP                        │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────────┐   │
│  │  CONFIG PAGES     │    │   FEATURE PAGES       │   │
│  │  (Admin: Super    │    │   (Projects,          │   │
│  │   Admin only)     │    │    Prospects,          │   │
│  │                   │    │    Approvals,          │   │
│  │  • Org            │    │    KPI, Reports,       │   │
│  │  • Status         │    │    Users, dll)         │   │
│  │  • NotifTemplate  │    │                        │   │
│  │  • SLA            │    │   CONSUME data from    │   │
│  │  • Roles          │───▶│   configStore, NOT     │   │
│  │  • Targets        │    │   hardcoded values     │   │
│  │  • Workflow       │    │                        │   │
│  │  • Integration    │    │   • StatusBadge dari   │   │
│  │  • Upload         │    │     config statuses    │   │
│  │  • Period         │    │   • Branch/Dept dari   │   │
│  │  • QuestionTypes  │    │     config org units   │   │
│  └────────┬─────────┘    │   • SLA dari config     │   │
│           │              │   • Period dari config  │   │
│           ▼              │   • Target dari config  │   │
│  ┌──────────────────┐    │   • DLL                 │   │
│  │   configStore     │    └──────────────────────┘   │
│  │  (Zustand+persist │                                 │
│  │   → localStorage) │                                 │
│  └──────────────────┘                                 │
│                                                      │
│  Ketika backend tersedia: cukup ganti source di      │
│  configService dari localStorage ke API              │
└─────────────────────────────────────────────────────┘
```

---

## Peta Integrasi Config → Fitur

Berikut mapping SETIAP entity config ke seluruh feature pages yang membutuhkannya:

| Config Entity | Feature Pages yang Terdampak | File Kunci |
|--------------|------------------------------|------------|
| **Status Proyek** (code, label, color) | Projects (list, detail, filter, fase), Prospects (badge), KPI (slicing status) | `ProjectListPage`, `ProjectDetailPage`, `OverviewTab`, `ProspectsPage`, `ProspectDetailPage`, `KPIDashboardPage` |
| **Organisasi** (branch, department) | Users (form/detail), Prospects (form/detail), Projects (detail), Reports (filter), KPI (department breakdown), Dashboard | `UsersPage`, `UserFormPage`, `ProspectFormPage`, `ReportsPage`, `KPIProgressPage`, `DashboardPage` |
| **Role & Permission** | Auth (login), Route guards (RoleRoute), Users (role assignment), All features (UI visibility) | `guards.tsx`, `LoginPage`, `UsersPage`, `ConfigRolesPage`, router |
| **SLA Rules** | Approvals (badge, deadline, warna), Dashboard (SLA widget), KPI (SLA compliance) | `ApprovalInboxPage`, `ApprovalReviewDrawer`, `DashboardPage`, `KPIDashboardPage` |
| **Notif Template** | Notifications (display), Projects (trigger), Prospects (trigger) | `NotificationsPage`, `ReviewRksTab`, `LphsSiosTab`, `ProspectDetailPage` |
| **KPI Target** | KPI pages (dashboard, progress, targets, report), Approvals KPI | `KPIDashboardPage`, `KPIProgressPage`, `KPITargetsPage`, `KPIReportPage` |
| **Fiscal Period** | KPI (filter), Targets (filter), Master Data (period) | `ConfigTargetsPage`, `KPIReportPage`, `MasterPeriodPage`, `MasterDataPage` |
| **Question Types** | Master Questions (assignment), Prospects (form rendering), Projects (RKS/Review tab) | `MasterQuestionPage`, `ProspectFormPage`, `RksTab`, `ReviewRksTab` |
| **Upload Settings** | Projects (RKS upload, Dokumen tab), Prospects (future) | `RksTab`, `DokumenTab`, `LphsSiosTab` |
| **Workflow** | Projects (fase/phase transitions), Prospects (conversion) | `ProjectDetailPage` (nextPhaseMap) |
| **Integration** | BELUM digunakan oleh feature pages (standalone) | — |

---

## Tahapan Implementasi (8 Phase)

---

### Phase 0: Foundation — Config Store & Shared Types
**File baru:** `frontend/src/stores/configStore.ts`
**File diubah:** `frontend/src/types/domain/config.ts` (baru)

**Kegiatan:**
1. Buat file `types/domain/config.ts` berisi semua interface untuk config entities
2. Buat `configStore.ts` dengan Zustand + persist middleware (key: `kinetic-config`)
3. Isi initial data dari semua halaman config yang saat ini hardcoded
4. Sediakan action: `get`, `add`, `update`, `delete`, `toggle` untuk tiap entity

**Entity yang ditampung:**
- `ProjectStatus[]` — untuk ConfigStatusPage + Projects/Prospects
- `OrgUnit[]` — untuk ConfigOrgPage + Users/Prospects/Reports
- `SlaRule[]` — untuk ConfigSlaPage + Approvals/Dashboard
- `NotifTemplate[]` — untuk ConfigNotifTemplatePage + Notifications
- `KpiTarget[]` — untuk ConfigTargetsPage + KPI pages
- `FiscalPeriod[]` — untuk ConfigPeriodPage + KPI/Targets
- `QuestionType[]` — untuk ConfigQuestionTypesPage + MasterData/Prospects
- `UploadSettings` — untuk ConfigUploadPage + Projects upload
- `WorkflowDefinition[]` — untuk ConfigWorkflowPage + Projects
- `Connector[]` — untuk ConfigIntegrationPage
- `AppRole[]` — ROLE + PERMISSION digabung (lanjutan dari masterDataStore)

---

### Phase 1: Migrasi Semua Config Pages ke Config Store
**File diubah:** 11 config page files

**Kegiatan per halaman:**
| Halaman | Ganti `useState` dengan | Catatan |
|---------|------------------------|---------|
| `ConfigStatusPage` | `configStore.projectStatuses` + `addStatus()/updateStatus()/toggleStatus()` | Persist create, edit, toggle |
| `ConfigOrgPage` | `configStore.orgUnits` + `addUnit()/updateUnit()` | Tree + form benar-benar simpan |
| `ConfigRolesPage` | `configStore.roles` + tambah `createRole()/deleteRole()` | Tambah fitur create/delete, tidak hanya edit permission |
| `ConfigNotifTemplatePage` | `configStore.notifTemplates` + action CRUD | Drawer edit persist; "New Template" pakai form |
| `ConfigSlaPage` | `configStore.slaRules` + action CRUD | Drawer add/edit persist |
| `ConfigTargetsPage` | `configStore.kpiTargets` + action CRUD | Drawer add/edit persist |
| `ConfigWorkflowPage` | `configStore.workflows` + action CRUD | Tambah drawer untuk edit/add workflow step |
| `ConfigIntegrationPage` | `configStore.connectors` + `toggleConnector()/testConnection()` | Test Connection beneran update timestamp |
| `ConfigUploadPage` | `configStore.uploadSettings` + `updateSettings()` | Save benar-benar persist |
| `ConfigPeriodPage` | `configStore.fiscalPeriods` + action CRUD | Toggle status persist, cuma 1 aktif |
| `ConfigQuestionTypesPage` | `configStore.questionTypes` + action CRUD | Modal add/edit persist |

**Aturan:** Tampilan UI TIDAK BOLEH BERUBAH — hanya sumber data yang diganti.

---

### Phase 2: Shared Hooks & Selectors
**File baru:** `frontend/src/hooks/useConfigData.ts`
**File diubah:** `frontend/src/hooks/queries/useConfig.ts`

**Kegiatan:**
1. Buat hook per entity yang langsung membaca dari configStore:
   - `useProjectStatuses()` → return `ProjectStatus[]`
   - `useOrgUnits()` → return `OrgUnit[]`
   - `useSlaRules()` → return `SlaRule[]`
   - `useFiscalPeriods()` → return `FiscalPeriod[]`
   - `useQuestionTypes()` → return `QuestionType[]`
   - `useUploadSettings()` → return `UploadSettings`
   - `useAppRoles()` → return `AppRole[]`
   - `useNotifTemplates()` → return `NotifTemplate[]`
   - `useKpiTargets(period)` → return filtered `KpiTarget[]`

2. Buat helper selectors di hooks:
   - `useStatusByCode(code)` → single status object
   - `useOrgUnitById(id)` → single org unit
   - `useSlaForEntity(entityType)` → matching SLA rule
   - `useActivePeriod()` → period with `isActive: true`
   - `useActiveOrgUnits()` → hanya yang active

**Tujuan:** Semua feature pages pakai hooks ini, bukan hardcoded data.

---

### Phase 3: Integrasi #1 — Status Proyek → Projects & Prospects
**File diubah:**
- `features/projects/ProjectListPage.tsx`
- `features/projects/ProjectDetailPage.tsx`
- `features/projects/tabs/OverviewTab.tsx`
- `features/projects/tabs/*.tsx` (RksTab, ReviewRksTab, LphsSiosTab, PemenangTab, DeliveryTab)
- `features/prospects/ProspectsPage.tsx`
- `features/prospects/ProspectDetailPage.tsx`
- `features/prospects/ProspectListPage.tsx`
- `components/shared/StatusBadge.tsx`

**Kegiatan:**
1. **StatusBadge.tsx** — Ganti `statusVariantMap` hardcoded dengan lookup ke configStore:
   ```ts
   // Sebelum: hardcoded map
   const statusVariantMap = { new: 'info', contacted: 'warning', ... }
   
   // Sesudah: dynamic dari config
   const statuses = useProjectStatuses();
   const config = statuses.find(s => s.code === status);
   const variant = config?.variant || 'default';
   ```

2. **ProjectListPage** — Ganti `statusTabs` hardcoded dengan dynamic dari configStore
3. **ProjectDetailPage** — Ganti `statusStepMap` dan `nextPhaseMap` dengan dynamic dari configStore workflow
4. **ProspectsPage** — Ganti `statusColor` mapping dengan lookup dari configStore
5. **Semua tab projects** — Ganti status string hardcoded dengan constant dari config

---

### Phase 4: Integrasi #2 — Organisasi → Users, Prospects, Reports
**File diubah:**
- `features/users/UsersPage.tsx`
- `features/users/UserListPage.tsx`
- `features/users/UserFormPage.tsx`
- `features/users/UserDetailPage.tsx`
- `features/prospects/ProspectFormPage.tsx`
- `features/prospects/ProspectDetailPage.tsx`
- `features/reports/ReportsPage.tsx`
- `features/reports/PipelineReportPage.tsx`
- `features/kpi/KPIProgressPage.tsx`
- `features/dashboard/DashboardPage.tsx`
- `types/domain/index.ts` (hapus `BRANCHES` constant)

**Kegiatan:**
1. Hapus `BRANCHES` hardcoded dari `types/domain/index.ts`
2. Semua branch selector di form → baca dari `useOrgUnits().filter(u => u.type === 'branch')`
3. Semua department selector → baca dari `useOrgUnits().filter(u => u.type === 'department')`
4. Branch display di detail pages → lookup nama dari configStore

---

### Phase 5: Integrasi #3 — SLA → Approvals & Dashboard
**File diubah:**
- `features/approvals/ApprovalInboxPage.tsx`
- `features/approvals/ApprovalReviewDrawer.tsx`
- `features/dashboard/DashboardPage.tsx`
- `features/kpi/KPIDashboardPage.tsx`

**Kegiatan:**
1. **ApprovalInboxPage** — `slaBadgeClass` → baca threshold dari `useSlaForEntity(entityType)`:
   ```ts
   const sla = useSlaForEntity(item.type === 'Prospek' ? 'prospek' : item.type === 'RKS' ? 'rks' : 'lphs');
   const status = item.waitingSince > sla.criticalThreshold ? 'Overdue' : '...';
   ```
2. **Dashboard** — SLA widget ambil data dari configStore, bukan hardcoded
3. **KPIDashboardPage** — target SLA compliance dari `useKpiTargets()`

---

### Phase 6: Integrasi #4 — Period & KPI Targets
**File diubah:**
- `features/kpi/KPIDashboardPage.tsx`
- `features/kpi/KPIProgressPage.tsx`
- `features/kpi/KPITargetsPage.tsx`
- `features/kpi/KPIReportPage.tsx`
- `features/reports/KPIReportPage.tsx`

**Kegiatan:**
1. Period filter di semua KPI pages → baca dari `useFiscalPeriods()`
2. Target values → baca dari `useKpiTargets(selectedPeriod)`
3. KPI achievement calculation → banding actual vs target dari configStore
4. Target baru bisa ditambahkan lewat ConfigTargetsPage (sudah persist)

---

### Phase 7: Integrasi #5 — Question Types → Master Data & Form Rendering
**File diubah:**
- `features/master-data/MasterQuestionPage.tsx`
- `features/master-data/MasterDataPage.tsx`
- `features/prospects/ProspectFormPage.tsx`
- `features/projects/tabs/RksTab.tsx`
- `features/projects/tabs/ReviewRksTab.tsx`

**Kegiatan:**
1. Question types → baca dari `useQuestionTypes()` bukan dari `masterDataStore`
2. Pastikan tipe pertanyaan yang dikelola di `ConfigQuestionTypesPage` langsung muncul di form prospek
3. Form rendering engine (text, textarea, radio, checkbox, select, number, date) — ambil dari config

---

### Phase 8: Integrasi #6 — Permission-Based Access Control
**File diubah:**
- `routes/guards.tsx`
- `routes/router.tsx`
- `routes/page-adapter.tsx`
- `features/auth/LoginPage.tsx`
- `features/users/UsersPage.tsx`
- AppLayout, Sidebar, Topbar

**Kegiatan:**
1. **RoleRoute** → upgrade jadi **PermissionRoute** (cek granular permissions, bukan cuma role name)
2. **ProtectedRoute** → tambah permission check untuk akses halaman
3. **LoginPage** — role yang dipilih harus valid dari configStore.roles
4. **Sidebar/nav-items** — filter menu berdasarkan permissions, bukan role name
5. **Semua halaman** — tombol/fitur yang butuh permission tertentu jadi hidden/disabled

---

## Struktur File Akhir

```
frontend/src/
├── stores/
│   ├── configStore.ts          ★ NEW — Semua config data persist
│   ├── masterDataStore.ts      (existing — untuk master data saja)
│   ├── authStore.ts            (existing)
│   └── notificationStore.ts    (existing)
├── types/
│   └── domain/
│       ├── config.ts           ★ NEW — Interface config entities
│       ├── users.ts            (existing — SlaConfig, KpiTarget)
│       ├── index.ts            (existing — HAPUS BRANCHES constant)
│       └── ...
├── hooks/
│   ├── useConfigData.ts        ★ NEW — Selectors per entity
│   └── queries/
│       └── useConfig.ts        (REFACTOR — jadi propsing ke store)
├── services/
│   └── config.ts               (REFACTOR — API service dengan fallback store)
├── features/
│   ├── config/                 (11 files — REFACTOR: pake configStore)
│   ├── projects/               (REFACTOR: status, phase, question dari store)
│   ├── prospects/              (REFACTOR: status, branch, question dari store)
│   ├── approvals/              (REFACTOR: SLA dari store)
│   ├── kpi/                    (REFACTOR: target, period dari store)
│   ├── users/                  (REFACTOR: branch, dept, role dari store)
│   ├── reports/                (REFACTOR: branch filter dari store)
│   ├── dashboard/              (REFACTOR: SLA, branch dari store)
│   └── master-data/            (REFACTOR: question types dari store)
├── components/
│   └── shared/
│       └── StatusBadge.tsx     (REFACTOR: dynamic dari configStore)
└── routes/
    ├── guards.tsx              (REFACTOR: permission-based)
    ├── router.tsx              (minor: permission routing)
    └── nav-items.ts            (REFACTOR: filter by permission)
```

---

## Prioritas & Urutan Pengerjaan

| Prioritas | Phase | Dampak | Estimasi |
|-----------|-------|--------|----------|
| 🔴 P0 | **Phase 0: Foundation** | Foundation — semua phase lain dependen | 1 hari |
| 🔴 P0 | **Phase 1: Config Pages** | Config admin bisa persist | 1 hari |
| 🟡 P1 | **Phase 2: Shared Hooks** | Foundation untuk konsumsi data | 0.5 hari |
| 🟡 P1 | **Phase 3: Status → Projects** | Dampak terbesar, paling banyak diakses | 1.5 hari |
| 🟡 P1 | **Phase 4: Org → Users/Prospects** | Branch/department dynamic | 1 hari |
| 🟢 P2 | **Phase 5: SLA → Approvals** | Approval jadi realtime SLA | 0.5 hari |
| 🟢 P2 | **Phase 6: Period → KPI** | KPI target dynamic per period | 0.5 hari |
| 🔵 P3 | **Phase 7: QuestionTypes** | Question dynamic rendering | 0.5 hari |
| 🔵 P3 | **Phase 8: Permission** | Security upgrade | 1 hari |
| | **Total estimasi** | | **~7.5 hari** |

---

## Daftar File yang Berubah (Lengkap)

### New Files (3):
1. `frontend/src/types/domain/config.ts` — Interface definitions
2. `frontend/src/stores/configStore.ts` — Zustand store with persist
3. `frontend/src/hooks/useConfigData.ts` — Shared selectors

### Modified Config Files (11):
4. `frontend/src/features/config/ConfigStatusPage.tsx`
5. `frontend/src/features/config/ConfigOrgPage.tsx`
6. `frontend/src/features/config/ConfigRolesPage.tsx`
7. `frontend/src/features/config/ConfigNotifTemplatePage.tsx`
8. `frontend/src/features/config/ConfigSlaPage.tsx`
9. `frontend/src/features/config/ConfigTargetsPage.tsx`
10. `frontend/src/features/config/ConfigWorkflowPage.tsx`
11. `frontend/src/features/config/ConfigIntegrationPage.tsx`
12. `frontend/src/features/config/ConfigUploadPage.tsx`
13. `frontend/src/features/config/ConfigPeriodPage.tsx`
14. `frontend/src/features/config/ConfigQuestionTypesPage.tsx`

### Modified Feature Files (25+):
15. `frontend/src/components/shared/StatusBadge.tsx`
16. `frontend/src/features/projects/ProjectListPage.tsx`
17. `frontend/src/features/projects/ProjectDetailPage.tsx`
18-24. `frontend/src/features/projects/tabs/*.tsx` (7 files)
25. `frontend/src/features/prospects/ProspectsPage.tsx`
26. `frontend/src/features/prospects/ProspectDetailPage.tsx`
27. `frontend/src/features/prospects/ProspectListPage.tsx`
28. `frontend/src/features/prospects/ProspectFormPage.tsx`
29. `frontend/src/features/approvals/ApprovalInboxPage.tsx`
30. `frontend/src/features/approvals/ApprovalReviewDrawer.tsx`
31. `frontend/src/features/kpi/KPIDashboardPage.tsx`
32. `frontend/src/features/kpi/KPIProgressPage.tsx`
33. `frontend/src/features/kpi/KPITargetsPage.tsx`
34. `frontend/src/features/kpi/KPIReportPage.tsx`
35. `frontend/src/features/users/UsersPage.tsx` (dan varian lainnya)
36. `frontend/src/features/users/UserFormPage.tsx`
37. `frontend/src/features/users/UserDetailPage.tsx`
38. `frontend/src/features/reports/ReportsPage.tsx`
39. `frontend/src/features/dashboard/DashboardPage.tsx`
40. `frontend/src/features/master-data/MasterQuestionPage.tsx`
41. `frontend/src/features/master-data/MasterDataPage.tsx`

### Modified Infrastructure Files (7):
42. `frontend/src/hooks/queries/useConfig.ts`
43. `frontend/src/services/config.ts`
44. `frontend/src/routes/guards.tsx`
45. `frontend/src/routes/router.tsx`
46. `frontend/src/routes/nav-items.ts`
47. `frontend/src/types/domain/index.ts` (hapus BRANCHES)
48. `frontend/src/types/domain/users.ts`

### No Changes:
- `frontend/src/features/config/ConfigDashboardPage.tsx` — sudah ok
- `frontend/src/features/config/ConfigLayout.tsx` — sudah ok
- `frontend/src/services/api-client.ts` — sudah ok
- `frontend/src/stores/authStore.ts` — sudah ok
- `frontend/src/stores/notificationStore.ts` — bisa dipakai bersama

---

## Verifikasi & Testing

Setelah implementasi, verifikasi dengan skenario berikut:

### Test Config Admin:
1. Buka tiap halaman config → lakukan CRUD → refresh → data tetap ada
2. Tutup browser → buka lagi → data tetap ada

### Test Feature Integration:
3. **Projects** — filter status, status badge, phase transition → ambil dari config
4. **Prospects** — status badge, branch dropdown → ambil dari config
5. **Users** — role, branch, department dropdown → ambil dari config
6. **Approvals** — SLA badge warna/status → ambil dari config
7. **KPI** — period filter, target values → ambil dari config
8. **Dashboard** — SLA widget, branch display → ambil dari config

### Test Edge Cases:
9. Hapus status di ConfigStatusPage → Projects filter otomatis berubah
10. Non-aktifkan branch di ConfigOrgPage → tidak muncul di dropdown Users
11. Ganti SLA threshold → Approval badge langsung berubah
12. Tambah period baru → langsung muncul di filter KPI

---

## Catatan Penting

1. **Tampilan tidak berubah** — seluruh UI dan styling tetap identik, hanya sumber data yang diubah
2. **Zero backend dependency** — semua data persist ke localStorage via Zustand middleware
3. **API ready** — service layer sudah siap ketika backend tersedia, cukup ganti source di configService
4. **Progressive** — bisa dikerjakan per phase, setiap phase selesai langsung memberikan value
5. **Backward compatible** — tidak ada perubahan API/signature yang break existing code
