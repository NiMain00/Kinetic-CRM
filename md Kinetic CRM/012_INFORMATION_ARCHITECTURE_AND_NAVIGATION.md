# 012 — INFORMATION ARCHITECTURE AND NAVIGATION
## KINETIC CRM — Arsitektur Informasi & Navigasi Sistem

**Versi Dokumen:** 1.0
**Tanggal:** Juni 2025
**Klasifikasi:** Confidential / Internal
**Sumber:** BA Review §D.2, PRD §4-6, FE Spec, GAP24, GAP25

---

## 1. TUJUAN DOKUMEN

Dokumen ini mendefinisikan **struktur navigasi lengkap**, hierarki halaman, pola navigasi, dan kebijakan akses per-halaman untuk KINETIC CRM. Dokumen ini menjadi acuan tunggal bagi:

- **UI/UX Designer** — untuk memetakan wireframe dan user flow
- **Frontend Developer** — untuk implementasi React Router, route guard, dan lazy loading
- **Backend Developer** — untuk memastikan endpoint tersedia untuk setiap halaman
- **QA Engineer** — untuk memastikan akses kontrol per halaman sesuai role

---

## 2. PRINSIP ARSITEKTUR INFORMASI

### 2.1 Prinsip Utama

1. **Role-first navigation**: Navigasi yang tampil disesuaikan dengan role yang login. Tidak ada item menu yang terlihat jika user tidak berhak mengaksesnya.
2. **Context-preserving**: User selalu tahu sedang di mana (breadcrumb wajib pada semua halaman level 2+).
3. **Task-oriented grouping**: Pengelompokan menu berdasarkan tugas, bukan fitur teknis.
4. **Minimal clicks to action**: Aksi utama user (approve, input data, upload) dapat dicapai dalam maksimal 3 klik dari halaman manapun.
5. **State persistence**: Filter, sort, dan paginate di halaman list disimpan sementara saat user kembali ke halaman tersebut (React Query cache).

### 2.2 Layout Sistem

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                               │
│  [Logo KINETIC CRM]    [Global Search]    [Notif Bell] [User Menu]   │
├──────────────┬───────────────────────────────────────────────────────┤
│              │                                                        │
│   SIDEBAR    │          MAIN CONTENT AREA                            │
│   (collapsible)│                                                     │
│              │  [Breadcrumb]                                          │
│  [Nav Items] │                                                        │
│              │  [Page Title + Actions]                                │
│              │                                                        │
│              │  [Content]                                             │
│              │                                                        │
│              │                                                        │
└──────────────┴───────────────────────────────────────────────────────┘
```

**Sidebar:**
- Lebar: 240px (expanded), 64px (collapsed)
- Collapsible dengan toggle button
- Pada mobile (<768px): sidebar menjadi drawer overlay
- Posisi: fixed left, z-index di atas content

**Topbar:**
- Height: 64px, fixed top
- Komponen: Logo (kiri), Global Search (tengah), Notifikasi + User Menu (kanan)

---

## 3. STRUKTUR NAVIGASI LENGKAP

### 3.1 Peta Navigasi (Sidebar Menu)

```
KINETIC CRM
│
├── 📊 Dashboard
│   └── /dashboard
│
├── 🔍 Prospek                            [cabang, pm, admin]
│   ├── /prospects (Daftar Prospek)
│   └── /prospects/new (Buat Prospek Baru)
│   └── /prospects/:id (Detail Prospek)
│
├── 📁 Proyek                             [semua role]
│   ├── /projects (Daftar Proyek)
│   ├── /projects/new (Buat Proyek Baru)  [cabang, admin]
│   └── /projects/:id (Detail Proyek)
│       ├── Tab: Overview
│       ├── Tab: RKS                      [cabang, pm, admin]
│       ├── Tab: LPHS/SIOS                [cabang, pm, dept, management, admin]
│       ├── Tab: Harga & Kompetitor       [cabang, pm, admin]
│       ├── Tab: Pemenang                 [cabang, pm, admin]
│       ├── Tab: Delivery                 [cabang, pm, admin]
│       ├── Tab: Timeline
│       └── Tab: Dokumen
│
├── ✅ Approval Inbox                     [pm, dept, management, admin]
│   └── /approvals
│
├── 📈 Target & KPI                       [management, admin]
│   ├── /kpi (Dashboard KPI)
│   ├── /kpi/targets (Setting Target)
│   └── /kpi/progress (Progress Monitoring)
│
├── 📊 Laporan                            [management, admin, pm]
│   ├── /reports (Daftar Laporan)
│   ├── /reports/win-loss (Win/Loss Report)
│   ├── /reports/pipeline (Pipeline Report)
│   └── /reports/kpi (KPI Report)
│
├── 🔔 Notifikasi                         [semua role]
│   └── /notifications
│
│── ── DIVIDER ──
│
├── ⚙️  Konfigurasi                        [admin only]
│   ├── /config/organization (Hierarki Org)
│   ├── /config/workflow (Approval Workflow)
│   ├── /config/status (Status Proyek)
│   ├── /config/roles (Role & Permission)
│   ├── /config/sla (SLA & Reminder)
│   ├── /config/targets (Target & KPI Config)
│   ├── /config/dashboard (Dashboard Config)
│   ├── /config/notifications-template (Notifikasi Template)
│   ├── /config/period (Periode Pelaporan)
│   ├── /config/question-types (Tipe Pertanyaan)
│   ├── /config/upload (Upload Config)
│   └── /config/integration (Integrasi Eksternal)
│
├── 👥 Master Data                         [admin only]
│   ├── /master/customers (Master Customer)
│   ├── /master/categories (Master Kategori Proyek)
│   ├── /master/competitors (Master Kompetitor)
│   ├── /master/document-types (Master Tipe Dokumen)
│   ├── /master/loss-reasons (Master Alasan Kekalahan)
│   ├── /master/questions (Master Pertanyaan)
│   ├── /master/periods (Master Periode)
│   └── /master/holidays (Master Hari Libur)
│
├── 👤 User Management                     [admin only]
│   ├── /users (Daftar User)
│   ├── /users/new (Tambah User)
│   └── /users/:id (Detail/Edit User)
│
└── 🔍 Audit Log                           [admin only]
    └── /audit
```

### 3.2 Halaman Auth (Di Luar Sidebar)

```
/login                  — Login Page
/forgot-password        — Forgot Password
/reset-password/:token  — Reset Password
/404                    — Not Found
/403                    — Forbidden (akses ditolak)
/500                    — Server Error
```

---

## 4. DEFINISI LENGKAP PER HALAMAN

### 4.1 Dashboard (`/dashboard`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/dashboard` |
| **Akses** | Semua role (konten berbeda per role) |
| **Redirect** | Setelah login → `/dashboard` |
| **Layout** | Grid widget responsif |

**Widget per Role:**

| Widget | cabang | pm | dept | management | admin |
|--------|--------|----|------|------------|-------|
| Proyek Aktif Saya | ✅ | ✅ | — | — | ✅ |
| Pending Approval | — | ✅ | ✅ | ✅ | ✅ |
| Progress vs Target | ✅ | — | — | ✅ | ✅ |
| Pipeline Funnel | — | ✅ | — | ✅ | ✅ |
| Win/Loss Trend | — | ✅ | — | ✅ | ✅ |
| At-Risk Projects | — | ✅ | — | ✅ | ✅ |
| Notifikasi Terbaru | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Health | — | — | — | — | ✅ |

---

### 4.2 Daftar Prospek (`/prospects`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/prospects` |
| **Akses** | `cabang` (hanya milik cabangnya), `pm` (semua prospek area), `admin` (semua) |
| **Komponen Utama** | Table (TanStack Table), Filter panel, Status badge |

**Filter yang tersedia:**
- Status: draft, waiting_pm_approval, revision, approved
- Cabang (hanya pm/admin)
- Customer
- Tanggal dibuat (range)
- Keyword search (nama prospek)

**Actions:**
- Buat Prospek Baru (tombol utama, hanya `cabang` dan `admin`)
- Klik row → Detail Prospek

**Kolom tabel:**
| Kolom | Sortable | Filterable |
|-------|----------|------------|
| Nama Prospek | ✅ | — |
| Customer | ✅ | ✅ |
| Cabang | ✅ | ✅ |
| Status | — | ✅ |
| Tanggal Dibuat | ✅ | ✅ |
| Aksi (3-dot menu) | — | — |

---

### 4.3 Form Buat/Edit Prospek (`/prospects/new`, `/prospects/:id/edit`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/prospects/new` (create), `/prospects/:id/edit` (edit) |
| **Akses** | `cabang` (hanya milik sendiri), `admin` |
| **Layout** | Single-column form dengan sticky footer actions |

**Sections Form:**
1. **Informasi Dasar**: Nama Prospek, Customer (autocomplete), Deskripsi, Estimasi Nilai
2. **Checklist Pertanyaan**: Dynamic dari master pertanyaan (tipe prospek)
3. **Actions**: Simpan Draft / Submit ke PM

---

### 4.4 Detail Prospek (`/prospects/:id`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/prospects/:id` |
| **Akses** | `cabang` (hanya milik cabangnya), `pm`, `admin` |
| **Layout** | Header info + content sections |

**Sections:**
1. **Header**: Nama, Customer, Status badge, Cabang, Tanggal
2. **Informasi Detail**: Deskripsi, Estimasi Nilai
3. **Jawaban Checklist**: Read-only atau editable tergantung status
4. **Histori Approval**: Timeline keputusan PM (approve/revisi + catatan)
5. **Review Questions PM**: Pertanyaan dari PM + jawaban cabang (jika ada revisi)
6. **Actions** (kontekstual):
   - Cabang: Edit (jika draft/revision), Submit ke PM (jika draft), Re-submit (jika revision), Buat Proyek (jika approved)
   - PM: Approve, Kirim Revisi
   - Admin: Re-assign

---

### 4.5 Daftar Proyek (`/projects`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/projects` |
| **Akses** | Semua role (data di-scope per role/cabang) |

**Filter yang tersedia:**
- Status (multi-select)
- Tipe (tender/prospecting)
- Cabang (pm/management/admin)
- Divisi (management/admin)
- Customer
- Kategori Proyek
- Periode (tanggal mulai - selesai)
- Keyword search

**Kolom tabel:**
| Kolom | Sortable | Filterable |
|-------|----------|------------|
| Nama Proyek | ✅ | — |
| Customer | ✅ | ✅ |
| Cabang | ✅ | ✅ |
| Tipe | — | ✅ |
| Status | — | ✅ |
| Deadline Tender | ✅ | — |
| Nilai Estimasi | ✅ | — |
| Tanggal Dibuat | ✅ | ✅ |

---

### 4.6 Detail Proyek (`/projects/:id`)

Ini adalah halaman paling kompleks di sistem. Menggunakan pola **Tab Navigation** dengan 8 tab.

| Atribut | Detail |
|---------|--------|
| **Route** | `/projects/:id` |
| **Akses** | Role-dependent per tab (detail di bawah) |
| **Layout** | Fixed header + scrollable tab content |

**Header Proyek (selalu terlihat):**
- Nama Proyek, Customer, Cabang
- Status badge (berwarna)
- Tipe badge (Tender / Prospecting)
- Deadline Tender (jika tender; dengan indikator merah jika ≤ 3 hari)
- Progress steps (stepper horizontal menunjukkan posisi di alur)
- Actions button (kontekstual per status dan role)

**Tab 1: Overview**
- Semua role dapat melihat
- Ringkasan: informasi dasar, nilai estimasi, PM yang ditugaskan
- AI Summary box (jika AI enabled): ringkasan proyek 3-5 kalimat dari Gemini
- Quick stats: jumlah dokumen, hari aktif, revisi count

**Tab 2: RKS**
- Dapat dilihat: cabang (pemilik), pm, admin
- Sections: Data Tender (nomor, nama, deadline), Upload Dokumen RKS, Pertanyaan Master RKS, Riwayat Review PM
- Actions: Input/Edit RKS (cabang), Submit ke PM (cabang), Approve/Revisi (pm)

**Tab 3: LPHS/SIOS**
- Dapat dilihat: cabang, pm, dept (hanya dept yang ditugaskan), management, admin
- Sections: Pilihan Departemen (cabang), Upload Draft LPHS, Upload Draft SIOS, Approval Matrix (status semua dept + PM + Management), Catatan Review per Dept
- Parallel review indicator: Progress ring menunjukkan "X/Y departemen approved"
- Targeted Revision UI: saat kirim revisi, pilih dept mana yang terdampak

**Tab 4: Harga & Kompetitor**
- Dapat dilihat: cabang (pemilik), pm, admin
- Sections: Form Harga Penawaran, Daftar Kompetitor (tambah/edit per entri), Analisis Kompetitor
- AI Insight box: analisis kompetitor dari Gemini (jika AI enabled)

**Tab 5: Pemenang**
- Dapat dilihat: cabang, pm, admin
- Sections: Input Hasil Tender (Menang/Kalah), Alasan Kekalahan (dropdown + catatan), Nilai Kontrak Final, Upload SPK
- Conditional: jika Menang → tampilkan field Nilai Kontrak + Upload SPK

**Tab 6: Delivery**
- Dapat dilihat: cabang, pm, admin
- Sections: Target Tanggal Mulai & Selesai, Progress Delivery (%), Catatan, Upload BAST
- Status: Dalam Proses / Selesai

**Tab 7: Timeline**
- Semua role dapat melihat
- Append-only log semua event proyek secara kronologis
- Filter: by event type (status change, approval, upload, comment)

**Tab 8: Dokumen**
- Semua role dapat melihat
- Grid semua dokumen yang di-upload ke proyek ini
- Filter by: Tipe Dokumen, Uploader, Tanggal
- Actions: Preview (PDF/image), Download, Lihat Versi Lama
- Version badge per dokumen

---

### 4.7 Approval Inbox (`/approvals`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/approvals` |
| **Akses** | `pm`, `dept`, `management`, `admin` |
| **Layout** | Split view (list kiri + detail kanan pada desktop) |

**List Section:**
- Terurut by: aging (terlama pending duluan)
- Filter: Tipe Approval (RKS/LPHS/dll.), Cabang, Status SLA (on-time/overdue)
- Badge merah: SLA terlewat
- Badge kuning: SLA ≤ 2 hari lagi

**Detail Section:**
- Ringkasan proyek (nama, customer, cabang, nilai)
- Dokumen yang perlu di-review (preview inline)
- Status approval departemen lain (untuk LPHS)
- Action buttons: Approve, Kirim Revisi, Delegasikan
- Form revisi: Pertanyaan dinamis + pilihan dept yang terdampak (untuk LPHS)

---

### 4.8 Target & KPI Dashboard (`/kpi`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/kpi` |
| **Akses** | `management`, `admin` |
| **Layout** | Grid widget KPI |

**Widgets:**
- Skor Performa Komposit per Cabang (traffic light)
- Progress per KPI (win rate, jumlah tender, nilai pipeline)
- Trend vs bulan lalu
- Top/Bottom performer cabang

---

### 4.9 Setting Target (`/kpi/targets`)

| Atribut | Detail |
|---------|--------|
| **Route** | `/kpi/targets` |
| **Akses** | `admin`, `management` |
| **Layout** | Form tabel per cabang × KPI |

**Sections:**
- Pilih Periode
- Grid input: Baris = Cabang/Divisi, Kolom = KPI
- Bobot KPI (editable oleh admin)
- Histori versi target

---

### 4.10 Laporan (`/reports/*`)

| Route | Nama | Akses |
|-------|------|-------|
| `/reports` | Index Laporan | management, admin, pm |
| `/reports/win-loss` | Win/Loss Report | management, admin |
| `/reports/pipeline` | Pipeline Report | management, admin, pm |
| `/reports/kpi` | KPI Report | management, admin |

Setiap halaman laporan memiliki:
- Filter panel (periode, cabang, divisi, kategori)
- Tabel data
- Chart visualisasi
- Tombol Export Excel dan Export PDF

---

### 4.11 Halaman Konfigurasi (`/config/*`)

Seluruh halaman Konfigurasi hanya dapat diakses oleh role `admin`. Struktur umum:

```
/config
├── /organization    — CFG-01: Tree hierarki Org dengan CRUD inline
├── /workflow        — CFG-02: Builder approval workflow drag-drop
├── /status          — CFG-03: Status Proyek + warna + transisi
├── /roles           — CFG-04: Role + Permission Matrix
├── /sla             — CFG-05: SLA per tahap
├── /targets         — CFG-07: Bobot KPI
├── /dashboard       — CFG-08: Widget dashboard per role
├── /notifications-template — CFG-09: Template notifikasi
├── /period          — CFG-10: Periode pelaporan
├── /question-types  — CFG-12: Tipe pertanyaan (migrasi dari localStorage)
├── /upload          — CFG-13: Upload constraints
└── /integration     — CFG-14: Integrasi eksternal
```

---

## 5. POLA NAVIGASI

### 5.1 Breadcrumb

Breadcrumb wajib ada di semua halaman level 2+. Format:

```
Dashboard > Proyek > PT Cahaya Abadi — Gedung HQ > RKS
Dashboard > Konfigurasi > Approval Workflow
Dashboard > User Management > Ahmad Fauzi
```

Implementasi: `React Router` + `useMatches` hook untuk mendapatkan path state.

### 5.2 Back Navigation

- Semua halaman detail (`:id`) memiliki tombol "← Kembali" di header
- Tombol kembali menggunakan `navigate(-1)` dengan fallback ke parent route

### 5.3 Global Search

- Shortcut keyboard: `Ctrl+K` / `Cmd+K` membuka modal search
- Search scope: Nama Proyek, Nama Prospek, Nama Customer
- Hasil: dikelompokkan per kategori (Proyek, Prospek, Customer)
- Recent searches: disimpan di localStorage (max 10 item)
- Klik hasil → navigasi ke halaman detail

### 5.4 Notification Badge & Panel

- Bell icon di topbar dengan badge count (unread notifications)
- Klik bell → dropdown panel max 5 notifikasi terbaru + link "Lihat Semua"
- "Lihat Semua" → `/notifications`
- Setiap notifikasi memiliki link deep-link ke entitas terkait (proyek/approval)

### 5.5 User Menu

Dropdown di kanan topbar:
- Avatar + Nama User + Role
- Menu: Profil Saya, Ubah Password
- Divider
- Logout (dengan konfirmasi dialog)

---

## 6. ROUTE GUARD SPECIFICATION

### 6.1 Authentication Guard

Semua route kecuali `/login`, `/forgot-password`, `/reset-password/:token` memerlukan token JWT valid.

```typescript
// AuthGuard component
const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

### 6.2 Role Guard

```typescript
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = <Navigate to="/403" replace />
}) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
```

### 6.3 Data Scope Guard (Backend Enforced)

Frontend route guard hanya mencegah navigasi ke halaman yang tidak boleh dilihat. Namun **data scope (hanya data milik cabang sendiri)** diverifikasi **ulang di backend**. Frontend TIDAK pernah menjadi satu-satunya penjaga akses data.

### 6.4 Tabel Role × Route Access

| Route | cabang | pm | dept | management | admin |
|-------|--------|----|------|------------|-------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/prospects` | ✅ (own) | ✅ | ❌ | ❌ | ✅ |
| `/projects` | ✅ (own) | ✅ | ✅ (assigned) | ✅ | ✅ |
| `/approvals` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/kpi` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/reports` | ❌ | ✅ (limited) | ❌ | ✅ | ✅ |
| `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/config/*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/master/*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/users/*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/audit` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 7. REACT ROUTER IMPLEMENTATION

### 7.1 Route Structure

```typescript
// router/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  },

  // Protected routes
  {
    path: '/',
    element: <AuthGuard><AppLayout /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      // Prospects
      {
        path: 'prospects',
        children: [
          {
            index: true,
            element: <RoleGuard allowedRoles={['cabang', 'pm', 'admin']}>
              <ProspectListPage />
            </RoleGuard>,
          },
          {
            path: 'new',
            element: <RoleGuard allowedRoles={['cabang', 'admin']}>
              <ProspectFormPage />
            </RoleGuard>,
          },
          { path: ':id', element: <ProspectDetailPage /> },
          {
            path: ':id/edit',
            element: <RoleGuard allowedRoles={['cabang', 'admin']}>
              <ProspectFormPage />
            </RoleGuard>,
          },
        ],
      },

      // Projects
      {
        path: 'projects',
        children: [
          { index: true, element: <ProjectListPage /> },
          {
            path: 'new',
            element: <RoleGuard allowedRoles={['cabang', 'admin']}>
              <ProjectFormPage />
            </RoleGuard>,
          },
          { path: ':id', element: <ProjectDetailPage /> },
        ],
      },

      // Approvals
      {
        path: 'approvals',
        element: <RoleGuard allowedRoles={['pm', 'dept', 'management', 'admin']}>
          <ApprovalInboxPage />
        </RoleGuard>,
      },

      // KPI
      {
        path: 'kpi',
        element: <RoleGuard allowedRoles={['management', 'admin']}>
          <KPILayout />
        </RoleGuard>,
        children: [
          { index: true, element: <KPIDashboardPage /> },
          { path: 'targets', element: <KPITargetsPage /> },
          { path: 'progress', element: <KPIProgressPage /> },
        ],
      },

      // Reports
      {
        path: 'reports',
        element: <RoleGuard allowedRoles={['pm', 'management', 'admin']}>
          <ReportsLayout />
        </RoleGuard>,
        children: [
          { index: true, element: <ReportsIndexPage /> },
          { path: 'win-loss', element: <WinLossReportPage /> },
          { path: 'pipeline', element: <PipelineReportPage /> },
          { path: 'kpi', element: <KPIReportPage /> },
        ],
      },

      // Notifications
      { path: 'notifications', element: <NotificationsPage /> },

      // Admin sections
      {
        path: 'config',
        element: <RoleGuard allowedRoles={['admin']}>
          <ConfigLayout />
        </RoleGuard>,
        children: [
          { path: 'organization', element: <ConfigOrgPage /> },
          { path: 'workflow', element: <ConfigWorkflowPage /> },
          { path: 'status', element: <ConfigStatusPage /> },
          { path: 'roles', element: <ConfigRolesPage /> },
          { path: 'sla', element: <ConfigSLAPage /> },
          { path: 'targets', element: <ConfigTargetsPage /> },
          { path: 'dashboard', element: <ConfigDashboardPage /> },
          { path: 'notifications-template', element: <ConfigNotifTemplatePage /> },
          { path: 'period', element: <ConfigPeriodPage /> },
          { path: 'question-types', element: <ConfigQuestionTypesPage /> },
          { path: 'upload', element: <ConfigUploadPage /> },
          { path: 'integration', element: <ConfigIntegrationPage /> },
        ],
      },

      {
        path: 'master',
        element: <RoleGuard allowedRoles={['admin']}>
          <MasterDataLayout />
        </RoleGuard>,
        children: [
          { path: 'customers', element: <MasterCustomerPage /> },
          { path: 'categories', element: <MasterCategoryPage /> },
          { path: 'competitors', element: <MasterCompetitorPage /> },
          { path: 'document-types', element: <MasterDocTypePage /> },
          { path: 'loss-reasons', element: <MasterLossReasonPage /> },
          { path: 'questions', element: <MasterQuestionPage /> },
          { path: 'periods', element: <MasterPeriodPage /> },
          { path: 'holidays', element: <MasterHolidayPage /> },
        ],
      },

      {
        path: 'users',
        element: <RoleGuard allowedRoles={['admin']}>
          <UserManagementLayout />
        </RoleGuard>,
        children: [
          { index: true, element: <UserListPage /> },
          { path: 'new', element: <UserFormPage /> },
          { path: ':id', element: <UserDetailPage /> },
        ],
      },

      {
        path: 'audit',
        element: <RoleGuard allowedRoles={['admin']}>
          <AuditLogPage />
        </RoleGuard>,
      },
    ],
  },

  // Error routes
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
```

### 7.2 Lazy Loading Strategy

```typescript
// Semua page-level component di-lazy load
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const ProjectListPage = lazy(() => import('../pages/projects/ProjectList'));
const ProjectDetailPage = lazy(() => import('../pages/projects/ProjectDetail'));
// dst.

// Wrapper dengan Suspense
const SuspenseWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageSkeleton />}>
    {children}
  </Suspense>
);
```

---

## 8. SIDEBAR NAVIGATION COMPONENT

### 8.1 Nav Item Definition

```typescript
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  allowedRoles: UserRole[];
  badge?: 'notification_count' | 'approval_count'; // dynamic badge
  children?: NavItem[];
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    allowedRoles: ['cabang', 'pm', 'dept', 'management', 'admin'],
  },
  {
    id: 'prospects',
    label: 'Prospek',
    icon: Search,
    path: '/prospects',
    allowedRoles: ['cabang', 'pm', 'admin'],
  },
  {
    id: 'projects',
    label: 'Proyek',
    icon: FolderOpen,
    path: '/projects',
    allowedRoles: ['cabang', 'pm', 'dept', 'management', 'admin'],
  },
  {
    id: 'approvals',
    label: 'Approval Inbox',
    icon: CheckSquare,
    path: '/approvals',
    allowedRoles: ['pm', 'dept', 'management', 'admin'],
    badge: 'approval_count',
  },
  {
    id: 'kpi',
    label: 'Target & KPI',
    icon: TrendingUp,
    path: '/kpi',
    allowedRoles: ['management', 'admin'],
  },
  {
    id: 'reports',
    label: 'Laporan',
    icon: BarChart2,
    path: '/reports',
    allowedRoles: ['pm', 'management', 'admin'],
  },
  {
    id: 'notifications',
    label: 'Notifikasi',
    icon: Bell,
    path: '/notifications',
    allowedRoles: ['cabang', 'pm', 'dept', 'management', 'admin'],
    badge: 'notification_count',
  },
  // Admin section
  {
    id: 'config',
    label: 'Konfigurasi',
    icon: Settings,
    path: '/config/organization',
    allowedRoles: ['admin'],
    dividerBefore: true,
    children: [/* sub-items */],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Database,
    path: '/master/customers',
    allowedRoles: ['admin'],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    path: '/users',
    allowedRoles: ['admin'],
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: FileText,
    path: '/audit',
    allowedRoles: ['admin'],
  },
];
```

### 8.2 Sidebar Rendering Logic

```typescript
const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  // Filter nav items berdasarkan role user
  const visibleItems = NAV_ITEMS.filter(item =>
    item.allowedRoles.includes(user.role)
  );

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Logo collapsed={isSidebarCollapsed} />
      <nav>
        {visibleItems.map(item => (
          <NavItemComponent key={item.id} item={item} collapsed={isSidebarCollapsed} />
        ))}
      </nav>
      <CollapseToggle onClick={toggleSidebar} />
    </aside>
  );
};
```

---

## 9. NAVIGASI MOBILE

### 9.1 Breakpoint Strategy

| Breakpoint | Layout | Sidebar |
|------------|--------|---------|
| < 768px (mobile) | Single column | Hidden by default; drawer overlay saat dibuka |
| 768px–1024px (tablet) | Side-by-side | Collapsed (icons only) by default |
| > 1024px (desktop) | Full layout | Expanded (icons + labels) by default |

### 9.2 Mobile Bottom Tab (Opsional Fase 2)

Untuk role `cabang` dan `pm` pada mobile, dapat ditambahkan bottom navigation dengan 4 item paling sering diakses:
- Dashboard, Proyek, Approval (jika pm), Notifikasi

---

## 10. ERROR STATES DAN EMPTY STATES

### 10.1 Empty State per Halaman

| Halaman | Empty State Message | Action |
|---------|---------------------|--------|
| Daftar Proyek | "Belum ada proyek. Mulai dengan membuat proyek baru." | Tombol "Buat Proyek" |
| Daftar Prospek | "Belum ada prospek. Tambahkan prospek pertama Anda." | Tombol "Buat Prospek" |
| Approval Inbox | "Tidak ada approval yang pending. Semuanya sudah beres! 🎉" | — |
| Daftar Notifikasi | "Tidak ada notifikasi baru." | — |
| Hasil Pencarian | "Tidak ada hasil untuk '[query]'. Coba kata kunci lain." | — |

### 10.2 Error State

- **Network error**: Banner kuning di atas halaman "Koneksi bermasalah. Data mungkin tidak terkini."
- **API error 500**: Inline error dengan tombol "Coba Lagi"
- **API error 403**: Redirect ke `/403`
- **API error 404**: Redirect ke `/404`

---

## 11. DEEP LINK SPECIFICATION

Deep link digunakan oleh sistem notifikasi untuk mengarahkan user langsung ke entitas terkait.

| Event Notifikasi | Deep Link Tujuan |
|-----------------|-----------------|
| Prospek disubmit (untuk PM) | `/prospects/:id` |
| RKS disubmit (untuk PM) | `/projects/:id?tab=rks` |
| LPHS perlu review (untuk Dept) | `/projects/:id?tab=lphs` |
| LPHS semua dept selesai (untuk Management) | `/projects/:id?tab=lphs` |
| Deadline tender approaching | `/projects/:id` |
| SLA approval terlewat | `/approvals` |
| Approval di-re-assign | `/approvals` |

**Query parameter `?tab=X`** digunakan untuk membuka tab tertentu di halaman detail proyek secara langsung.

---

## 12. BREADCRUMB MAPPING

| Path | Breadcrumb |
|------|------------|
| `/dashboard` | Dashboard |
| `/prospects` | Prospek |
| `/prospects/new` | Prospek > Buat Baru |
| `/prospects/:id` | Prospek > [Nama Prospek] |
| `/projects` | Proyek |
| `/projects/new` | Proyek > Buat Baru |
| `/projects/:id` | Proyek > [Nama Proyek] |
| `/approvals` | Approval Inbox |
| `/kpi` | Target & KPI |
| `/kpi/targets` | Target & KPI > Setting Target |
| `/kpi/progress` | Target & KPI > Monitoring Progress |
| `/reports` | Laporan |
| `/reports/win-loss` | Laporan > Win/Loss |
| `/reports/pipeline` | Laporan > Pipeline |
| `/config/organization` | Konfigurasi > Hierarki Organisasi |
| `/config/workflow` | Konfigurasi > Approval Workflow |
| `/users` | User Management |
| `/users/:id` | User Management > [Nama User] |
| `/audit` | Audit Log |
