# Implementation Roadmap — Kinetic CRM

> **Prioritized action plan** berdasarkan analisis menyeluruh terhadap kode yang sudah ada (frontend, backend, infrastructure) vs 65 dokumen spesifikasi MD.
> Fokus: langkah konkret, dependency-aware, dan risk-based.

---

## Table of Contents

1. [Status Ringkas](#1-status-ringkas)
2. [Prioritas 1: Segera (Week 1-2)](#2-prioritas-1-segera-week-1-2)
3. [Prioritas 2: Jangka Pendek (Week 3-4)](#3-prioritas-2-jangka-pendek-week-3-4)
4. [Prioritas 3: Jangka Menengah (Week 5-8)](#4-prioritas-3-jangka-menengah-week-5-8)
5. [Prioritas 4: Jangka Panjang (Week 9+)](#5-prioritas-4-jangka-panjang-week-9)
6. [Dependency Graph](#6-dependency-graph)
7. [Risk Register](#7-risk-register)

---

## 1. Status Ringkas

| Layer | Progress | Keterangan |
|-------|----------|------------|
| **Frontend Pages** | ~30% | 17 halaman dengan UI (mock data), 36 halaman masih `return null` |
| **Frontend Architecture** | ~70% | Component library, hooks, services, stores, types sudah terstruktur |
| **Backend API Routes** | ~11% | 2 dari 18 route groups terimplementasi (auth, AI) |
| **Backend Business Logic** | ~5% | Auth service & AI services selesai, 5 service lainnya kosong |
| **Prisma Schema** | ~85% | 49 model, tapi kurang `@relation` & foreign keys |
| **Database Migration** | ~50% | 1 migration jalan, seed data belum lengkap |
| **State Machines** | 0% | 6 state machine (prospect, project, approval, dll) belum ada |
| **Infrastructure** | ~80% | Docker, CI/CD, Nginx sudah siap |
| **Testing** | 0% | 0 test files, tidak ada test framework |

---

## 2. Prioritas 1: Segera (Week 1-2)

### 2.1 Wire Backend Routes ke Express App

**Akar masalah:** `backend/src/app.ts` hanya register 4 dari 18 route files.

**Checklist:**
- [ ] Mount semua route files di `backend/src/api/v1/*.ts` ke `app.ts`
- [ ] Pastikan tiap route minimal return `501 Not Implemented` dengan pesan jelas
- [ ] Verifikasi route structure via `curl localhost:3000/api/v1/...`

**Files affected:**
- `backend/src/app.ts` — registrasi route
- 14 file route di `backend/src/api/v1/` — pastikan export default router

**Risk:** Low — hanya wiring, tanpa logika bisnis.

### 2.2 Selesaikan Prisma Relations

**Akar masalah:** 49 model sudah didefinisikan tapi banyak yang tidak memiliki `@relation` dan foreign key constraints.

**Checklist:**
- [ ] Review seluruh model di `backend/prisma/schema.prisma`
- [ ] Tambah `@relation(...)` untuk semua relasi antar tabel
- [ ] Generate migration baru (`npx prisma migrate dev`)
- [ ] Verifikasi foreign keys terbuat di MySQL

**Files affected:**
- `backend/prisma/schema.prisma`

**Risk:** Medium — perubahan schema bisa berdampak ke migration yang sudah ada.

### 2.3 Lengkapi Seed Data

**Akar masalah:** Seed hanya mencakup roles, permissions, admin user, questions, customers, competitors.

**Data yang perlu ditambahkan:**
- [ ] Master industry
- [ ] Master project category
- [ ] Master status + transitions
- [ ] Master periods
- [ ] Master holidays
- [ ] Master loss reasons
- [ ] Notification templates
- [ ] Sample SLA configs

**Files affected:**
- `backend/prisma/seed.ts`

**Risk:** Low — hanya data reference, tidak ada logika bisnis.

### 2.4 Connect Auth Flow End-to-End

**Akar masalah:** Frontend LoginPage menggunakan dummy accounts hardcoded (`DUMMY_ACCOUNTS`), tidak memanggil backend auth API yang sudah jadi.

**Checklist:**
- [ ] Update `LoginPage` untuk panggil `authService.login()` yang sudah ada
- [ ] Pastikan `authStore` menyimpan token dari response backend
- [ ] Pastikan `api-client` interceptor menggunakan token dari store
- [ ] Test login flow: login → token tersimpan → request terautentikasi
- [ ] Handle error cases (wrong password, account locked, etc.)
- [ ] Hapus `DUMMY_ACCOUNTS` dan mock login logic

**Files affected:**
- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/stores/authStore.ts`
- `frontend/src/services/auth.ts`

**Risk:** Medium — melibatkan perubahan store dan service yang digunakan komponen lain.

---

## 3. Prioritas 2: Jangka Pendek (Week 3-4)

### 3.1 Implementasi API Endpoints Core

**Prioritas endpoint berdasarkan dependensi downstream:**

| Route Group | Priority | Depends On | MD Doc |
|-------------|----------|------------|--------|
| `GET/POST/PUT /prospects` | **Tertinggi** | - | 032 |
| `GET/POST/PUT /projects` | **Tertinggi** | Prospects | 033 |
| `GET /customers` | **Tinggi** | - | 021 |
| `GET /competitors` | **Tinggi** | - | 023 |
| `GET /questions` | **Tinggi** | - | 024 |
| `GET/POST/PUT /rks` | **Sedang** | Projects | 034 |
| `GET/POST/PUT /lphs-sios` | **Sedang** | Projects | 035 |
| `GET/POST/PUT /harga-kompetitor` | **Sedang** | Projects, Competitors | 036 |
| `GET/POST /approvals` | **Sedang** | Projects | 039 |
| `GET /notifications` | **Sedang** | - | 046 |

**Checklist per endpoint:**
- [ ] Zod validation schema
- [ ] Service logic
- [ ] Repository access
- [ ] Error handling
- [ ] RBAC check

**Files affected:**
- `backend/src/api/v1/*.ts` — route handlers
- `backend/src/services/*.ts` — business logic
- `backend/src/repositories/*.ts` — data access
- `backend/src/validators/*.ts` — Zod schemas
- `backend/src/middleware/*.ts` — reuse existing

**Risk:** High — banyak endpoint baru, perlu testing manual.

### 3.2 Wire React Query Hooks ke Halaman Frontend

**Akar masalah:** Semua 17 halaman menggunakan `useState(INITIAL_*)` dari `mock-data.ts`. React Query hooks sudah ada tapi tidak digunakan.

**Checklist:**
- [ ] Dashboard → `useDashboardKPIs()`
- [ ] ProspectsPage → `useProspects()`, `useProspectMutations()`
- [ ] ProjectDetailPage → `useProject()`, `useProjectTabs()`
- [ ] Master Data pages → `useMasterData()`
- [ ] Approval Inbox → `useApprovals()`
- [ ] Notifications → `useNotifications()`
- [ ] User management → `useUsers()`
- [ ] Hapus `INITIAL_*` constants dari `mock-data.ts` setelah semua ter-wire

**Files affected:**
- Setiap file fitur di `frontend/src/features/*/`

**Risk:** Medium — mengubah data flow fundamental, perlu testing tiap halaman.

### 3.3 Implementasi Page Stubs

**36 halaman yang masih `return null`:**

| Module | Pages |
|--------|-------|
| **Prospect** | `ProspectDetailPage`, `ProspectFormPage` |
| **Project** | `ProjectFormPage`, semua tab pages (Overview, RKS, LPHS, SIOS, Harga Kompetitor, Pemenang, Timeline, Documents, Approval) |
| **Master Data** | `MasterCustomerPage`, `MasterCompetitorPage`, `MasterQuestionPage`, `MasterPeriodPage`, `MasterHolidayPage`, `MasterLossReasonPage` |
| **KPI** | `KPIDashboardPage`, `KPITargetPage`, `KPIScoringPage` |
| **Reports** | `ReportSalesPage`, `ReportPerformancePage`, `ReportProjectPage` |
| **Config** | `ConfigOrganizationPage`, `ConfigStatusPage`, `ConfigSLAPage`, `ConfigNotificationPage` |
| **Users** | `UserListPage`, `UserDetailPage` |
| **Audit** | `AuditLogPage` |

**Pendekatan:**
- [ ] Ekstrak konten dari komponen monolit jika ada
- [ ] Buat UI minimal dengan data loading dari hooks
- [ ] Implementasi bertahap per module, mulai dari Prospect > Project > Master Data

**Risk:** Medium — volume tinggi, perlu konsistensi pattern.

---

## 4. Prioritas 3: Jangka Menengah (Week 5-8)

### 4.1 Implementasi State Machines

**6 state machine sesuai Doc 013:**

| State Machine | States | Transitions |
|---------------|--------|-------------|
| **Prospect** | SDR → Field → Decision → Won/Lost | ~8 transitions |
| **Project** | Draft → Active → Review → Completed/Cancelled | ~12 transitions |
| **Approval** | Pending → In Review → Approved/Rejected/Revision | ~6 transitions |
| **Document** | Draft → Review → Final/Obsolete | ~6 transitions |
| **User** | Active → Inactive → Suspended → Terminated | ~5 transitions |
| **Base** | Generic state machine engine untuk reuse | - |

**Checklist:**
- [ ] Buat `shared/src/state-machine.ts` — engine generic
- [ ] Implement masing-masing state machine
- [ ] Integrasikan ke backend services
- [ ] Tambah validasi transisi di setiap endpoint

**Files affected:**
- `shared/src/index.ts` — shared state machine types
- `backend/src/services/*.ts` — panggil state machine
- `backend/src/api/v1/*.ts` — validasi status

**Risk:** High — kompleksitas tinggi, dampak ke banyak modul.

### 4.2 Refactor Monolit Komponen

**3 komponen monolit besar:**

| Komponen | Ukuran | Strategi Refactor |
|----------|--------|-------------------|
| **MasterDataPage.tsx** | ~153KB | Split per entity type (Customer, Competitor, Question, dll) |
| **ProjectDetailPage.tsx** | ~106KB | Split per tab (sudah ada stub tab pages) |
| **ReportsPage.tsx** | ~57KB | Split per report type (Sales, Performance, Project) |

**Checklist:**
- [ ] Identifikasi sections dalam tiap monolit
- [ ] Extract ke file komponen terpisah di sub-direktori masing-masing
- [ ] Update routing jika perlu
- [ ] Test visual regression

**Risk:** Medium — perlu hati-hati agar tidak merusak UI yang sudah jalan.

### 4.3 Implementasi Approval Engine

**Sesuai Docs 039, 040, 041, 042:**

- [ ] Multi-level approval chain (sequential & parallel)
- [ ] Parallel review + targeted revision
- [ ] SLA escalation engine
- [ ] Backup approver & reassignment
- [ ] Integrasi dengan state machine

**Checklist:**
- [ ] `backend/src/services/approval.service.ts`
- [ ] `backend/src/services/sla-engine.service.ts`
- [ ] `backend/src/services/escalation.service.ts`
- [ ] API endpoints: `POST /approvals`, `GET /approvals/:id`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject`, `POST /approvals/:id/revision`

**Risk:** High — kompleksitas bisnis tinggi.

### 4.4 Loading, Empty, Error States

**Checklist per halaman:**
- [ ] Tambah `isLoading` → `PageSkeleton` saat fetching data
- [ ] Tambah `isEmpty` → `EmptyState` (ikon + pesan + CTA)
- [ ] Tambah `isError` → `ErrorBoundary` atau inline error dengan retry button
- [ ] Konsisten menggunakan komponen yang sudah ada

**Files affected:**
- Semua halaman di `frontend/src/features/*/`

**Risk:** Low — hanya UI tambahan.

---

## 5. Prioritas 4: Jangka Panjang (Week 9+)

### 5.1 Testing Infrastructure

| Layer | Tool | Target |
|-------|------|--------|
| **Unit Test (UI)** | Vitest + React Testing Library | Komponen UI, shared components |
| **Unit Test (Utils)** | Vitest | Formatter, validator, constants |
| **Integration (Hooks)** | Vitest + MSW | React Query hooks with mocked API |
| **Integration (API)** | Supertest + Vitest | Backend endpoints |
| **E2E** | Playwright | Critical flows (login → prospect → project) |

**Prioritas test:**
- [ ] Auth flow (login, logout, token refresh, RBAC)
- [ ] Prospect CRUD + workflow
- [ ] Project CRUD + tabs
- [ ] Approval flow

### 5.2 Mobile Responsiveness

- [ ] Hamburger menu untuk sidebar
- [ ] Responsive DataTable (card view on mobile)
- [ ] Touch-friendly targets (min 44px)
- [ ] Bottom navigation untuk mobile

### 5.3 AI Frontend Integration

Backend AI endpoints sudah siap (summarize, analyze, insight, search).

- [ ] AI Executive Summary widget di Project Detail
- [ ] AI Prospect Analysis di Prospect Detail
- [ ] AI Competitor Analysis
- [ ] AI-powered search di GlobalSearch component
- [ ] KPI Insight widget di Dashboard

### 5.4 Aksesibilitas

- [ ] ARIA labels di semua form controls
- [ ] Keyboard navigation untuk DataTable, Modal, Drawer
- [ ] Focus management
- [ ] Screen reader support
- [ ] Color contrast compliance

### 5.5 Performance

- [ ] Code splitting per page (sudah partial dengan lazy loading)
- [ ] Bundle analysis dengan `vite-plugin-visualizer`
- [ ] Image optimization
- [ ] Memoization untuk komponen berat (DataTable, FilterPanel)
- [ ] Virtual scrolling untuk list besar

---

## 6. Dependency Graph

```
Week 1-2 (Prioritas 1)
├── Wire Backend Routes ───────────────┐
├── Selesaikan Prisma Relations ───────┤
├── Lengkapi Seed Data ────────────────┤
└── Connect Auth Flow E2E ─────────────┘
        │                               │
        ▼                               ▼
Week 3-4 (Prioritas 2)          Week 3-4 (Prioritas 2)
├── API Endpoints Core ───────── ├── Wire React Query Hooks
├── Implement Page Stubs ──────── └── Hapus mock-data.ts
└── (tergantung: Prospects,
    Projects, Master Data)
        │
        ▼
Week 5-8 (Prioritas 3)
├── State Machines (tergantung API endpoints selesai)
├── Refactor Monolit (tergantung page stubs selesai)
├── Approval Engine (tergantung state machine)
└── Loading/Empty/Error States
        │
        ▼
Week 9+ (Prioritas 4)
├── Testing
├── Mobile Responsive
├── AI Frontend
├── Accessibility
└── Performance
```

---

## 7. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | Perubahan Prisma schema merusak migration existing | Medium | High | Backup migration, test di DB terpisah |
| 2 | API backend tidak konsisten dengan frontend service contracts | High | Medium | Dokumentasi API spec, tulis integration test |
| 3 | State machine logic complex menyebabkan regresi | High | High | Unit test tiap state transition |
| 4 | Volume 36 page stubs menyebabkan burnout | High | Medium | Prioritaskan per modul, sprint plan realistic |
| 5 | Mock data sudah terlanjur diandalkan untuk demo | Medium | Medium | Wire real API bertahap, fallback mock selama transisi |
| 6 | Approval engine SLA timing tidak akurat | Medium | High | Gunakan Redis untuk timing, test dengan cron simulation |
| 7 | Dual frontend (root src/ vs frontend/) menyebabkan konflik | Medium | High | Arsipkan root src/, jadikan frontend/ sebagai single source |

---

## Lampiran: Dokumen MD Reference

| Doc # | Nama | Relevance |
|-------|------|-----------|
| 013 | Global State Machine Reference | Prioritas 3 |
| 019 | Authentication Session Module | Prioritas 1 |
| 020 | Authorization Enforcement | Prioritas 1 |
| 021 | Master Customer and Category | Prioritas 2 |
| 023 | Master Competitor Module | Prioritas 2 |
| 024 | Master Question and Question Type | Prioritas 2 |
| 032 | Prospect Management Module | Prioritas 2 |
| 033 | Project Core Module | Prioritas 2 |
| 034-038 | RKS, LPHS, Harga Kompetitor, Pemenang, Cancellation | Prioritas 2-3 |
| 039-042 | Approval Engine, Review, SLA, Backup | Prioritas 3 |
| 043-045 | KPI Module | Prioritas 3 |
| 046-047 | Notification Module | Prioritas 3 |
| 050 | Dashboard Module | Prioritas 2 |
| 051 | Reporting Module | Prioritas 3 |
| 052 | Audit Trail Module | Prioritas 3 |
| 054 | Full Database Schema DDL | Prioritas 1 |
| 057 | Full API Endpoint Specification | Prioritas 2 |
| 058 | Frontend Architecture & Component Library | Prioritas 1 |
| 062 | Master Test Case Catalog | Prioritas 4 |
| 063 | Sprint Planning & Module Dependency | Semua fase |
