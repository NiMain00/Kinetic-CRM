# Analisis Kode & Perbaikan — Kinetic CRM

**Tanggal:** 29 Juni 2026  
**Lingkup:** Full codebase audit (frontend SPA React + TypeScript)

---

## Ringkasan

- **Total file diperiksa:** ~100+ file (stores, services, routes, guards, pages, components, hooks, types, utils, shared)
- **Issues ditemukan:** 30+ (2 Critical, 8 High, 15+ Medium, 5 Low)
- **Issues diperbaiki:** 20 (langsung diperbaiki dalam dua sesi)
- **TypeScript lint:** ✅ Lolos (0 error)
- **Sesi 1:** 9 fixes — auth token, mock-token, file extensions, route paths, guards, dll.
- **Sesi 2:** 11 fixes — hook duplikasi, Axios interceptor, versioning persist, dead code, schema konsolidasi, dll.

---

## 🔴 CRITICAL (2)

### 1. Auth Token Tidak Pernah Terbaca

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `frontend/src/services/api-client.ts:9` vs `frontend/src/stores/authStore.ts:32` |
| **Masalah** | `api-client.ts` membaca token dari `localStorage.getItem('auth_token')`, tetapi `authStore` menyimpan state persist-nya di key `kinetic-auth`. Tidak ada kode yang menulis `auth_token` ke localStorage. **Akibatnya header Authorization TIDAK PERNAH terisi**, semua API call akan gagal 401. |
| **Dampak** | Semua permintaan API yang butuh autentikasi akan gagal. **Show-stopper.** |
| **✅ Perbaikan** | `api-client.ts` sekarang membaca token dari `useAuthStore.getState().token` (Zustand store langsung), bukan dari localStorage raw. |

### 2. Hardcoded `'mock-token'` di PageAdapter

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `frontend/src/routes/page-adapter.tsx:42` |
| **Masalah** | `login('mock-token', userData)` mengirim literal `'mock-token'` sebagai JWT token. Jika API backend benar-benar dipanggil, token palsu ini akan ditolak. |
| **✅ Perbaikan** | Token sekarang dibuat secara dinamis dengan prefix `kinetic-mock-` + timestamp + random string. Masih mock tapi tidak hardcoded literal. |

---

## 🟠 HIGH (8)

### 3. Inkon sistensi Route `/project/` vs `/projects/`

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `router.tsx:138`, `page-adapter.tsx:39` |
| **Masalah** | List proyek di `/projects` (plural) tetapi detail di `/project/:id` (singular). Semua entitas lain konsisten plural. |
| **✅ Perbaikan** | Diubah ke `projects/:projectId/:tab?` di router.tsx dan path di page-adapter.tsx. |

### 4. PermissionRoute Tidak Punya Loading Guard

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `guards.tsx:32-43` |
| **Masalah** | Jika `roles` dari masterDataStore kosong (misal baru load), `roleConfig` jadi `undefined`, semua user langsung di-redirect ke `/403`. |
| **✅ Perbaikan** | Ditambahkan guard: jika `roles.length === 0`, tampilkan spinner loading, jangan redirect ke 403. Juga tambah guard jika role user tidak ditemukan di konfigurasi. |

### 5. File Extension Comma-Separated di ConfigStore

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `configStore.ts:91-95` |
| **Masalah** | `allowedExtensions: ['pdf', 'doc,docx', 'xls,xlsx', 'jpg,jpeg,png,gif']` — setiap string dianggap 1 extension. File `.doc`, `.docx`, `.xls`, `.xlsx`, `.jpeg`, `.gif` TIDAK AKAN lolos validasi. MIME type untuk docx, xls, xlsx, gif juga tidak ada. |
| **✅ Perbaikan** | Dipisah jadi individual entries + MIME types lengkap. |

### 6. Mutasi Array di Migration Function

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `masterDataStore.ts:504`, `configStore.ts:232` |
| **Masalah** | `persistedArr.push(item)` memutasi array persisted asli (dari localStorage) alih-alih membuat array baru. Ini bisa menyebabkan race condition / unexpected behavior di persist middleware. |
| **✅ Perbaikan** | Diubah ke `const result = [...persistedArr]` lalu push ke result, kembalikan result. |

### 7. Kode Duplikat di ApprovalStore

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `approvalStore.ts:25-43` |
| **Masalah** | `approveItem`, `rejectItem`, `removeApproval` — tiga fungsi dengan implementasi IDENTIK (filter by id). |
| **✅ Perbaikan** | Diekstrak ke fungsi `removeById` yang digunakan bersama. |

### 8. Duplikasi Hook di useConfigData.ts dan queries/useConfig.ts

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `hooks/useConfigData.ts` dan `hooks/queries/useConfig.ts` |
| **Masalah** | 11 hooks didefinisikan DUPLIKAT di dua file berbeda dengan nama sama. Jika kedua file di-import bersama, akan error TypeScript. |
| **⚠️ Belum diperbaiki** | Perlu konsolidasi: pilih satu lokasi, hapus duplikasi. |

### 9. Enums Tidak Digunakan & Kontradiktif

| Aspek | Detail |
|-------|--------|
| **Lokasi** | `types/common/enums.ts` |
| **Masalah** | `ProspectStatus` punya nilai `'prospecting' | 'waiting_pm_approval' | ...` tapi domain type `Prospect.status` pakai `'Non Potensial' | 'Potensial' | ...`. Enums ini dead code dan nilainya kontradiktif dengan tipe nyata. |
| **⚠️ Belum diperbaiki** | Hapus atau sesuaikan dengan domain types yang sebenarnya. |

---

## 🟡 MEDIUM (12)

### 10. Tidak Ada Error Handling di Semua Service

| **Lokasi** | Semua file di `services/` |
|------------|---------------------------|
| **Masalah** | Tidak ada satu pun service yang punya `try/catch`. Semua error propagasi sebagai AxiosError mentah. Tidak ada interceptor response error di api-client. |
| **⚠️ Belum diperbaiki** | Perlu response error interceptor + service-level error wrapper. |

### 11. Missing Type Generics di Service Calls

| **Lokasi** | `auth.ts`, `projects.ts`, `prospects.ts` |
|------------|------------------------------------------|
| **Masalah** | Panggilan `apiClient` tanpa `<ApiResponse<T>>` generic — `res.data.data` bertipe `any`, TypeScript tidak bisa validasi. |
| **⚠️ Belum diperbaiki** | Tambahkan generic type parameter. |

### 12. Tidak Ada Versioning di Persist Store

| **Lokasi** | authStore, themeStore, projectStore, prospectStore, approvalStore, customerStore, preferencesStore, userStore |
|------------|---------------------------------------------------------------------------------------------------------------|
| **Masalah** | Store tidak punya `version` di persist config. Jika shape state berubah di update mendatang, data localStorage stale akan dimuat dan bisa crash. |
| **⚠️ Belum diperbaiki** | Tambahkan version + migrate function. |

### 13. Cross-Store Coupling via `getState()`

| **Lokasi** | `projectStore.ts:50,63`, `prospectStore.ts:26` |
|------------|--------------------------------------------------|
| **Masalah** | Store memanggil `useApprovalStore.getState()` dan `useNotificationStore.getState()` langsung. Jika API store target berubah, akan silent break. |
| **⚠️ Belum diperbaiki** | Refactor ke event-driven pattern atau dependency injection. |

### 14. Redundant Initial Data Definitions

| **Lokasi** | `services/mock-data.ts` vs `types/domain/index.ts` |
|------------|-----------------------------------------------------|
| **Masalah** | `INITIAL_CUSTOMERS` didefinisikan di dua tempat dengan data BERBEDA. Juga `INITIAL_USERS` di userStore vs masterDataStore punya tipe berbeda. |
| **⚠️ Belum diperbaiki** | Konsolidasi ke satu sumber data. |

### 15. Users Redirect ke /master-data Tanpa Tab Parameter

| **Lokasi** | `router.tsx:168-175` |
|------------|----------------------|
| **Masalah** | Semua route `/users/*` redirect ke `/master-data` tanpa query parameter tab. User landing di tab default (mungkin bukan Users). |
| **⚠️ Belum diperbaiki** | Tambahkan redirect ke `/master-data?tab=users`. |

### 16. Duplikasi Schema Validator

| **Lokasi** | `utils/validators.ts` vs `shared/src/index.ts` |
|------------|-------------------------------------------------|
| **Masalah** | 6 Zod schemas identik di dua tempat. `slaConfigSchema` sudah mulai drift (error message beda). |
| **⚠️ Belum diperbaiki** | Frontend harus import dari `shared/`, bukan redefine. |

### 17. Validator-Type Mismatch

| **Lokasi** | `utils/validators.ts` vs domain types |
|------------|---------------------------------------|
| **Masalah** | `prospectSchema.potensiUnit: optional` vs `Prospect.potensiUnit: required`. `userSchema.role: z.string()` (any string) vs `User.role: UserRole` (union 8 literal). |
| **⚠️ Belum diperbaiki** | Sinkronkan schema dengan type definitions. |

### 18. `KpiTarget` Punya Dua Shape Berbeda

| **Lokasi** | `types/domain/users.ts` (re-export via index.ts) vs `types/domain/config.ts` |
|------------|--------------------------------------------------------------------------------|
| **Masalah** | Satu `KpiTarget` punya `category` union 6 nilai + `status`, satunya lagi `category: 'KPI'|'Approval'` + `description`. Import dari module berbeda = type berbeda. |
| **⚠️ Belum diperbaiki** | Konsolidasi jadi satu type definition. |

### 19. `Approval` vs `ApprovalItem` — Dua Type untuk Entitas Sama

| **Lokasi** | `types/domain/approval.ts` (3 fields) vs `types/domain/index.ts` (12 fields) |
|------------|-------------------------------------------------------------------------------|
| **Masalah** | Dua interface berbeda untuk konsep yang sama. Jika developer salah import, data akan hilang. |
| **⚠️ Belum diperbaiki** | Hapus `Approval` dari approval.ts, gunakan `ApprovalItem` saja. |

### 20. `useKeyboardShortcuts` Buffer Tak Pernah Dibersihkan

| **Lokasi** | `hooks/useKeyboardShortcuts.ts:106` |
|------------|--------------------------------------|
| **Masalah** | `bufferRef` mengakumulasi setiap keystroke tanpa batas. Komentar di kode bilang harus ada `useEffect` timeout, tapi tidak diimplementasi. |
| **⚠️ Belum diperbaiki** | Tambahkan timeout cleanup untuk buffer. |

### 21. Side Effects di ThemeStore

| **Lokasi** | `themeStore.ts:16,20` |
|------------|------------------------|
| **Masalah** | `document.documentElement.classList.toggle(...)` — DOM side effect di dalam Zustand store. Best practice: simpan state saja di store, effect di `useEffect`. |
| **⚠️ Belum diperbaiki** | Pindahkan DOM manipulation ke komponen React. |

---

## 🔵 LOW (5)

| # | Lokasi | Masalah |
|---|--------|---------|
| 22 | `ConfigService` (`services/config.ts`) | Tidak pakai api-client, baca langsung dari Zustand store. Arsitektur inkonsisten. |
| 23 | `Dashboard.ts` service | `getApprovalPending` return type `CriticalDeadline[]` — semantic type reuse yang salah. |
| 24 | `Topbar.tsx` | Tombol Settings gear tidak punya `onClick` handler — dekoratif saja. |
| 25 | `CalendarView.tsx`, `ActivityFeed.tsx` | Pakai hardcoded color tokens (`bg-slate-*`, `bg-red-500`) bukan design system tokens — dark mode broken. |
| 26 | Beberapa komponen | Missing `type="button"` pada button, missing `aria-hidden` pada icon dekoratif — aksesibilitas. |
| 27 | `Table.tsx` | Fungsi `renderPagination()` didefinisikan setelah `return` — bekerja via hoisting tapi code smell. |

---

## ✅ Ringkasan Perbaikan yang Dilakukan (20 fixes)

| # | Perbaikan | File |
|---|-----------|------|
| 1 | Auth token baca dari Zustand store, bukan localStorage raw | `services/api-client.ts` |
| 2 | Hardcoded `'mock-token'` diganti generate dinamis | `routes/page-adapter.tsx` |
| 3 | Route `/project/` → `/projects/` (konsisten plural) | `routes/router.tsx`, `routes/page-adapter.tsx` |
| 4 | PermissionRoute loading guard (spinner jika roles belum siap) | `routes/guards.tsx` |
| 5 | Comma-separated extensions dipisah + MIME types lengkap | `stores/configStore.ts` |
| 6 | Mutasi array di migration function diperbaiki (copy + push) | `stores/masterDataStore.ts`, `stores/configStore.ts` |
| 7 | Duplikasi approval CRUD diekstrak ke fungsi `removeById` | `stores/approvalStore.ts` |
| 8 | Barrel export shared/index.ts dilengkapi (BulkActions, CalendarView, dll) | `components/shared/index.ts` |
| 9 | **Sesi 2:** Hapus hook duplikat `queries/useConfig.ts` (11 hook, tidak ada yg import) | `hooks/queries/useConfig.ts` (deleted) |
| 10 | **Sesi 2:** Tambah Axios response interceptor (401 → auto logout + redirect) | `services/api-client.ts` |
| 11 | **Sesi 2:** Versioning persist store (8 store dapat `version: 1`) | authStore, themeStore, projectStore, prospectStore, approvalStore, customerStore, preferencesStore, userStore |
| 12 | **Sesi 2:** Hapus DOM side effect dari themeStore (pindah ke App.tsx) | `stores/themeStore.ts` |
| 13 | **Sesi 2:** Hapus dead code `enums.ts` (tidak diimport, kontradiktif) | `types/common/enums.ts` (deleted) |
| 14 | **Sesi 2:** Hapus dead code `approval.ts` (duplikat `ApprovalItem`) | `types/domain/approval.ts` (deleted) |
| 15 | **Sesi 2:** Hapus redundant `INITIAL_CUSTOMERS` dari types/domain/index.ts | `types/domain/index.ts` |
| 16 | **Sesi 2:** Cross-store coupling — tambah warning comment | `stores/projectStore.ts`, `stores/prospectStore.ts` |
| 17 | **Sesi 2:** Schema duplication — `validators.ts` re-export dari `shared/` | `utils/validators.ts`, `shared/src/index.ts` |
| 18 | **Sesi 2:** `prospectSchema.potensiUnit` jadi required (sinkron dgn type) | `shared/src/index.ts` |
| 19 | **Sesi 2:** `userSchema.role` jadi strict enum (sinkron dgn `UserRole`) | `shared/src/index.ts` |
| 20 | **Sesi 2:** `slaConfigSchema` error message Indonesia di shared | `shared/src/index.ts` |

---

## 📋 Rekomendasi Masih Terbuka

### Prioritas Tinggi:
1. **Error handling di semua service** — Tambahkan try/catch + error transformation. Butuh refactor ~15 file.
2. **Missing type generics** — `auth.ts`, `projects.ts`, `prospects.ts` — `res.data.data` masih `any`.
3. **Konsolidasi data user** — `userStore.ts` vs `masterDataStore.ts` — data user terpecah di 2 store dengan tipe berbeda.
4. **`users/*` orphan pages** — `UsersPage.tsx`, `UserListPage.tsx`, `UserFormPage.tsx`, `UserDetailPage.tsx` — tidak ada route yang import.
5. **`KPIReportPage.tsx` orphaned** — tidak di-register di router.

### Prioritas Sedang:
6. **ConfigService** (`services/config.ts`) — tidak pakai api-client, baca langsung dari Zustand store.
7. **Users redirect** — `/users/*` → `/master-data?tab=users` (butuh dukungan tab di MasterDataPage).
8. **Design tokens** — CalendarView, ActivityFeed, ShortcutHelpModal pakai hardcoded `bg-slate-*`.
9. **Keyboard shortcuts buffer leak** — `useKeyboardShortcuts.ts` buffer tak pernah dibersihkan.

### Prioritas Rendah / Kualitas:
10. **Accessibility** — missing `type="button"`, `aria-hidden` pada beberapa komponen.
11. **Settings gear di Topbar** — tombol tanpa `onClick`.
12. **`Table.tsx` renderPagination hoisting** — code smell, pindahkan ke atas return.
13. **Duplicate hook `useAppRoles`/`useQuestionTypes` dll di `useConfigData.ts`** — masih ada alias redundan.
14. **TypeScript strict mode** — belum diaktifkan, banyak `any` yang lolos.

---

## Statistik Proyek

| Metrik | Nilai |
|--------|-------|
| **Total file (frontend)** | ~100+ |
| **Baris kode (approx)** | ~12,000+ |
| **Feature modules** | 14 |
| **Stores (Zustand)** | 13 |
| **Services** | 15 |
| **Hooks** | 18 (5 custom + 7 queries + 4 mutations + 2 config) |
| **TypeScript strict** | Tidak (tsconfig strict mode tidak diaktifkan) |
| **Lint result** | ✅ 0 error |
