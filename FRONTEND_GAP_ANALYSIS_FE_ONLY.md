# Frontend Gap Analysis — Kinetic CRM
## Fokus Murni Frontend (Tanpa Backend/API)

> **Dokumen ini hanya membahas kekurangan dari sisi frontend saja:**
> UI/UX, komponen, arsitektur frontend, routing, state management, navigation, code quality, accessibility, responsive design.
> Semua hal yang bergantung pada backend (API integration, real auth, database) **tidak** termasuk.

---

## 1. STATUS IMPLEMENTASI FILE

### 1.1 Komponen Library ✅ SUDAH LENGKAP

| Path | Status | Keterangan |
|------|--------|------------|
| `frontend/src/components/ui/` (12 komponen) | ✅ Lengkap | Button, Input, Select, Badge, Card, Modal, Drawer, Table, Tabs, Toast, DatePicker |
| `frontend/src/components/shared/` (6 komponen) | ✅ Lengkap | DataTable, FilterPanel, FormWrapper, GlobalSearch, Pagination, StatusBadge |
| `frontend/src/components/layout/` (6 komponen) | ✅ Lengkap | AppLayout, Breadcrumb, PageLoader, PageSkeleton, Sidebar, Topbar |

### 1.2 Stores ✅ SUDAH LENGKAP

| Store | Status | Keterangan |
|-------|--------|------------|
| `authStore.ts` | ✅ Ada | Zustand store dengan login/logout/isAuthenticated |
| `notificationStore.ts` | ✅ Ada | Zustand store untuk notifikasi |
| `uiStore.ts` | ✅ Ada | Zustand store untuk UI state |

### 1.3 Routing ✅ SUDAH LENGKAP

| File | Status | Keterangan |
|------|--------|------------|
| `router.tsx` | ✅ Lengkap | Lazy loading + Suspense per route |
| `guards.tsx` | ✅ Lengkap | ProtectedRoute + GuestRoute terhubung ke authStore |
| `nav-items.ts` | ⚠️ Parsial | Flat list — belum ada role-based filtering |
| `page-adapter.tsx` | ⚠️ Parsial | Compatibility layer — antipattern, menandakan refactoring belum selesai |

### 1.4 Halaman Feature

#### ✅ SUDAH DIIMPLEMENTASI (berisi konten UI, walau data masih mock)

| Halaman | Ukuran File | Catatan |
|---------|-------------|---------|
| `DashboardPage.tsx` | 16 KB | KPI cards, charts, approval widget |
| `ProspectsPage.tsx` | 23 KB | List + filter + table |
| `ProjectDetailPage.tsx` | **106 KB** | ⚠️ Monolitik, perlu dipecah |
| `ProjectListPage.tsx` | 7 KB | List proyek |
| `ApprovalInboxPage.tsx` | 22 KB | List approval + drawer |
| `KpiPage.tsx` | 14 KB | Dashboard KPI dasar |
| `ReportsPage.tsx` | **57 KB** | ⚠️ Monolitik, perlu dipecah |
| `MasterDataPage.tsx` | **153 KB** | ⚠️ Monolitik, perlu dipecah |
| `UsersPage.tsx` | 20 KB | Management user |
| `AuditPage.tsx` | 16 KB | Audit log |
| `NotificationsPage.tsx` | 19 KB | Notifikasi in-app |
| `ProfilePage.tsx` | 21 KB | Profil user |
| `ConfigOrgPage.tsx` | 14 KB | Organisasi |
| `ConfigStatusPage.tsx` | 13 KB | Status proyek |
| `ConfigSlaPage.tsx` | 15 KB | SLA |
| `ConfigNotifTemplatePage.tsx` | 27 KB | Template notifikasi |
| `LoginPage.tsx` | 13 KB | Login form |

#### ⚠️ File TIDAK DIIMPOR di router (tapi bukan stub penuh)

| File | Ukuran | Masalah |
|------|--------|---------|
| `MasterCompetitorPage.tsx` | 1 baris | `return null` — tidak dipakai router |
| `MasterCustomerPage.tsx` | 1 baris | `return null` — tidak dipakai router |
| `MasterQuestionPage.tsx` | 1 baris | `return null` — tidak dipakai router |
| `MasterDataLayout.tsx` | 1 baris | `return null` — tidak dipakai router |
| `ConfigLayout.tsx` | 1 baris | `return null` — tidak dipakai router |

#### ❌ HANYA STUB (`return null`) — Dipakai Router Tapi Tidak Berisi

| Halaman | Route | Masalah |
|---------|-------|---------|
| `ForgotPasswordPage.tsx` | ❌ Tidak ada di router | Form lupa password |
| `ResetPasswordPage.tsx` | ❌ Tidak ada di router | Form reset password |
| `KPIDashboardPage.tsx` | ❌ Tidak ada di router | Sub-halaman KPI |
| `KPIProgressPage.tsx` | ❌ Tidak ada di router | Sub-halaman KPI |
| `KPITargetsPage.tsx` | ❌ Tidak ada di router | Sub-halaman KPI |
| `MasterCategoryPage.tsx` | ❌ Tidak ada di router | Master kategori |
| `MasterDocTypePage.tsx` | ❌ Tidak ada di router | Master tipe dokumen |
| `MasterHolidayPage.tsx` | ❌ Tidak ada di router | Master hari libur |
| `MasterLossReasonPage.tsx` | ❌ Tidak ada di router | Master alasan gagal |
| `MasterPeriodPage.tsx` | ❌ Tidak ada di router | Master periode |
| `ConfigDashboardPage.tsx` | ❌ Tidak ada di router | Dashboard konfigurasi |
| `ConfigIntegrationPage.tsx` | ❌ Tidak ada di router | Konfigurasi integrasi |
| `ConfigPeriodPage.tsx` | ❌ Tidak ada di router | Konfigurasi periode |
| `ConfigQuestionTypesPage.tsx` | ❌ Tidak ada di router | Tipe pertanyaan |
| `ConfigRolesPage.tsx` | ❌ Tidak ada di router | Manajemen role |
| `ConfigTargetsPage.tsx` | ❌ Tidak ada di router | Target config |
| `ConfigUploadPage.tsx` | ❌ Tidak ada di router | Upload config |
| `ConfigWorkflowPage.tsx` | ❌ Tidak ada di router | Workflow config |
| `UserDetailPage.tsx` | ❌ Tidak ada di router | Detail user |
| `UserFormPage.tsx` | ❌ Tidak ada di router | Form user |
| `UserListPage.tsx` | ❌ Tidak ada di router | List user |
| `KPIReportPage.tsx` | ❌ Tidak ada di router | Report KPI |
| `PipelineReportPage.tsx` | ❌ Tidak ada di router | Pipeline report |
| `ReportsIndexPage.tsx` | ❌ Tidak ada di router | Index report |
| `WinLossReportPage.tsx` | ❌ Tidak ada di router | Win/loss report |
| `ProspectDetailPage.tsx` | ❌ Tidak ada di router | Detail prospek |
| `ProspectFormPage.tsx` | ❌ Tidak ada di router | Form prospek |
| `ProspectListPage.tsx` | ❌ Tidak ada di router | List prospek |
| `ProjectFormPage.tsx` | ❌ Tidak ada di router | Form proyek |
| `DeliveryTab.tsx` | ❌ Tidak ada di router | Tab delivery proyek |
| `DokumenTab.tsx` | ❌ Tidak ada di router | Tab dokumen proyek |
| `HargaTab.tsx` | ❌ Tidak ada di router | Tab harga proyek |
| `LphsSiosTab.tsx` | ❌ Tidak ada di router | Tab LPHS/SIOS |
| `OverviewTab.tsx` | ❌ Tidak ada di router | Tab overview proyek |
| `PemenangTab.tsx` | ❌ Tidak ada di router | Tab pemenang proyek |
| `RksTab.tsx` | ❌ Tidak ada di router | Tab RKS proyek |
| `TimelineTab.tsx` | ❌ Tidak ada di router | Tab timeline proyek |
| `ApprovalReviewDrawer.tsx` | ❌ Tidak ada di router | Drawer review approval |
| `AuditLogPage.tsx` | ❌ Tidak ada di router | Halaman audit log |

**Total file stub: 36 file** — semuanya tidak berisi implementasi, hanya `export default function X() { return null; }`

---

## 2. MASALAH ARSITEKTUR

### 2.1 Komponen Monolitik

| File | Ukuran | Idealnya |
|------|--------|----------|
| `MasterDataPage.tsx` | **153 KB** | Dipecah ke 5+ sub-page (Customer, Competitor, Question, dll.) — stub sudah siap |
| `ProjectDetailPage.tsx` | **106 KB** | Dipecah ke tab components (stub tab sudah siap) |
| `ReportsPage.tsx` | **57 KB** | Dipecah ke WinLossReportPage, PipelineReportPage, dll. — stub sudah siap |

### 2.2 Prop Drilling via PageAdapter

`page-adapter.tsx` menginjeksi props seperti `onShowNotification`, `onNavigatePage`, `onSelectProject` ke komponen halaman — **padahal zustand stores sudah tersedia**:

```tsx
// page-adapter.tsx — antipattern
interface PageProps {
  onShowNotification?: ShowNotification;  // Harusnya pake react-hot-toast langsung
  onNavigatePage?: (page: string) => void; // Harusnya pake useNavigate di komponen
  onSelectProject?: (id: string) => void;  // Harusnya pake useNavigate
  onOpenApproval?: (item: ApprovalItem) => void;
  onLoginSuccess?: (userData?: unknown) => void;
  projects?: Project[];
}
```

### 2.3 Router Tidak Konsisten

- Router pakai `ProspectsPage` (monolitik), bukan `ProspectListPage` yang sudah disiapkan
- Router pakai `UsersPage` (monolitik), bukan `UserListPage` yang sudah disiapkan
- Router pakai `AuditPage` (monolitik), bukan `AuditLogPage` yang sudah disiapkan
- Router pakai `KpiPage` (monolitik), bukan `KPIDashboardPage`
- Banyak route yang belum ada (forgot-password, reset-password, error pages)

### 2.4 TypeScript Issues

| Issue | Lokasi |
|-------|--------|
| User type pakai `unknown` | `authStore.ts:4` |
| Cast paksa `as unknown as Project[]` | `page-adapter.tsx:47` |
| Banyak `any` implicit | di beberapa file feature |

---

## 3. NAVIGASI & ROUTING

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Role-based menu** | `nav-items.ts` flat — semua user lihat menu yang sama. Config hanya hardcoded di `Sidebar.tsx` | 🔴 Critical |
| **Tidak ada error pages** | 403, 404, 500 — semua redirect ke `/dashboard` via wildcard | 🔴 Critical |
| **Tidak ada route untuk auth pages** | Forgot/Reset password tidak terdaftar di router.tsx | 🟡 High |
| **Breadcrumb belum optimal** | Breadcrumb component ada tapi label map terbatas, tidak handle dynamic segments | 🟢 Medium |
| **GlobalSearch tidak terintegrasi** | Komponen ada tapi tidak ada `Ctrl+K` shortcut di layout | 🟢 Medium |

---

## 4. UI/UX

### 4.1 Loading States

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Tidak ada skeleton/loading** | Semua feature pages tidak menampilkan loading state saat data belum ada (karena data mock langsung ada) | 🔴 Critical |
| **`PageLoader`/`PageSkeleton` tidak dipakai** | Komponen sudah ada tapi tidak digunakan di feature pages | 🔴 Critical |
| **`isLoading` prop di DataTable tidak difungsikan** | Prop ada tapi tidak pernah di-set `true` | 🟡 High |

### 4.2 Empty & Error States

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Empty state hanya teks kosong** | DataTable punya `emptyState` prop tapi tidak ada ilustrasi atau desain empty state | 🟡 High |
| **Tidak ada error boundaries** | Tidak ada ErrorBoundary wrapper per route atau per komponen | 🟡 High |
| **Tidak ada retry mechanism** | Kalau data gagal load, tidak ada tombol "Coba Lagi" | 🟡 High |

### 4.3 Mobile Responsive

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Sidebar fixed tanpa hamburger** | Sidebar `fixed h-screen` — tidak bisa di-toggle di mobile | 🔴 Critical |
| **Tabel tidak responsive** | Tidak ada card stack pattern untuk <640px | 🟡 High |
| **Form tidak single-column** | Multi-column layout tidak stack di mobile | 🟡 High |
| **Touch targets tidak dioptimasi** | Beberapa interaktif < 44px | 🟢 Medium |

### 4.4 Accessibility

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Tidak ada ARIA labels** | `aria-label`, `aria-describedby`, `aria-required` tidak ada di komponen | 🟡 High |
| **Tidak ada keyboard navigation** | Tidak support Tab, Enter, Esc, arrow keys | 🟡 High |
| **Tidak ada focus management** | Modal/drawer tidak ada focus trap, focus restoration saat close | 🟡 High |
| **Tidak ada skip-to-content** | Tidak ada link skip navigasi untuk screen reader | 🟢 Medium |
| **Color-only indicators** | Status badges hanya pakai warna, tanpa teks alternatif | 🟢 Medium |

### 4.5 Dark Mode

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Tidak didukung** | CSS tema hanya light mode, tidak ada `dark:` variant | 🟢 Medium |

---

## 5. KODE

| Issue | Detail | Prioritas |
|-------|--------|-----------|
| **Dead code (36 file stub)** | File stubs di 13 direktori feature yang tidak dipakai router mana pun | 🟡 High |
| **Bahasa tidak konsisten** | Semua label UI dalam Bahasa Inggris — MD docs menspesifikasikan Bahasa Indonesia | 🟡 High |
| **CSS tidak konsisten** | Campuran Tailwind utility & custom CSS variables (`text-green-600` vs `text-success`) | 🟢 Medium |
| **Tidak ada testing** | 0 file test (.test.ts, .spec.ts) | 🟢 Medium |

---

## 6. RINGKASAN PRIORITAS

| Prioritas | Item | Dampak |
|-----------|------|--------|
| **🔴 Critical (8)** | | |
| C1 | Pecah komponen monolitik (MasterData 153KB, ProjectDetail 106KB, Reports 57KB) | Maintainability |
| C2 | Implementasi 36 halaman stub → UI lengkap | Completeness |
| C3 | Error pages (403/404/500) + Error Boundaries | User experience |
| C4 | Loading/skeleton states di semua halaman | Professional UX |
| C5 | Mobile responsive (sidebar hamburger, card stack table) | Mobile usability |
| C6 | Role-based navigation filtering | Security UX |
| C7 | Route untuk forgot/reset password di router | Completeness |
| C8 | Hapus dependency mock data — pake store langsung | Architecture |
| **🟡 High (8)** | | |
| H1 | Empty state design di semua list/detail pages | Professional UX |
| H2 | Hapus prop drilling — pake zustand + react-hot-toast langsung | Code quality |
| H3 | Implementasi ARIA labels + keyboard navigation | Accessibility |
| H4 | Focus trap di modal/drawer | Accessibility |
| H5 | Router konsisten (pake sub-pages, bukan monolitik) | Maintainability |
| H6 | Migrasi label ke Bahasa Indonesia | Requirement |
| H7 | Pagination aktif + filter/sort UI | Functionality |
| H8 | All project tabs (Delivery, Dokumen, Harga, dll.) | Completeness |
| **🟢 Medium (5)** | | |
| M1 | Dark mode support | UX enhancement |
| M2 | GlobalSearch integration (Ctrl+K) | Productivity |
| M3 | Clean up dead code (file stubs tidak dipakai) | Maintainability |
| M4 | Konsistensi CSS (hapus raw Tailwind, pake theme variables) | Code quality |
| M5 | Breadcrumb enhancement (dynamic segments) | UX |
| **🔵 Low (3)** | | |
| L1 | Unit/integration tests | Quality |
| L2 | TypeScript strict mode + remove `any` | Code quality |
| L3 | Touch targets optimization (>44px) | Accessibility |

---

## 7. PATH LENGKAP FILE STUB

```
frontend/src/features/auth/ForgotPasswordPage.tsx          — return null
frontend/src/features/auth/ResetPasswordPage.tsx           — return null
frontend/src/features/approvals/ApprovalReviewDrawer.tsx   — return null
frontend/src/features/audit/AuditLogPage.tsx               — return null
frontend/src/features/config/ConfigDashboardPage.tsx       — return null
frontend/src/features/config/ConfigIntegrationPage.tsx     — return null
frontend/src/features/config/ConfigLayout.tsx              — return null
frontend/src/features/config/ConfigPeriodPage.tsx          — return null
frontend/src/features/config/ConfigQuestionTypesPage.tsx   — return null
frontend/src/features/config/ConfigRolesPage.tsx           — return null
frontend/src/features/config/ConfigTargetsPage.tsx         — return null
frontend/src/features/config/ConfigUploadPage.tsx          — return null
frontend/src/features/config/ConfigWorkflowPage.tsx        — return null
frontend/src/features/kpi/KPIDashboardPage.tsx             — return null
frontend/src/features/kpi/KPIProgressPage.tsx              — return null
frontend/src/features/kpi/KPITargetsPage.tsx               — return null
frontend/src/features/master-data/MasterCategoryPage.tsx   — return null
frontend/src/features/master-data/MasterCompetitorPage.tsx  — return null
frontend/src/features/master-data/MasterCustomerPage.tsx   — return null
frontend/src/features/master-data/MasterDataLayout.tsx     — return null
frontend/src/features/master-data/MasterDocTypePage.tsx    — return null
frontend/src/features/master-data/MasterHolidayPage.tsx    — return null
frontend/src/features/master-data/MasterLossReasonPage.tsx — return null
frontend/src/features/master-data/MasterPeriodPage.tsx     — return null
frontend/src/features/master-data/MasterQuestionPage.tsx   — return null
frontend/src/features/projects/ProjectFormPage.tsx         — return null
frontend/src/features/projects/tabs/DeliveryTab.tsx        — return null
frontend/src/features/projects/tabs/DokumenTab.tsx         — return null
frontend/src/features/projects/tabs/HargaTab.tsx           — return null
frontend/src/features/projects/tabs/LphsSiosTab.tsx        — return null
frontend/src/features/projects/tabs/OverviewTab.tsx        — return null
frontend/src/features/projects/tabs/PemenangTab.tsx        — return null
frontend/src/features/projects/tabs/RksTab.tsx             — return null
frontend/src/features/projects/tabs/TimelineTab.tsx        — return null
frontend/src/features/prospects/ProspectDetailPage.tsx     — return null
frontend/src/features/prospects/ProspectFormPage.tsx       — return null
frontend/src/features/prospects/ProspectListPage.tsx       — return null
frontend/src/features/reports/KPIReportPage.tsx            — return null
frontend/src/features/reports/PipelineReportPage.tsx       — return null
frontend/src/features/reports/ReportsIndexPage.tsx         — return null
frontend/src/features/reports/WinLossReportPage.tsx        — return null
frontend/src/features/users/UserDetailPage.tsx             — return null
frontend/src/features/users/UserFormPage.tsx               — return null
frontend/src/features/users/UserListPage.tsx               — return null
```

**Total: 43 file `return null`**

---

*Dokumen ini dibuat berdasarkan analisis kode di `frontend/src/` terhadap MD docs 012–059,
khususnya 058_FRONTEND_ARCHITECTURE_AND_COMPONENT_LIBRARY.md dan 014_UI_SCREEN_CATALOG.md.*
