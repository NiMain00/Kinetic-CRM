# Kinetic CRM — Project State & Implementation Plan

> Generated: 24 Jun 2026
>
> Berdasarkan audit menyeluruh terhadap 65 dokumen spesifikasi, source code backend & frontend, infrastruktur, dan database schema.

---

## 1. Project Overview

**Kinetic CRM** adalah Enterprise CRM untuk manajemen prospek/proyek kontraktor/pengadaan pemerintah Indonesia. Mendukung siklus lengkap: **Prospecting → Project → RKS → LPHS/SIOS → Harga Kompetitor → Pemenang → Delivery**.

| Item | Detail |
|------|--------|
| **Tech Stack** | Node.js/Express (backend), React/Vite (frontend), MySQL 8 (database), Redis (cache), Docker |
| **Language** | TypeScript ~5.8 (full-stack) |
| **ORM** | Prisma ~6.x (38 models, 1025 lines) |
| **Auth** | JWT + bcryptjs + role-based access control (RBAC) + scope-based multi-tenancy |
| **AI** | Gemini (default) + OpenAI adapter, provider abstraction, cost controller ($10/day cap) |
| **State Mgmt** | Zustand (client state) + TanStack React Query ~5.x (server state) |
| **Forms** | react-hook-form + zod (installed, mostly unused) |
| **Styling** | Tailwind CSS ~4.1 + lucide-react icons |
| **Infra** | Docker compose (6 services: nginx, frontend, backend, scheduler, mysql, redis) |

---

## 2. Architecture

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌────────┐
│ Browser │────▶│ Nginx    │────▶│ Express    │────▶│ MySQL  │
│ (React) │     │ (proxy)  │     │ (API)      │────▶│ Redis  │
└─────────┘     └──────────┘     └────────────┘     └────────┘
                                       │
                                 ┌─────┴──────┐
                                 │  Scheduler  │
                                 │ (same image)│
                                 └────────────┘
```

**Backend Layer Stack:**
```
Route Layer (18 route groups)
    ↓
Middleware: auth → rbac → scope → rate-limit
    ↓
Validator Layer (zod schemas)
    ↓
Service Layer (business logic)
    ↓
Repository Layer (Prisma queries)
    ↓
Prisma ORM → MySQL 8
```

**Frontend Layer Stack:**
```
Pages (React components, ~30 feature pages)
    ↓
React Query Hooks (useQuery/useMutation)
    ↓
Service Layer (Axios API client)
    ↓
Zustand Stores (auth, notification, UI)
    ↓
Backend API
```

---

## 3. Current State — What's Done ✅

### Database (Prisma Schema) — ~95%
- ✅ 38 models defined: Organization (Company/Division/Department/Branch), Access Control (Role/Permission), Auth (User/Session), Master Data (12 models), Prospect (5 models), Project Core (2 models), RKS (3 models), LPHS/SIOS (4 models), Harga Kompetitor (2 models), Pemenang Delivery (2 models), Approval Engine (4 models), Document (1 model), KPI/Target (4 models), Notification (3 models), Audit (1 model), AI/Config (5 models)
- ✅ 2 migrations applied (init + projectType on Prospect)
- ✅ Relations and foreign keys are properly defined

### Backend Routes — ~95%
- ✅ **All 18 route groups** mounted in `app.ts` (health, auth, ai, users, prospects, projects, rks, lphs-sios, harga-kompetitor, pemenang-delivery, approvals, documents, dashboard, master-data, config, notifications, reports, audit)
- ✅ Auth routes: login, logout, refresh, change-password, me
- ✅ User routes: CRUD, reset-password, lock/unlock
- ✅ Prospect routes: full CRUD with listing/get/create/update + review workflow
- ✅ Project routes: CRUD + cancellation + timeline
- ✅ RKS routes: state machine (draft→submitted→approved/rejected→draft)
- ✅ LPHS/SIOS routes: department review + PM final approval
- ✅ Harga Kompetitor routes: price submissions + competitor prices
- ✅ Pemenang Delivery routes: tender results + delivery targets
- ✅ Approvals routes: inbox/list, decide (approve/reject), reassign
- ✅ Documents routes: upload, download, delete, versioning
- ✅ Dashboard routes: aggregation queries
- ✅ Master Data routes: customers, competitors, categories, statuses, doc types, questions, holidays, loss reasons
- ✅ Config routes: organization, workflow, SLA, roles, targets, notifications, upload policies, periods, question types, integration
- ✅ Notifications routes: list, mark-read, mark-all-read
- ✅ Reports routes: win-loss, pipeline, progress-vs-target, export
- ✅ Audit routes: audit log listing/aggregation

### Backend Services — ~80%
- ✅ `auth.service.ts` — login, logout, refresh, change-password
- ✅ `user.service.ts` — CRUD + password reset + lock/unlock
- ✅ `prospect.service.ts` — CRUD + review workflow + conversion to project
- ✅ `project.service.ts` — CRUD + cancellation + timeline events (file exists, verify contents)
- ✅ `rks.service.ts` — state machine workflow
- ✅ `lphs-sios.service.ts` — department review + approvals
- ✅ `document.service.ts` — upload/download/versioning
- ✅ `notification.service.ts` — dispatch
- ✅ `approval.service.ts` — assign, decide, reassign, SLA
- ✅ `dashboard.service.ts` — aggregation
- ✅ `token.service.ts` — JWT management
- ⬜ KPI service endpoints (definitions, weights, targets, progress snapshots)
- ✅ AI service: provider abstraction (Gemini/OpenAI), prompt manager, cost controller

### Backend Middleware — 100%
- ✅ JWT auth middleware
- ✅ RBAC middleware (role-based access control)
- ✅ Scope middleware (multi-tenancy by branch/department)
- ✅ Global error handler
- ✅ Rate limiter
- ✅ Multer file upload middleware

### Backend Validators — 100%
- ✅ Zod schemas for: auth, user, prospect, project, rks, lphs-sios, document

### Backend TypeScript — ✅ 0 errors

### Frontend Pages — ~85%
- ✅ Auth: LoginPage, ForgotPasswordPage, ResetPasswordPage
- ✅ Dashboard: DashboardPage
- ✅ Prospects: ProspectListPage, ProspectDetailPage, ProspectFormPage
- ✅ Projects: ProjectListPage, ProjectFormPage, ProjectDetailPage (with 8 tabs: Overview, RKS, LPHS/SIOS, Harga, Dokumen, Pemenang, Delivery, Timeline)
- ✅ Approvals: ApprovalInboxPage, ApprovalReviewDrawer
- ✅ Master Data: MasterDataLayout + 8 sub-pages (Category, Competitor, Customer, DocType, Holiday, LossReason, Period, Question)
- ✅ Config: ConfigLayout + 11 sub-pages (Dashboard, Integration, NotifTemplate, Org, Period, QuestionTypes, Roles, Sla, Status, Targets, Upload, Workflow)
- ✅ Reports: ReportsIndexPage, ReportsPage, WinLossReportPage, PipelineReportPage, KPIDashboardPage, KPIProgressPage, KPITargetsPage
- ✅ Users: UserListPage, UserDetailPage, UserFormPage, UsersPage
- ✅ Audit: AuditLogPage, AuditPage
- ✅ Notifications: NotificationsPage
- ✅ Profile: ProfilePage
- ✅ Errors: ForbiddenPage, NotFoundPage, ServerErrorPage

### Frontend Architecture — ~90%
- ✅ Component library: layout (AppLayout, Sidebar, Topbar, Breadcrumb, PageLoader, PageSkeleton) + shared (DataTable, FilterPanel, FormWrapper, Pagination, EmptyState, ErrorBoundary, StatusBadge, GlobalSearch, Responsive) + UI (Button, Card, Input, Select, Badge, Table, Modal, Drawer, Tabs, DatePicker, Toast)
- ✅ React Query hooks: 9 query hooks + 4 mutation hooks (useApprovals, useAudit, useConfig, useDashboard, useNotifications, useProjects, useProspects, useReports, useUsers, useApprovalMutations, useAuthMutations, useProjectMutations, useProspectMutations)
- ✅ API services: 17 service files (api-client with Axios + interceptors, auth, users, prospects, projects, rks, lphs-sios, documents, approvals, dashboard, config, master-data, notifications, reports, audit, ai)
- ✅ Types: api (request/response), domain (prospect, project, approval, user), common enums
- ✅ Zustand stores: authStore, notificationStore, uiStore
- ✅ Router: full route definitions with guards (ProtectedRoute, GuestRoute, RoleRoute)
- ✅ Navigation: sidebar nav-items.ts with all menu groups

### Frontend TypeScript — ✅ 0 errors (after build)

### Infrastructure — ~90%
- ✅ Docker compose (6 services: nginx, frontend, backend, scheduler, mysql, redis)
- ✅ Nginx config (SPA + API reverse proxy)
- ✅ SSL certificates (self-signed for dev)
- ✅ Dockerfiles for backend, frontend
- ✅ MySQL init scripts
- ✅ Storage backups script

### Fixes Completed
- ✅ Notifikasi route alias (`POST /:id/mark-read`)
- ✅ Reports: `GET /progress-vs-target` + `POST /:reportType/export`
- ✅ Users: `POST /:id/reset-password`, lock, unlock
- ✅ Config write endpoints (PUT/POST/PATCH untuk organization, workflow, sla, notif, roles, dll)
- ✅ 12 missing config endpoints added
- ✅ `projects.delete` permission bypass for admin

---

## 4. Current State — What's NOT Done ❌

### Backend — Remaining
| # | Item | Priority | Blocker |
|---|------|----------|---------|
| 1 | **KPI backend routes** — `/api/v1/kpi` endpoints (definitions, weights, targets, progress snapshots) | High | None — models exist in Prisma |
| 2 | **State machines** — Prospect, Project, Approval, Document, User (per Doc 013) | High | Need shared state machine engine |
| 3 | **Scheduler jobs** — SLA deadline checking, notification dispatch, session cleanup, KPI snapshot | Medium | Infrastructure already scaffolded |

### Frontend — Remaining
| # | Item | Priority | Blocker |
|---|------|----------|---------|
| 1 | **Wire Config pages to API** — 11 config pages still use hardcoded `INITIAL_*` data instead of `useConfig()` hook | **Highest** | None |
| 2 | **Wire MasterData pages to API** — 8 master data pages need to use `masterDataService` | **Highest** | None |
| 3 | **Wire Reports + KPI pages to API** — 5 report/KPI pages still use dummy data | **Highest** | KPI backend routes |
| 4 | **Wire Users pages to API** — UserList/Detail/Form use hardcoded `ALL_USERS` | **Highest** | None |
| 5 | **Wire Audit page to API** — `AuditPage` still uses `INITIAL_LOGS` | **Highest** | None |
| 6 | **Remove mock-data.ts** — 4 datasets still used as fallback | Medium | All pages must be wired first |
| 7 | **Loading/Empty/Error states** — Add `isLoading` → `PageSkeleton`, `isEmpty` → `EmptyState`, `isError` → inline error with retry | Medium | None |
| 8 | **Confirmation dialogs** — Replace native `confirm()` with Modal component | Low | None |
| 9 | **Toast standardization** — Unify success/error toast patterns | Low | None |

### Refactoring — Remaining
| # | Item | Size | Priority |
|---|------|------|----------|
| 1 | **ProjectDetailPage** — Split ~106KB monolith into proper tab components (8 tabs already exist as stubs) | High | Medium |
| 2 | **MasterDataPage** — Already split into 8 sub-pages | Done | - |
| 3 | **ReportsPage** — Split ~57KB into proper sub-pages | Medium | Medium |

### Technical Debt — Remaining
| # | Item | Priority |
|---|------|----------|
| 1 | **react-hook-form migration** — LoginPage, ProspectFormPage, ProjectFormPage, UserFormPage, all Config/MasterData forms still use manual `useState` | Medium |
| 2 | **Testing infrastructure** — 0 tests across entire project | Low (Phase 4) |
| 3 | **Root config cleanup** — root `package.json`/`vite.config.ts`/`tsconfig.json` duplicates `frontend/` versions | Low |
| 4 | **CI/CD** — GitHub Actions workflows are empty | Low |
| 5 | **Mobile responsiveness** — Hamburger menu, card-view DataTable, touch targets | Low |
| 6 | **Accessibility** — ARIA labels, keyboard navigation, focus management | Low |
| 7 | **Security hardening** — OWASP audit, input sanitization, XSS testing | Low |

### AI Features — NOT in Scope (untouched)
- ✅ AI Provider abstraction (Gemini/OpenAI) done
- ✅ Prompt manager & cost controller done
- ❌ AI Executive Summary widget (Project Detail)
- ❌ AI Prospect Analysis (Prospect Detail)
- ❌ AI Competitor Analysis
- ❌ AI-powered search (GlobalSearch component)
- ❌ KPI Insight widget (Dashboard)

---

## 5. Implementation Priorities

### Priority 1: IMMEDIATE (Week 1) — API Wiring Frontend
Frontend pages are built but still use hardcoded mock data. Backend is ready. Wire them:

```
Config Pages (11) ──── useConfig() hook ──── Backend (ready)
MasterData (8)    ──── masterDataService ──── Backend (ready)
Users Pages (3)   ──── useUsers() hook  ──── Backend (ready)
Audit Pages (2)   ──── useAudit() hook  ──── Backend (ready)
Reports + KPI (5) ──── useReports() + KPI endpoint ──── Backend (KPI routes missing)
```

### Priority 2: SHORT-TERM (Week 2) — Features
```
KPI Backend Routes ─── Prisma models exist, endpoints missing
State Machines     ─── Shared engine + 5 state machines
Scheduler Jobs     ─── SLA, notifications, cleanup, KPI snapshots
ProjectDetailPage  ─── Split 106KB monolith into tab components
ReportsPage        ─── Split 57KB monolith
```

### Priority 3: MEDIUM-TERM (Week 3) — UX & Quality
```
react-hook-form ─── Replace manual useState in all forms
Loading/Empty/Error states ─── PageSkeleton, EmptyState, ErrorBoundary
Confirmation dialogs ─── Replace native confirm()
Toast standardization
```

### Priority 4: LONG-TERM (Week 4+) — Polish & Production
```
Testing (Vitest + RTL + MSW + Playwright)
Mobile responsiveness
Accessibility (WCAG AA)
Security hardening (OWASP Top 10)
CI/CD (GitHub Actions)
AI frontend features
Performance (code splitting, virtual scrolling)
```

---

## 6. Implementation Order Recommendation

Given the current state (backend ~95% ready, frontend pages built but use mock data), the optimal order is:

```
Week 1:
  ├── Wire Config Pages (11 pages) → ganti INITIAL_* dengan configService hooks
  ├── Wire MasterData Pages (8 pages) → gunakan masterDataService
  ├── Wire Users Pages (3 pages) → gunakan useUsers() hook
  ├── Wire Audit Pages (2 pages) → gunakan useAudit() hook
  └── Wire Reports + KPI Pages (5 pages) → buat KPI backend routes dulu

Week 2:
  ├── KPI backend routes + endpoints
  ├── State Machines (shared engine + 5 implementations)
  ├── Scheduler jobs (SLA, notif, cleanup, KPI)
  ├── Split ProjectDetailPage (106KB → 8 tab components)
  └── Remove mock-data.ts after all pages wired

Week 3:
  ├── react-hook-form migration (Login, Prospect, Project, User, Config, MasterData forms)
  ├── Loading/Empty/Error states on all pages
  ├── Confirmation dialogs standardization
  └── Toast standardization

Week 4+:
  ├── Testing infrastructure (Vitest, RTL, MSW, Playwright)
  ├── Mobile responsiveness
  ├── AI frontend features
  ├── Security hardening
  ├── CI/CD
  └── Performance optimization
```

---

## 7. Key Files Reference

### Backend
| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express app setup + route mounting |
| `backend/src/index.ts` | Entry point |
| `backend/src/scheduler.ts` | Scheduler (needs implementation) |
| `backend/prisma/schema.prisma` | Full DB schema (38 models) |
| `backend/prisma/seed.ts` | Seed data |
| `backend/src/config/env.ts` | Env config |
| `backend/src/config/database.ts` | Prisma client |
| `backend/src/middleware/*.ts` | 6 middleware files |
| `backend/src/api/v1/*.routes.ts` | 18 route files |
| `backend/src/services/*.ts` | 11 service files |
| `backend/src/repositories/*.ts` | 3 repository files |
| `backend/src/validators/*.ts` | 7 Zod schema files |
| `backend/src/services/ai/*.ts` | 6 AI service files |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | App shell (QueryClient + Router) |
| `frontend/src/routes/router.tsx` | All route definitions |
| `frontend/src/routes/nav-items.ts` | Sidebar navigation |
| `frontend/src/services/api-client.ts` | Axios instance |
| `frontend/src/services/mock-data.ts` | Mock data (to be removed) |
| `frontend/src/stores/authStore.ts` | Auth state |
| `frontend/src/hooks/queries/*.ts` | 9 React Query hooks |
| `frontend/src/hooks/mutations/*.ts` | 4 mutation hooks |
| `frontend/src/types/domain/index.ts` | Domain types |
| `frontend/src/components/**/*.tsx` | Shared/UI components |

### Configuration
| File | Purpose |
|------|---------|
| `.env` | Root env |
| `backend/.env` | Backend env |
| `docker/docker-compose.yml` | Docker compose |
| `docker/nginx/*.conf` | Nginx configs |

### Plan Files
| File | Purpose |
|------|---------|
| `PLAN.md` | Active task list (7 high priority, 4 medium, 4 low) |
| `IMPLEMENTATION_PLAN.md` | Detailed 8-phase implementation (578 lines) |
| `IMPLEMENTATION_ROADMAP.md` | Prioritized roadmap with risk register |
| `docs/PHASE_2_1_BACKEND_AUTH.md` | Auth implementation detail |
| `docs/PHASE_2_3_FRONTEND_SERVICES.md` | Services implementation detail |

---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | Mock data sudah terlanjur diandalkan untuk demo | Medium | Medium | Wire real API bertahap, hapus mock-data.ts di akhir |
| 2 | API backend response tidak konsisten dengan frontend service contracts | Medium | Medium | Cek tipe response backend vs frontend types |
| 3 | State machine logic menyebabkan regresi | Medium | High | Unit test setiap state transition |
| 4 | Volume halaman yang perlu di-wire menyebabkan burnout | High | Medium | Prioritaskan per modul, mulai dari Config + MasterData |
| 5 | Approval engine SLA timing tidak akurat | Low | Medium | Gunakan Redis untuk timing |
| 6 | Perubahan Prisma schema merusak migration | Low | High | Backup migration, test di DB terpisah |

---

## 9. Git Log (13 commits)

```
4d8c99c feat: enhance project management with estimated value and margin percentage fields
6f9539e feat: implement project statuses endpoint and integrate into project form/detail
e680d63 feat: add dashboard and user services, project/user validation, backup storage script
0910694 A
d3c3d48 feat: add implementation roadmap and frontend API service layer
9250649 Add Sprint Planning & Module Dependency document
53fbe47 feat(database): initialize database schema with multiple tables
19a0519 Update dependencies/configurations for Node.js 20 and Prisma 6, setup docker
724e9c3 feat: update backend/frontend to use new env vars and configurations
1d4e0d8 Refactor layout and components for mobile responsiveness and accessibility
0cee22f Refactor navigation/routes: remove KPI routes, merge KPI into Reports
605b386 frontend change
33c9dce master data frontend change
60732c2 first Commit
```

---

## 10. Quick Start

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Database setup
cd backend
cp .env.example .env          # Edit DB credentials
npx prisma migrate dev        # Run migrations
npx prisma db seed            # Seed data

# Run dev servers
cd backend && npm run dev     # API on :3001
cd frontend && npm run dev    # SPA on :5173

# Or run with Docker
docker compose -f docker/docker-compose.yml up --build
```
