# Frontend Improvement Plan — Kinetic CRM

## Executive Summary

Proyek Kinetic CRM sudah memiliki fondasi frontend yang solid dengan arsitektur feature-based, komponen terstruktur, dan state management yang jelas. Namun, setelah audit menyeluruh, ditemukan **ketidakkonsistenan UI/UX yang signifikan**, **banyak komponen duplikat**, **beberapa halaman belum mature**, **flow bisnis belum terkoneksi secara utuh**, dan **belum ada integrasi API riil**.

Prioritas utama: konsolidasi UI, koneksi flow bisnis, dan persiapan integrasi API.

---

## Current Project Condition

| Aspek | Kondisi |
|---|---|
| Framework | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first, tanpa config file) |
| Routing | react-router-dom v7, lazy-loaded, guarded (role & permission) |
| State (client) | Zustand (12 store) dengan `persist` middleware |
| State (server) | TanStack React Query (5 query hooks, 4 mutation hooks) |
| Forms | react-hook-form + Zod (via shared package) |
| UI Library | Custom built (13 atomic + 9 shared + 4 layout = 26 komponen) |
| API Layer | Axios + interceptor, endpoint `/api/v1` — **semua data masih mock** |
| Testing | **Tidak ada satupun file test** |
| Dark Mode | ✅ Full support via CSS variables + `.dark` class |
| Responsive | ✅ Mobile-first, breakpoint 768px |
| Code Splitting | ✅ 66 JS chunks via `React.lazy()` |
| Container | ✅ Docker multi-stage build |

---

## Frontend Progress Assessment

### Halaman yang Already Mature dan Stabil

| Halaman | Alasan |
|---|---|
| **DashboardPage** | Fitur lengkap (4 stat card, chart batang, donut chart, tabel approval pending, deadline kritis). Responsif. Menggunakan tema CSS variabel. |
| **ProjectListPage** | Filter + search + status tabs + summary stat cards + table. Menggunakan `StatusBadge`, `FilterPanel`, `Button`, `Input`, `Card`. |
| **ProjectDetailPage** | Arsitektur multi-tab (10 tab), stepper dinamis, tab locking, integrasi approval + timeline. Paling kompleks dan matang. |
| **OverviewTab (project)** | Informasi proyek + progress bar + ringkasan cepat + tanggal penting. Layout grid rapi. |
| **TimelineTab** | Timeline visual dengan filter, badge event type, diff view untuk revisi. |
| **DokumenTab** | Upload drawer + group accordion + stat cards. Komponen drawer custom berfungsi. |
| **ConfigDashboardPage** | Grid navigasi dengan ikon, deskripsi, hover effect. Sederhana dan bersih. |
| **Error Pages** (403/404/500) | Ada semua, meski implementasinya sederhana. |
| **Auth guards** | ProtectedRoute, GuestRoute, RoleRoute, PermissionRoute — implementasi bersih. |

### Halaman yang Masih Membutuhkan Perbaikan

| Halaman | Masalah |
|---|---|
| **LoginPage** | Menggunakan skema warna `slate`/`blue` berbeda dari tema utama. Mock login hardcoded. Tidak menggunakan komponen `Input` atau `Button`. |
| **ProspectListPage** | Tidak menggunakan shared `Table` atau `DataTable`. Pagination dan filter manual. HTML breadcrumb inline. Tidak menggunakan `StatusBadge`. |
| **ProspectFormPage** | Tidak ada (file tidak ditemukan di audit path? Ada `ProspectFormPage.tsx` tapi belum dibaca). Kemungkinan serupa dengan ProjectFormPage. |
| **ProjectFormPage** | Tidak menggunakan `FormWrapper`. Inline breadcrumb. Inline form field dengan CSS manual. Tidak ada drawer/modal untuk select client. |
| **ApprovalInboxPage** | Sangat kompleks tapi tidak menggunakan komponen shared. Inline table, inline filter button, inline metrics card. SLA parsing manual dari string. |
| **MasterDataPage** | **Halaman terbesar dan paling bermasalah.** 900+ baris dalam satu file. Tabel inline, drawer inline, tidak ada komponen reuse. Hardcoded `text-slate-*`. |
| **MasterCustomerPage** | Lebih baik dari MasterDataPage tapi masih inline table + modal manual. |
| **ReportsIndexPage** | Semua data statis hardcoded. Tidak ada visualisasi nyata. |
| **WinLossReportPage** | Belum dibaca, kemungkinan juga statis. |
| **PipelineReportPage** | Belum dibaca, kemungkinan juga statis. |
| **KPIDashboardPage** | Belum dibaca — ditengarai masih dasar. |
| **KPIProgressPage** | Belum dibaca. |
| **KPITargetsPage** | Belum dibaca. |
| **NotificationsPage** | Menggunakan `text-slate-*` hardcoded. Layout grid kiri/kanan tidak konsisten dengan template halaman lain. Tidak menggunakan komponen shared. |
| **ProfilePage** | Hardcoded `text-slate-*`. Password modal inline. Simulasi avatar cycling. Data statis. Tidak menggunakan `Modal`, `Drawer`, `FormWrapper`. |
| **UsersPage** | Mungkin masih inline (belum dibaca detail). |
| **Config*Pages** | Mungkin pattern mirip MasterData. |
| **ChatTab** | Ada 3 file komponen (ChatInput, ChatMembersPanel, ChatMessageItem) — perlu dicek fungsionalitasnya. |

---

## Existing Features Review

### Modul Prospek (Prospect)
| Fitur | Status |
|---|---|
| List prospek | ✅ Ada, tapi inline table |
| Filter by status | ✅ Ada (5 tab filter) |
| Search | ✅ Ada (search by name/client) |
| Create new | ✅ Ada (form) |
| Detail | ✅ Ada (page routing) |
| Edit | ✅ Ada (routing with `/edit`) |
| Convert ke project | ❌ Belum terlihat |
| Advanced filter | ❌ Tidak ada |
| Export | ❌ Tidak ada |

### Modul Proyek (Project)
| Fitur | Status |
|---|---|
| List proyek | ✅ Lengkap (tabs, filter, search, stat cards, table) |
| Create new | ✅ Ada (validasi Zod) |
| Detail - Overview | ✅ Lengkap |
| Detail - RKS | ✅ Ada |
| Detail - Review RKS | ✅ Ada |
| Detail - LPHS/SIOS | ✅ Ada (dengan multi-department approval) |
| Detail - Harga | ✅ Ada |
| Detail - Kompetitor | ✅ Ada |
| Detail - Pemenang | ✅ Ada |
| Detail - Target Delivery | ✅ Ada (dengan milestones) |
| Detail - Timeline | ✅ Visual timeline |
| Detail - Dokumen | ✅ Upload + grouping |
| Detail - Chat | ✅ Ada (3 sub-komponen) |
| Stepper progress | ✅ Ada (custom, tidak pakai Stepper komponen) |
| Tab locking | ✅ Advanced (sequential + conditional) |
| Delete project | ✅ Ada (confirm dialog) |
| Approve project | ✅ Ada (status advancement) |

### Modul Approval
| Fitur | Status |
|---|---|
| List semua approval | ✅ Ada (grouped by type) |
| Filter by type | ✅ Ada (Semua/Prospek/RKS/LPHS) |
| SLA status badges | ✅ Ada (Overdue/Near Deadline/Normal) |
| Metrics cards | ✅ Ada (4 card) |
| Navigate to entity | ✅ Ada |

### Modul Reports
| Fitur | Status |
|---|---|
| Reports index | ✅ Ada (3 card menu) |
| Win/Loss report | ❓ Ada (perlu dicek) |
| Pipeline report | ❓ Ada (perlu dicek) |
| KPI Dashboard | ❓ Ada (perlu dicek) |
| KPI Progress | ❓ Ada (perlu dicek) |
| KPI Targets | ❓ Ada (perlu dicek) |
| Data visualization | ❌ Semua statis/hardcoded |

### Modul Master Data
| Fitur | Status |
|---|---|
| Customers | ✅ CRUD via Zustand |
| Industries | ✅ View only |
| Categories | ✅ View only |
| Competitors | ✅ View only |
| Project Statuses | ✅ View + drawer |
| Document Types | ✅ View + drawer |
| Questions | ✅ View |
| Question Types | ✅ View + drawer |
| Periods | ✅ View + drawer |
| Holidays | ✅ View + drawer |
| Loss Reasons | ✅ View + drawer |
| Departments | ✅ View |
| Users | ✅ View |
| Audit Logs | ✅ View |
| **Semua data** | ❌ **Mock/tidak real** |

### Modul Konfigurasi
| Fitur | Status |
|---|---|
| Organization | ❓ Ada, tapi mungkin kosong/hardcoded |
| Status Project | ❓ Ada |
| Notifications | ❓ Ada |
| SLA | ❓ Ada |
| Roles | ❓ Ada |
| Targets | ❓ Ada |
| Workflow | ❓ Ada |
| Integration | ❓ Ada |
| Upload | ❓ Ada |
| Period | ❓ Ada |
| Question Types | ❓ Ada |

### Autentikasi
| Fitur | Status |
|---|---|
| Login | ✅ Mock (admin/admin) |
| Forgot Password | ✅ Routing ada, halaman perlu dicek |
| Reset Password | ✅ Routing ada, halaman perlu dicek |
| Logout | ✅ Sidebar button |
| Role guard | ✅ 4 guard types |
| Token management | ✅ Zustand persist |
| **Real API login** | ❌ **Belum terintegrasi** |

---

## UI Consistency Review

### Critical Inconsistencies

| Issue | Lokasi | Dampak |
|---|---|---|
| Skema warna berbeda | LoginPage vs halaman lain | Pengguna melihat dua "wajah" aplikasi berbeda |
| `text-slate-*` hardcoded | NotificationsPage, ProfilePage, MasterDataPage, MasterCustomerPage | Dark mode tidak berfungsi optimal, tidak konsisten dengan tema CSS variable |
| Inline button styles | ProspectListPage, ProjectFormPage, banyak halaman | Tidak konsisten dengan `Button` component |
| Breadcrumb berbeda | ProspectListPage, ProjectFormPage inline vs `Breadcrumb.tsx` | Duplikasi, maintainability rendah |
| Header title styles berbeda | DashboardPage (`font-display-title`) vs ProspectListPage (`text-xl font-extrabold`) vs MasterDataPage (`text-base font-extrabold text-slate-800`) | Tidak konsisten |
| Table styles berbeda | Setiap halaman punya implementasi table sendiri | Tidak ada SSOT untuk table styling |
| Pagination berbeda | ProspectListPage (Prev/Next) vs ProjectListPage (none) vs shared Pagination (Sebelumnya/Selanjutnya) vs shared Table (inline pagination) | 4 implementasi berbeda |
| Card styles berbeda | Dashboard (`Card` component) vs Approvals (inline `div`) vs Notifications (inline `div` dengan `border-l-4`) | Setiap modul tampil beda |
| Filter styles berbeda | ProjectListPage (`FilterPanel`) vs ProspectListPage (inline button group) vs Approvals (inline button group) vs MasterDataPage (inline) | Tidak ada SSOT filter |
| Modal/Drawer berbeda | Modal (`Modal` component) ada tapi MasterDataPage buat inline drawer, DokumenTab buat inline drawer sendiri | Drawer component tidak dipakai |
| Tombol "Kembali" berbeda | ProjectFormPage (`px-6 py-2.5 bg-white border...`) vs ProfilePage (`border border-border bg-white text-slate-700`) | Beragam |

### Minor Inconsistencies

| Issue | Detail |
|---|---|
| Loading state | PageLoader vs PageSkeleton — mana yang digunakan kapan? |
| Empty state | Ada `EmptyState` component tapi tidak konsisten digunakan |
| Badge styling | `StatusBadge` (shared) vs manual badge di beberapa halaman |
| Ikon | Ada Material Symbols dan lucide-react — campuran |
| Bahasa button | Ada Inggris (New Prospect, Approve) dan Indonesia (Batal, Simpan) |
| Date format | Ada `formatDate`, `formatRelativeTime`, dan manual formatting |
| Responsive table | `table-mobile-compact` class di beberapa tempat, tidak di tempat lain |

---

## UX Findings

### Positive Findings
1. **Responsive layout**: Semua halaman punya padding `p-4 sm:p-6 lg:p-8` yang konsisten
2. **Loading feedback**: Skeleton dan spinner sudah diterapkan
3. **Toast notification**: Global via react-hot-toast
4. **Keyboard navigation**: Sidebar dan Tabs support arrow key navigation
5. **Focus trap**: Modal dan Drawer menggunakan `useFocusTrap`
6. **Dark mode**: Full support dengan CSS variables
7. **Empty states**: Sudah ada pesan "Tidak ada data" di hampir semua list
8. **Error boundary**: Global di App.tsx

### Negative Findings
1. **Global search tidak terhubung**: `GlobalSearch` component ada tapi tidak dipasang di Topbar
2. **Settings gear tidak berfungsi**: Tombol settings di Topbar tidak punya handler
3. **"Lihat Semua Jadwal Kritis" tidak berfungsi**: Button di Dashboard tidak punya navigasi
4. **No keyboard shortcuts**: Tidak ada shortcut keyboard untuk power user
5. **Bulk actions tidak ada**: Tidak ada select multiple + batch action
6. **Export tidak ada**: Tidak ada export CSV/Excel/PDF
7. **Confirmation dialog**: Menggunakan `confirm()` native JavaScript, bukan modal custom
8. **Mobile sidebar**: Tidak ada gesture swipe untuk menutup (mobile sidebar overlay)
9. **Loading state antar page**: PageLoader digunakan untuk semua halaman — tidak ada granular loading
10. **No undo/redo**: Tidak ada mekanisme undo untuk aksi penting
11. **No onboarding tooltips**: Tidak ada bantuan untuk pengguna baru

---

## Component Refactoring Opportunities

### Komponen UI Primer (13 komponen)

| Komponen | Status | Rekomendasi |
|---|---|---|
| `Badge.tsx` | ✅ Rapi, 6 variant | Sudah baik |
| `Button.tsx` | ✅ 5 variant, 3 size | Sudah baik |
| `Card.tsx` | ✅ 3 padding, header/footer | Sudah baik |
| `DatePicker.tsx` | ✅ Sederhana | Perlu ditingkatkan (range, timezone) |
| `Drawer.tsx` | ✅ Ada tapi **tidak dipakai** | Refactor: ganti semua inline drawer dengan ini |
| `Input.tsx` | ✅ error/helper/icon | Sudah baik |
| `Modal.tsx` | ✅ Ada tapi **jarang dipakai** | Refactor: ganti `confirm()` dan inline modal |
| `Select.tsx` | ✅ Sederhana | Sudah baik |
| `Stepper.tsx` | ✅ Ada tapi **tidak dipakai** | Hapus atau konsolidasi dengan custom stepper di ProjectDetailPage |
| `Table.tsx` | ✅ Sederhana | Perlu async pagination, sorting dari API |
| `Tabs.tsx` | ✅ 2 variant (underline/pills) | Sudah baik |
| `Toast.tsx` | ❌ **Tidak dipakai** (react-hot-toast) | Hapus — dead code |

### Komponen Shared (9 komponen)

| Komponen | Status | Rekomendasi |
|---|---|---|
| `DataTable.tsx` | ✅ Ada tapi **jarang dipakai** | Perlu ditingkatkan dan digunakan secara konsisten |
| `EmptyState.tsx` | ✅ Ada | Perlu dipakai konsisten |
| `ErrorBoundary.tsx` | ✅ Dipakai global | Perlu per-feature boundary |
| `FilterPanel.tsx` | ✅ Hanya dipakai ProjectListPage | Perlu ditingkatkan (date range, number range) |
| `FormWrapper.tsx` | ❌ **Tidak dipakai** | Hapus atau refactor semua form untuk menggunakannya |
| `GlobalSearch.tsx` | ❌ **Tidak dipakai** | Integrasi ke Topbar |
| `Pagination.tsx` | ❌ **Tidak dipakai** (Table punya inline) | Konsolidasi |
| `Responsive.tsx` | ⚠️ Minimal dipakai | Bisa dihapus atau ditingkatkan |
| `StatusBadge.tsx` | ✅ Dipakai di ProjectList | Perlu dipakai di tempat lain |

### Kesimpulan Duplikasi Terbesar

1. **Table** — Ada 7+ implementasi: shared `Table`, shared `DataTable`, ProspectListPage inline, ProjectListPage inline, Dashboard inline, ApprovalPage inline, MasterDataPage inline
2. **Pagination** — Ada 4+ implementasi: shared `Pagination`, shared `Table` inline, ProspectListPage inline, MasterDataPage inline
3. **Drawer** — `Drawer` component tidak dipakai; ada inline drawer di DokumenTab, MasterDataPage
4. **Modal** — `Modal` component jarang dipakai; ada inline modal di MasterCustomerPage, ProfilePage
5. **Form layout** — `FormWrapper` tidak dipakai; setiap form halaman buat layout sendiri
6. **Breadcrumb** — `Breadcrumb` component vs inline di ProspectListPage, ProjectFormPage
7. **Filter** — `FilterPanel` vs inline filter button groups

---

## Incomplete User Flows

### Flow 1: Prospek → Proyek (Conversion)
**Kondisi saat ini**: Prospek memiliki `isConverted` field dan `projectId`, tapi tidak ada UI untuk melakukan konversi.
**Dampak**: User harus membuat proyek baru secara manual dan tidak ada data yang terbawa.
**Rekomendasi**: Tambah tombol "Buat Proyek" di ProspectDetailPage yang otomatis mengisi data proyek dari prospek.
**Prioritas**: High

### Flow 2: Approval → Status Advancement
**Kondisi saat ini**: Approve di approval page hanya menghapus dari list. Proyek advancement ada di ProjectDetailPage via "Approve" button.
**Dampak**: User bingung — approval harus dilakukan di dua tempat berbeda.
**Rekomendasi**: Integrasikan approval page untuk trigger status advancement otomatis.
**Prioritas**: High

### Flow 3: Winner → Delivery
**Kondisi saat ini**: Tab Pemenang dan Target Delivery terpisah. Setelah menang, user harus manual lanjut.
**Dampak**: Flow bisnis tidak seamless.
**Rekomendasi**: Auto-buka tab Delivery setelah winner di-set, atau tampilkan wizard.
**Prioritas**: Medium

### Flow 4: LPHS Multi-Department Approval → Final
**Kondisi saat ini**: Ada struktur untuk department approval di LPHS, tapi tidak ada UI lengkap untuk approval chain.
**Dampak**: Tidak bisa simulasi approval multi-level.
**Rekomendasi**: Lengkapi UI LPHS dengan visual approval chain.
**Prioritas**: Medium

### Flow 5: Notifikasi → Navigasi ke Entity
**Kondisi saat ini**: Notifikasi punya `entityId` dan `entityType`, tapi tidak ada onClick handler untuk navigasi.
**Dampak**: User melihat notifikasi tapi tidak bisa langsung ke entity terkait.
**Rekomendasi**: Tambah onClick di setiap notifikasi untuk navigate ke entity.
**Prioritas**: High

### Flow 6: KPI Target → Progress → Dashboard
**Kondisi saat ini**: Tiga halaman KPI terpisah. Tidak ada keterkaitan atau navigasi di antara mereka.
**Dampak**: User harus manually navigate antar halaman KPI.
**Rekomendasi**: Tambah breadcrumb/tab navigation antar halaman KPI.
**Prioritas**: Medium

---

## Communication & Collaboration Improvements

### Chat Feature
| Aspek | Kondisi |
|---|---|
| ChatTab component | ✅ Ada (3 sub-komponen) |
| ChatStore | ✅ Ada (Zustand) |
| Real integration | ❌ Chat messages mock |
| File sharing | ❌ Tidak ada |
| Typing indicator | ❌ Tidak ada |
| Read receipts | ❌ Tidak ada |
| Notifications | ❌ Tidak terintegrasi |

**Rekomendasi**: Chat sudah sebagai struktur dasar. Perlu: real-time integration, file attachment, notifikasi chat.

---

## Dashboard Improvements

| Area | Kondisi | Rekomendasi |
|---|---|---|
| Stat cards (4) | ✅ Data real dari store | Sudah baik |
| Win/Loss chart | ⚠️ **Data diacak dengan Math.random()** | Ganti dengan data real |
| Project status donut | ✅ SVG donut chart | Sudah baik |
| Pending approvals | ✅ Data real | Sudah baik |
| Critical deadlines | ✅ Data real | Sudah baik |
| Widget system | ❌ Folder `widgets/` kosong | Kembangkan sistem widget drag-and-drop |
| Date range filter | ❌ Tidak ada | Tambah filter rentang tanggal |
| Customizable layout | ❌ Tidak ada | Bisa ditambahkan di masa depan |

**Prioritas**: Medium (chart random data harus diperbaiki dengan prioritas High)

---

## Form & Data Entry Improvements

### Form Issues

| Halaman | Issue |
|---|---|
| **ProjectFormPage** | Tidak pakai `FormWrapper`, `Input`, `Select`. Inline validation. |
| **ProspectFormPage** | Diasumsikan sama. |
| **ProfilePage** | Tidak pakai komponen shared. Inline custom form. |
| **MasterCustomerPage** | Modal form custom, tidak pakai `FormWrapper`. |
| **Config*** | Belum dicek detail. |

### Rekomendasi Form Improvement
1. **Konsolidasi form components**: Gunakan `react-hook-form` + Zod secara konsisten
2. **Auto-save draft**: Simpan form progress ke localStorage
3. **Form wizard**: Untuk multi-step form (misal: create project dengan beberapa tahap)
4. **Debounced validation**: Jangan validasi di setiap keystroke
5. **Form submission feedback**: Loading + success/error toast sudah ada

---

## Table & Data Management Improvements

### Current Table Ecosystem
Ada fragmentasi besar pada implementasi tabel. Solusi:

1. **Audit semua implementasi table** — identifikasi kolom, fitur, dan variant
2. **Bangun DataTable yang mature** dengan fitur:
   - ✅ Sort by column (sudah ada di Table.tsx)
   - ✅ Pagination (client-side sudah ada)
   - ❌ Server-side pagination (belum)
   - ❌ Column visibility toggle
   - ❌ Column reorder
   - ❌ Export (CSV/Excel)
   - ❌ Row selection
   - ❌ Bulk actions
   - ❌ Inline edit
   - ❌ Sticky header/footer
   - ✅ Responsive (mobile card view sudah ada)
   - ✅ Empty state (via EmptyState component)
   - ✅ Loading skeleton

---

## Navigation Improvements

### Current Navigation State

| Element | Status |
|---|---|
| Sidebar | ✅ Collapsible, role-filtered, badge count |
| Topbar | ✅ Notification bell, theme toggle, user menu, search |
| Breadcrumb | ✅ Component ada tapi tidak konsisten dipakai |
| Tab navigation | ✅ Tabs component dengan keyboard nav |
| Stepper | ✅ Custom di ProjectDetailPage |
| Back button | ✅ Ada di ProjectDetailPage |

### Missing Navigation Elements
1. **Cmd+K palette**: Quick command palette untuk power user
2. **Recent pages**: Riwayat halaman yang dikunjungi
3. **Favorites/Bookmarks**: Tandai halaman favorit
4. **Tab persistence**: Restore tab terakhir di ProjectDetailPage
5. **Keyboard shortcuts**: Daftar shortcut (Alt+N = new project, dll)
6. **Deep linking**: URL yang mencerminkan state filter/search

---

## Notification & Activity Improvements

### Notification System

| Fitur | Status |
|---|---|
| List notifications | ✅ Ada (filter + search) |
| Mark as read | ✅ Ada |
| Mark all read | ✅ Ada |
| Archive | ✅ Ada (remove) |
| Count badge | ✅ Sidebar + Topbar |
| Notification types | ✅ 5 types (approval, revision, status_change, assignment, system) |
| Auto-generate | ✅ Saat status proyek berubah |
| **Click to navigate** | ❌ **Belum ada** |
| **Push notifications** | ❌ Belum ada |
| **Email integration** | ❌ Belum ada |
| **Notification preferences** | ❌ Config halaman ada tapi belum fungsional |
| **Real-time** | ❌ Masih manual via Zustand |

---

## Missing Frontend Features

### Critical Missing Features
1. **Real API integration** — Semua data masih mock
2. **Data export** — CSV/Excel/PDF dari setiap modul
3. **Bulk operations** — Select multiple + batch action
4. **File upload** — Masih simulasi, belum real upload
5. **Click notification → entity** — Navigasi dari notifikasi
6. **Prospect → Project conversion** — UI flow belum ada

### Important Missing Features
7. **Advanced filtering** — Date range, number range, multi-select
8. **Activity log page** — Global activity feed
9. **User preferences** — Language, timezone, notification settings
10. **Audit trail viewer** — Yang ada masih inline di MasterDataPage
11. **Calendar view** — Untuk deadline dan milestone
12. **Responsive table improvements** — Mobile card view belum merata

### Nice-to-Have
13. **Command palette (Cmd+K)**
14. **Dark mode toggle** (sudah ada, tapi bisa ditingkatkan)
15. **Onboarding tour**
16. **Keyboard shortcuts**
17. **Undo/redo untuk aksi penting**
18. **Export chart as image**

---

## Technical Frontend Improvements

### Code Quality
| Issue | Lokasi | Rekomendasi |
|---|---|---|
| **900+ baris file** | `MasterDataPage.tsx` | Refactor: pecah per tab menjadi komponen terpisah |
| **`as unknown as` casts** | MasterDataPage.tsx multiple lines | Hapus dengan typing yang benar |
| **Dead component** | `Toast.tsx`, `Stepper.tsx`, `FormWrapper.tsx`, `Pagination.tsx` | Hapus atau refactor agar dipakai |
| **Unused component** | `GlobalSearch.tsx`, `Responsive.tsx` | Integrasi atau hapus |
| **Native `confirm()`** | ProjectDetailPage.tsx | Ganti dengan Modal component |
| **`Math.random()` untuk chart** | DashboardPage.tsx | Ganti dengan data real |
| **Dynamic styles** | ProjectDetailPage inline `style={{}}` | Gunakan CSS classes |
| **Hardcoded strings** | Banyak tempat | Centralize di constants |
| **Tight coupling antar store** | projectStore calls approvalStore, notificationStore | Decouple dengan event system |
| **No TypeScript strict** | tsconfig belum strict | Aktifkan strict mode |

### Performance
| Issue | Rekomendasi |
|---|---|
| **Zustand persist besar** | `masterDataStore` menyimpan banyak entity | Peeah store per entity |
| **Semua komponen lazy-loaded** | ✅ Sudah baik |
| **CSS bundle** | Tailwind v4 purging otomatis | ✅ Sudah baik |
| **React.memo** | Belum digunakan | Tambah di komponen berat (table rows, list items) |
| **Virtual list** | Tidak ada | Untuk list > 100 items |

---

## Design System Improvements

### Current Design System
- 68 warna CSS variable (light/dark)
- 6 font utility classes
- Custom spacing (drawer-width, margin-mobile, dll)
- Tailwind v4 `@theme` directive
- Material Symbols icons

### Recommendations
1. **Component documentation**: Storybook atau dokumentasi internal
2. **CSS variable audit**: Beberapa warna tidak dipakai konsisten
3. **Icon library standarisasi**: Pilih Material Symbols atau lucide-react, jangan campur
4. **Spacing scale**: Gunakan Tailwind spacing scale secara konsisten
5. **Typography audit**: Pastikan semua teks menggunakan utility classes tema
6. **Color audit**: Eliminasi `text-slate-*` hardcoded — ganti dengan warna tema
7. **Shadow scale**: Standarisasi shadow (sm/md/lg/xl)
8. **Animation standards**: Duration dan easing function standar

---

## Frontend Cleanup Tasks

### Dead Code to Remove
1. `frontend/src/components/ui/Toast.tsx` — Tidak dipakai (react-hot-toast sudah global)
2. `frontend/src/components/ui/Stepper.tsx` — Tidak dipakai (ada custom stepper di ProjectDetailPage)
3. `frontend/src/components/shared/FormWrapper.tsx` — Tidak dipakai oleh form manapun
4. `frontend/src/components/shared/Pagination.tsx` — Tidak dipakai oleh halaman manapun

### Dead Code to Integrate or Remove
5. `frontend/src/components/shared/GlobalSearch.tsx` — Component bagus tapi tidak terintegrasi
6. `frontend/src/components/ui/Drawer.tsx` — Ada tapi tidak dipakai (inline drawer di mana-mana)
7. `frontend/src/components/shared/Responsive.tsx` — Minimal dipakai
8. `frontend/src/components/ui/Modal.tsx` — Jarang dipakai (prefer inline)

### Files with Inconsistent Patterns to Refactor
9. `frontend/src/features/master-data/MasterDataPage.tsx` — 935+ baris, refactor wajib
10. `frontend/src/features/notifications/NotificationsPage.tsx` — Hardcoded slate colors
11. `frontend/src/features/profile/ProfilePage.tsx` — Hardcoded slate colors
12. `frontend/src/features/auth/LoginPage.tsx` — Different color scheme
13. `frontend/src/features/prospects/ProspectListPage.tsx` — Inline table/pagination/breadcrumb
14. `frontend/src/features/projects/ProjectFormPage.tsx` — Inline form tidak pakai komponen shared

---

## High Priority Tasks

### 1. Konsolidasi UI Components (Estimasi: 5-7 hari)
- Ganti semua inline table dengan `DataTable` + `Table` component
- Ganti semua inline pagination dengan shared component
- Ganti semua inline drawer dengan `Drawer` component
- Ganti semua inline modal + `confirm()` dengan `Modal` component
- Ganti semua inline breadcrumb dengan `Breadcrumb` component
- Terapkan `StatusBadge` di semua halaman

### 2. Eliminasi Hardcoded Colors (Estimasi: 3-4 hari)
- Ganti `text-slate-*`, `bg-slate-*`, `border-slate-*` dengan CSS variable tema
- Prioritaskan: NotificationsPage, ProfilePage, MasterDataPage, MasterCustomerPage
- Test dark mode regression

### 3. Integrasi GlobalSearch ke Topbar (Estimasi: 1 hari)
- Pasang `GlobalSearch` component di Topbar
- Hapus search input duplikat di Topbar

### 4. Notifikasi Click → Navigasi (Estimasi: 1-2 hari)
- Tambah `onClick` handler di setiap item notifikasi
- Navigasi ke entity terkait (project/prospect)
- Gunakan `entityId` dan `entityType` yang sudah ada

### 5. Prospect → Project Conversion Flow (Estimasi: 2-3 hari)
- Tambah tombol "Buat Proyek" di ProspectDetailPage
- Auto-fill data proyek dari prospek
- Set `isConverted` flag di prospek
- Navigasi ke ProjectDetailPage setelah konversi

### 6. API Integration Prep (Estimasi: 5-7 hari)
- Ganti mock store dengan React Query + Axios
- Implementasi loading, error, dan empty states
- Migration bertahap per modul (Prospek, Proyek, Approval, dll)

---

## Medium Priority Tasks

### 7. DataTable Enhancement (Estimasi: 3-4 hari)
- Kolom visibility toggle
- Export CSV
- Row selection
- Sticky header
- Mobile card view improvement

### 8. Form Standardization (Estimasi: 3-4 hari)
- Gunakan `react-hook-form` + Zod di semua form
- Konsisten layout form (label, input, error, helper text)
- Form submission feedback

### 9. Advanced Filtering (Estimasi: 2-3 hari)
- Date range filter di semua list page
- Number range filter
- Multi-select filter
- Save filter presets

### 10. Dashboard Improvement (Estimasi: 2-3 hari)
- Hapus `Math.random()` dari chart data
- Tambah daterange filter
- "Lihat Semua" buttons yang berfungsi
- Settings gear di Topbar

### 11. MasterDataPage Refactor (Estimasi: 3-4 hari)
- Pecah 900+ baris menjadi komponen per tab
- Gunakan `Drawer` component untuk detail drawer
- Gunakan `Modal` untuk create/edit
- Gunakan `DataTable` untuk tabel
- Standardisasi warna tema

### 12. Report Pages Data Real (Estimasi: 3-5 hari)
- Ganti data statis hardcoded dengan data dari store/API
- Chart visualization yang real

### 13. Approval + Status Advancement Integration (Estimasi: 2-3 hari)
- Approve dari ApprovalInboxPage harus trigger status advancement
- Satu flow approval yang terintegrasi

---

## Low Priority Tasks

### 14. Chat Enhancement (Estimasi: 3-4 hari)
- Real-time integration
- File attachment
- Read receipts

### 15. Keyboard Shortcuts (Estimasi: 2-3 hari)
- Shortcut help modal (Shift+?)
- Navigasi cepat (G+D = dashboard, G+P = projects)
- Aksi cepat (C = create, / = search)

### 16. Calendar View (Estimasi: 3-4 hari)
- Deadline proyek
- Milestone delivery
- Hari libur

### 17. User Preferences Page (Estimasi: 2-3 hari)
- Language setting
- Timezone setting
- Notification preferences
- Theme preference

### 18. Activity Feed (Estimasi: 2-3 hari)
- Global activity log
- Filter by entity type
- Real-time updates

### 19. Bulk Operations (Estimasi: 2-3 hari)
- Multi-select rows
- Batch delete
- Batch status update
- Batch export

### 20. PWA / Offline Support (Estimasi: 5-7 hari)
- Service worker
- Offline fallback
- Manifest

---

## Recommended Development Order

### Phase 1 — Foundation (Weeks 1-2)
1. Cleanup dead code (Toast, Stepper, FormWrapper, Pagination)
2. Konsolidasi UI components (Table, Drawer, Modal, Breadcrumb)
3. Eliminasi hardcoded colors
4. Integrasi GlobalSearch ke Topbar

### Phase 2 — UX Flow (Weeks 3-4)
5. Notifikasi click → navigasi
6. Prospect → Project conversion
7. Approval + status advancement integration
8. Dashboard chart data real

### Phase 3 — Data & Forms (Weeks 5-6)
9. Form standardization
10. DataTable enhancement
11. Advanced filtering
12. MasterDataPage refactor

### Phase 4 — Features (Weeks 7-8)
13. Report pages data real
14. API integration migration (bertahap)
15. Data export (CSV/Excel)

### Phase 5 — Polish (Weeks 9-10)
16. Bulk operations
17. Keyboard shortcuts
18. User preferences
19. Activity feed
20. Calendar view

---

## Frontend Readiness Evaluation

| Kriteria | Score (1-10) | Notes |
|---|---|---|
| Architecture | 8/10 | Feature-based, clean separation. Terlalu banyak store saling terkait. |
| UI Consistency | 4/10 | Fragmentasi besar. Inline styles, hardcoded colors, multiple implementations. |
| UX Quality | 6/10 | Responsif, dark mode, toast. Tapi flow bisnis tidak lengkap. |
| Component Reusability | 3/10 | Banyak komponen tidak dipakai. Setiap halaman bikin sendiri. |
| Code Quality | 5/10 | Dead code, 900+ baris file, `any` types, `as unknown as`. |
| Performance | 7/10 | Lazy loading baik. Belum ada memo/virtual list. |
| Accessibility | 5/10 | ARIA labels, keyboard nav di beberapa tempat. Belum konsisten. |
| Test Coverage | 0/10 | Tidak ada satupun test. |
| Dark Mode | 8/10 | ✅ Full support. Tapi hardcoded colors rusak dark mode. |
| Responsiveness | 7/10 | ✅ Mobile-first. Tapi mobile card view belum merata. |
| **OVERALL** | **5.3/10** | **Fondasi baik, eksekusi belum konsisten.** |

---

## Conclusion

Proyek Kinetic CRM memiliki fondasi arsitektur yang sangat baik (feature-based, component tiers, Zustand + React Query, lazy loading, dark mode, responsive). Namun, eksekusi antarmuka masih sangat fragmentasi — setiap halaman seperti dikerjakan oleh developer berbeda tanpa panduan desain yang ketat.

**Prioritas utama** adalah konsolidasi UI (Table, Drawer, Modal, Breadcrumb, warna tema) untuk menghilangkan fragmentasi dan meningkatkan maintainability. **Prioritas kedua** adalah menghubungkan flow bisnis yang terputus (prospek→proyek, approval→status, notifikasi→entity). **Prioritas ketiga** adalah persiapan integrasi API riil untuk menggantikan mock data.

Dengan menyelesaikan 6-8 High Priority Tasks, proyek akan naik dari **5.3/10** menjadi **~7.5/10** dalam readiness evaluation. Target 3 bulan untuk mencapai production-ready.
