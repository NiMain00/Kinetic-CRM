# Implementation Plan — Kinetic CRM

> **Comprehensive roadmap** mapping all 65 MD specification documents to codebase implementation.
> Covers frontend (React/TypeScript), backend (Node.js/Express/Prisma), database (MySQL), and infrastructure.

---

## Table of Contents

1. [Current Project Overview](#1-current-project-overview)
2. [Affected Files by Layer](#2-affected-files-by-layer)
3. [Phase 1: Low Risk / Minimal Changes](#3-phase-1--low-risk--minimal-changes)
4. [Phase 2: Medium Risk](#4-phase-2--medium-risk)
5. [Phase 3: High Risk](#5-phase-3--high-risk)
6. [Phase 4: Extreme Risk / Major Refactor](#6-phase-4--extreme-risk--major-refactor)
7. [Dependency Graph](#7-dependency-graph)
8. [Rollback Strategy](#8-rollback-strategy)
9. [Risk Register](#9-risk-register)

---

## 1. Current Project Overview

### Project Structure

```
kinetic-crm/
├── frontend/          # React 19 + TypeScript + Vite 6 SPA
│   └── src/
│       ├── components/   # 23 files — UI (12), Shared (9), Layout (6)
│       ├── features/     # 46 files — 14 feature modules
│       ├── hooks/        # 12 files — queries (7), mutations (4), util (1)
│       ├── services/     # 15 files — api-client, 14 service stubs, mock-data
│       ├── stores/       # 3 files — Zustand stores (auth, ui, notification)
│       ├── types/        # 8 files — domain (6), api (2), common (1)
│       ├── utils/        # 3 files — formatters, validators, constants
│       └── routes/       # 4 files — router, guards, nav-items, page-adapter
├── backend/           # Node.js + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── api/v1/       # 18 route files — 2 implemented, 16 empty stubs
│   │   ├── services/     # 12 files — AI (7 full), biz services (5 stubs)
│   │   ├── middleware/   # 5 files — auth, rbac, error, rate-limit, scope
│   │   └── ...config, utils, validators, repositories
│   └── prisma/           # schema.prisma (1 model), seed.ts (stub)
├── shared/            # Shared types/validation (skeleton)
├── md Kinetic CRM/    # 65 specification documents
└── docs/ infra/       # Docker, scripts
```

### Current State Summary

| Layer | Total | Implemented | Missing |
|-------|-------|:-----------:|:-------:|
| **Frontend Pages** | ~50 screens | All UI shells exist | All use mock data — 0 real API integration |
| **Frontend Services** | 14 files | 3 with methods (auth, projects, prospects) | 11 empty stubs |
| **Frontend React Query** | 11 hooks | 0 implemented | All empty stubs |
| **Backend Routes** | 18 files | 2 wired (health, AI) | 16 empty stubs |
| **Backend Services** | 12 files | AI (7 files, full) | 5 business stubs |
| **Backend Middleware** | 5 files | All exist but underutilized | No real auth flow, no RBAC enforcement |
| **Database (Prisma)** | 61 entities | 1 placeholder (SystemConfig) | 60 entities missing |
| **State Machines** | 6 machines | 0 | 100% missing |
| **API Endpoints** | ~200 | ~10 (AI + health) | ~190 missing |
| **Testing** | 0 | 0 | 100% missing |

### Critical Architecture Issues

1. **No real database** — Only `SystemConfig` Prisma model; 60+ entities from DDL not created
2. **No API endpoints** — 16/18 route files are empty `Router()` objects
3. **Mock-only frontend** — All pages read from `mock-data.ts`; services return mock or are empty
4. **No state enforcement** — No state machines for prospect, project, approval lifecycles
5. **No RBAC** — Route guards are pass-through stubs; `RoleRoute` does nothing
6. **3 monolithic components** — `MasterDataPage` (1,880 lines), `ProjectDetailPage` (1,694 lines), `ReportsPage` (962 lines)
7. **No real auth** — Login is client-side only with hardcoded accounts in localStorage
8. **No accessibility** — Zero ARIA labels, keyboard nav, focus management
9. **No mobile responsiveness** — Sidebar fixed, no hamburger, tables not card-stacked
10. **No testing** — Zero test files across the entire project

---

## 2. Affected Files by Layer

### Backend — All files will be affected

| Category | Count | Files |
|----------|-------|-------|
| **Prisma Schema** | 1 | `prisma/schema.prisma` — complete rewrite from 1→60+ models |
| **Route files** | 18 | All `src/api/v1/*.routes.ts` — 16 empty stubs need full implementation; 2 existing need expansion |
| **Service files** | 12 | All `src/services/*.ts` — 5 stubs need implementation; AI (7 files) needs minor integration |
| **Repository files** | 2 | Both need implementation |
| **Middleware** | 5 | Need real auth enforcement, RBAC wiring |
| **Validators** | 2 | Need expansion for all entities |
| **Utils** | 4 | Minor expansions (pagination, audit) |
| **Config** | 2 | Minor env var additions |
| **Seed** | 1 | Complete rewrite |

### Frontend — All files will be affected

| Category | Count | Files |
|----------|-------|-------|
| **Feature pages** | 46 | All need real API integration — move from mock to hooks/services |
| **Services** | 14 | 11 empty stubs need implementation; 3 need expansion |
| **Hooks (queries)** | 7 | All empty stubs need React Query implementation |
| **Hooks (mutations)** | 4 | All empty stubs need implementation |
| **Types/domain** | 6 | Need expansion to match 60+ entities |
| **Routes/guards** | 4 | Need real auth checks, role-based filtering |
| **Components** | 23 | Minor refinements |
| **Stores** | 3 | Need real integration |
| **mock-data.ts** | 1 | Should be deprecated/deleted after API integration |

### Shared Types (`shared/`)

| Count | Files |
|-------|-------|
| ~10 | All need creation — shared Zod schemas, TypeScript interfaces, constants |

### Infrastructure

| Count | Files |
|-------|-------|
| ~5 | Docker Compose, Nginx config, env templates, migration scripts |

---

## 3. Phase 1 — Low Risk / Minimal Changes

> **Goal**: Fix obvious issues, add non-breaking refinements, improve developer experience.
> **Risk**: Very low — no data loss, no breaking changes, fully reversible.
> **Estimated effort**: 3–5 days

---

### 1.1 Fix CSS & Styling Inconsistencies

**Affected files:**
- `frontend/src/index.css` — Add missing `@keyframes` definitions (`animate-fade-in`, `animate-slide-in`, `custom-scrollbar`)
- All feature `.tsx` files — Audit and standardize color variable usage (replace raw `text-green-600` → `text-success`, `border-gray-200` → `border-border`)

**Changes:**
- Define missing CSS animations in `index.css`
- Create a CSS consistency audit script
- Fix ~30–50 instances of raw Tailwind color literals across feature files

**Dependencies:** None
**Risk:** Very low — purely cosmetic, no behavioral change.
**Rollback:** Revert `index.css` changes; color inconsistencies are non-breaking.
**Impact:** Visual consistency; reduces tech debt.

---

### 1.2 Fix JSX Typos (class= → className)

**Affected files:**
- `frontend/src/features/approvals/ApprovalInboxPage.tsx` (lines 108–110, 122, 138)
- Any other files with `class=` instead of `className`

**Changes:**
- Search and replace `class="` → `className="` across all .tsx files

**Dependencies:** None
**Risk:** Very low — purely syntactic fix.
**Rollback:** Revert individual file changes.
**Impact:** Prevents React warnings, improves correctness.

---

### 1.3 Add Missing Route Entries for Existing Pages

**Affected files:**
- `frontend/src/routes/router.tsx` — Add routes for: `/forgot-password`, `/reset-password/:token`, `/users/list`, `/users/new`, `/users/:id`, `/users/:id/edit`, `/audit/log`, etc.

**Current router status:** ~50 routes defined; ~15 additional routes for existing sub-pages are missing.

**Changes:**
- Register all existing page components in `router.tsx` that currently have files but no route entries
- Add `Suspense` + `lazy()` wrappers for each new route

**Dependencies:** All Phase 1 tasks are independent
**Risk:** Low — adding routes cannot break existing routes.
**Rollback:** Remove the added route entries.
**Impact:** Unlocks navigation to pages that exist but have no route.

---

### 1.4 Add Loading States to All DataTable Components

**Affected files:**
- `frontend/src/components/shared/DataTable.tsx` — Wire `isLoading` prop to skeleton display
- All feature page files that use DataTable — Pass `isLoading={true}` during initial fetch (currently always `false`)

**Changes:**
- Enhance `DataTable` to render `PageSkeleton` when `isLoading=true` and no data
- Add a simple `useLoading` simulation or flag to demonstrate loading states

**Dependencies:** None
**Risk:** Low — adding visibility to loading state cannot break functionality.
**Rollback:** Set `isLoading=false` in all consumers.
**Impact:** Better UX — users see skeleton placeholders instead of blank screens.

---

### 1.5 Add Basic Empty States to List Pages

**Affected files:**
- `frontend/src/features/prospects/ProspectsPage.tsx`
- `frontend/src/features/projects/ProjectListPage.tsx`
- `frontend/src/features/users/UsersPage.tsx`
- `frontend/src/features/notifications/NotificationsPage.tsx`
- All other list/detail pages

**Changes:**
- Use existing `EmptyState` component in each list page when data array is empty
- Add contextual messages (e.g., "Belum ada prospek. Buat prospek baru untuk memulai.")

**Dependencies:** Phase 1.4 (DataTable enhancement is helpful but not required)
**Risk:** Low — purely additive UI improvement.
**Rollback:** Remove EmptyState usage from affected files.
**Impact:** Better UX — users see helpful guidance instead of blank tables.

---

### 1.6 Update UI Labels to Bahasa Indonesia

**Affected files:**
- All feature `.tsx` files — English labels mixed with Indonesian; MD spec requires Indonesian

**Changes:**
- Replace English labels throughout with Indonesian equivalents
- Update status labels, button text, table headers, filter labels, error messages

**Dependencies:** None
**Risk:** Low — text changes only.
**Rollback:** Revert text changes file-by-file.
**Impact:** Language consistency with MD specification requirements.

---

### 1.7 Add Error Boundaries Per Feature Module

**Affected files:**
- `frontend/src/components/shared/ErrorBoundary.tsx` — Already exists, may need minor enhancement
- `frontend/src/routes/router.tsx` — Wrap each route's page component in `<ErrorBoundary>`
- Individual feature pages — Wrap widgets and sub-components

**Changes:**
- Wrap each lazy-loaded route in `ErrorBoundary`
- Add fallback UI with "Coba Lagi" (retry) button

**Dependencies:** None
**Risk:** Low — ErrorBoundary catches exceptions without affecting normal flow.
**Rollback:** Remove `ErrorBoundary` wrappers from routes.
**Impact:** Prevents entire app crash from a single component error.

---

## 4. Phase 2 — Medium Risk

> **Goal**: Implement API services, real data fetching, and authentication; refactor monolithic pages into sub-components.
> **Risk**: Medium — changes affect data flow, but with proper testing are reversible.
> **Estimated effort**: 2–3 weeks

---

### 2.1 Implement Real Authentication (Backend + Frontend)

**Affected files:**

Backend:
- `backend/src/api/v1/auth.routes.ts` — Full rewrite: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh`
- `backend/src/services/auth.service.ts` — Implement `login()`, `logout()`, `refreshToken()`, `validateSession()`
- `backend/src/repositories/user.repository.ts` — Implement `findByUsername()`, `updateLastLogin()`
- `backend/prisma/schema.prisma` — Add `User` model with username, password_hash, role, permissions, is_active, last_login_at, failed_login_count, locked_until

Frontend:
- `frontend/src/services/auth.ts` — Implement `login()`, `logout()`, `getMe()`, `refreshToken()` API calls
- `frontend/src/stores/authStore.ts` — Wire to real API calls; add `loading`, `error` states
- `frontend/src/hooks/mutations/useAuthMutations.ts` — Implement login/logout mutations
- `frontend/src/features/auth/LoginPage.tsx` — Connect form submission to authStore.login()
- `frontend/src/routes/guards.tsx` — Implement real `ProtectedRoute` (redirect if not authenticated), `GuestRoute` (redirect if already authenticated), `RoleRoute` (check user role)

**New Prisma model:**
```prisma
model User {
  id               String   @id @default(uuid())
  username         String   @unique
  password_hash    String
  email            String   @unique
  full_name        String
  role             String   // 'cabang' | 'pm' | 'departemen' | 'management' | 'admin'
  is_active        Boolean  @default(true)
  failed_login_count Int    @default(0)
  locked_until     DateTime?
  last_login_at    DateTime?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}
```

**Dependencies:**
- Requires Phase 1.3 (route fixes) — guards need routes to protect
- Requires Prisma schema update (User model)
- All subsequent phases depend on auth being functional

**Risk:** Medium — auth changes affect all protected routes. If auth breaks, entire app becomes inaccessible.

**Rollback:**
1. Keep mock data path as fallback — add `useMock` feature flag in env
2. Revert router guards to pass-through stubs
3. Revert `authStore` to previous mock behavior

**Impact:** This is the **gate to all real API integration**. Without auth, no other API feature can work properly.

---

### 2.2 Implement Prisma Full Schema (All 61 Entities)

**Affected files:**
- `backend/prisma/schema.prisma` — Complete rewrite from 1 to 60+ models mirroring DDL spec (Doc 054)
- `backend/prisma/seed.ts` — Add seed data for master tables (roles, permissions, statuses, customers, competitors, etc.)

**New models (60 total, all defined in `054_FULL_DATABASE_SCHEMA_DDL.md`):**

| # | Domain | Models |
|---|--------|--------|
| 1 | Organization | `Company`, `Division`, `Department`, `Branch`, `Position` |
| 2 | Access Control | `Role`, `Permission`, `RolePermission`, `UserRole`, `UserPosition` |
| 3 | Auth | `User`, `ActiveSession`, `PasswordResetToken` |
| 4 | Master Data | `Customer`, `Industry`, `ProjectCategory`, `ProjectStatus`, `StatusTransition`, `DocumentType`, `Competitor`, `QuestionType`, `QuestionTypeOption`, `Question`, `QuestionOption`, `ReportingPeriod`, `PublicHoliday`, `LossReason`, `ApprovalLevel` |
| 5 | Prospect | `Prospect`, `ProspectAnswer`, `ProspectAnswerOption`, `ProspectReviewQuestion`, `ProspectReviewNote` |
| 6 | Project | `Project`, `ProjectTimelineEvent`, `ProjectStatusHistory` |
| 7 | RKS | `Rks`, `RksReviewQuestion`, `RksReviewNote`, `RksAnswer` |
| 8 | LPHS/SIOS | `LphsSios`, `LphsDepartmentReview`, `LphsTargetedRevision`, `LphsRevisionDepartment` |
| 9 | Pricing | `PriceSubmission`, `ProjectCompetitor` |
| 10 | Result | `TenderResult`, `ProjectLossDetail`, `DeliveryTarget` |
| 11 | Approval | `ApprovalWorkflowStage`, `Approval`, `ApprovalReassignment`, `BackupApproverDelegation` |
| 12 | Documents | `Document`, `DocumentVersion` |
| 13 | KPI | `KpiDefinition`, `KpiWeight`, `Target`, `TargetProgressSnapshot` |
| 14 | Notification | `NotificationTemplate`, `Notification`, `NotificationRecipient` |
| 15 | Config | `SlaConfig`, `SlaReminderConfig`, `UploadPolicyConfig`, `UploadPolicyMimeType`, `IntegrationConfig`, `NotificationTemplateConfig` |
| 16 | Audit | `AuditLog` |
| 17 | AI | `AiRequestLog` |

**Dependencies:** None (schema can exist without code using it)
**Risk:** Medium — schema migration could fail if MySQL not configured; no data loss risk since no real data exists yet.

**Rollback:** Run `prisma migrate down` or delete migration and re-run.
**Impact:** Foundation for all backend business logic. Without this, no other backend task is possible.

---

### 2.3 Implement API Service Layer (Frontend)

**Affected files:**
- All 14 files in `frontend/src/services/` — Implement real HTTP calls using Axios
- `frontend/src/services/api-client.ts` — Enhance with token refresh interceptor, error mapping

**Service implementations needed:**

| Service | Endpoints |
|---------|-----------|
| `auth.ts` | login, logout, getMe, refreshToken, changePassword |
| `projects.ts` | list, getById, create, update, cancel, getTimeline, getStatusHistory |
| `prospects.ts` | list, getById, create, update, delete, submit, approve, reject, convert, getTimeline |
| `approvals.ts` | list, getById, approve, reject, revise, getHistory |
| `master-data.ts` | CRUD for customers, competitors, categories, questions, doc-types, periods, holidays, loss-reasons, industries, statuses |
| `config.ts` | CRUD for org hierarchy, roles, permissions, SLA, workflow stages, notification templates, upload policies, integrations |
| `users.ts` | list, getById, create, update, delete, lock, unlock, resetPassword |
| `dashboard.ts` | getSummary, getPendingApprovals, getApproachingDeadline |
| `notifications.ts` | list, markRead, markAllRead, getUnreadCount |
| `reports.ts` | winLoss, pipeline, kpiProgress, export |
| `rks.ts` | getByProject, create, update, submit, approve, reject |
| `lphs-sios.ts` | getByProject, create, submit, departmentApprove, pmApprove, revise |
| `audit.ts` | list, getById, export |
| `ai.ts` | summarize, analyze, search |

**Dependencies:** Phase 2.2 (Prisma schema) — services need API endpoints to call; but can be developed in parallel with backend mock
**Risk:** Medium — service layer changes the data architecture from mock to real. If API calls fail, pages show empty/error states instead of mock data.

**Rollback:** 
1. Keep `mock-data.ts` and add `useMock: true` env flag
2. Services can fall back to mock data when API is unavailable

**Impact:** Core data pipeline change — every page's data source changes.

---

### 2.4 Implement React Query Hooks (Frontend)

**Affected files:**
- All 7 files in `frontend/src/hooks/queries/` — Implement `useQuery` calls using services
- All 4 files in `frontend/src/hooks/mutations/` — Implement `useMutation` calls using services
- All feature pages — Replace direct mock data imports with hook calls

**Hook implementations needed:**

| Hook | Key Implementation |
|------|--------------------|
| `useProjects` | `useQuery({ queryKey: ['projects', filters], queryFn: () => projectsService.list(filters) })` |
| `useProjectDetail` | `useQuery({ queryKey: ['project', id], queryFn: () => projectsService.getById(id) })` |
| `useProspects` | Similar pattern with filters, pagination |
| `useProspectDetail` | Similar pattern |
| `useApprovals` | Query keys: `['approvals', type, status]` |
| `useDashboard` | Query keys: `['dashboard', period]` |
| `useNotifications` | Query keys: `['notifications', type, page]` |
| `useConfig` | Query keys per config section |
| `useUsers` | Query keys with filters |
| `useMasterData` | Query keys per entity type |

**Dependencies:** Phase 2.3 (service layer)
**Risk:** Medium — hooks orchestrate data flow. Incorrect caching could cause stale data or over-fetching.

**Rollback:** Keep inline mock data as fallback; switch between hook and mock via feature flag.
**Impact:** Fundamental data architecture change — all pages transition from synchronous mock data to async API data.

---

### 2.5 Refactor Monolithic Pages into Sub-Components

**Affected files:**

**MasterDataPage.tsx (1,880 lines) → Split into:**
- `frontend/src/features/master-data/MasterDataPage.tsx` — Tab layout shell (keep, but thin)
- `frontend/src/features/master-data/MasterCustomerPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterCompetitorPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterCategoryPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterQuestionPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterDocTypePage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterHolidayPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterLossReasonPage.tsx` — Already exists, wire into tab
- `frontend/src/features/master-data/MasterPeriodPage.tsx` — Already exists, wire into tab

**ProjectDetailPage.tsx (1,694 lines) → Split into:**
- `frontend/src/features/projects/ProjectDetailPage.tsx` — Tab container + shared logic (keep, ~300 lines)
- All 8 tab files in `projects/tabs/` — Already exist with rich content; wire to real hooks

**ReportsPage.tsx (962 lines) → Split into:**
- `frontend/src/features/reports/ReportsIndexPage.tsx` — Already exists
- `frontend/src/features/reports/WinLossReportPage.tsx` — Already exists
- `frontend/src/features/reports/PipelineReportPage.tsx` — Already exists
- `frontend/src/features/reports/KPIReportPage.tsx` — Already exists

**Dependencies:**
- Phase 2.3 (services) — decomposed pages need real API data
- Phase 2.4 (hooks) — decomposed pages use React Query hooks

**Risk:** Medium-high — extracting code from monolithic files could introduce logic errors if shared state is not properly identified.

**Rollback:** Keep original monolithic file as backup; rename to `.legacy.tsx` and import from the new shell until stable.
**Impact:** Maintenability improvement — eliminates 3 largest files in codebase (together ~4,500 lines).

---

### 2.6 Implement Role-Based Navigation & Route Guards

**Affected files:**
- `frontend/src/routes/nav-items.ts` — Add `roles: string[]` to each nav item definition
- `frontend/src/routes/guards.tsx` — Implement real `RoleRoute` that checks user.role against allowed roles
- `frontend/src/components/layout/Sidebar.tsx` — Filter nav items by current user's role using `filterNavItems()`
- `frontend/src/stores/authStore.ts` — Ensure user role is available after login

**Navigation role mapping (from Doc 012):**

| Menu Item | Cabang | PM | Departemen | Management | Admin |
|-----------|:------:|:--:|:----------:|:----------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prospek | ✅ | ✅ | ❌ | ❌ | ❌ |
| Proyek | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approval | ❌ | ✅ | ✅ | ✅ | ❌ |
| Reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| Master Data | ❌ | ❌ | ❌ | ❌ | ✅ |
| Config | ❌ | ❌ | ❌ | ❌ | ✅ |
| Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit | ❌ | ❌ | ❌ | ✅ | ✅ |
| KPI | ❌ | ✅ | ✅ | ✅ | ✅ |

**Dependencies:** Phase 2.1 (auth) — role is available from auth payload
**Risk:** Medium — incorrect role mapping could lock users out or expose admin features to unauthorized roles.

**Rollback:** Revert to flat nav-items; remove role filtering from Sidebar.
**Impact:** Security-critical — ensures users only see features appropriate for their role.

---

## 5. Phase 3 — High Risk

> **Goal**: Implement state machines, SLA engine, approval workflow, KPI module, and full API endpoints — the core business logic that makes this a CRM.
> **Risk**: High — complex business rules, cross-module dependencies, data integrity constraints.
> **Estimated effort**: 4–6 weeks

---

### 3.1 Implement State Machines (Backend)

**Affected files:**
- `backend/src/services/state-machines/` — **New directory** with:
  - `prospect-state-machine.ts` — 5 states, transitions, precondition validation
  - `project-state-machine.ts` — 10 states (tender), 7 states (prospecting)
  - `approval-state-machine.ts` — 5 states, SLA timer integration
  - `document-state-machine.ts` — 4 states, versioning rules
  - `user-state-machine.ts` — 3 states, lockout rules
  - `state-machine.base.ts` — Abstract base class with transition validation, audit logging, side-effect dispatch

**Key design (from Doc 013):**
```typescript
abstract class StateMachine<TState, TTransition> {
  abstract transitions: Map<TState, TTransition[]>;
  abstract preconditions: Map<TTransition, (entity: TState) => boolean>;
  abstract sideEffects: Map<TTransition, (entity: TState) => Promise<void>>;
  
  async transition(entity: TState, to: TTransition): Promise<TState> {
    // 1. Validate transition is allowed from current state
    // 2. Check preconditions
    // 3. Perform state change
    // 4. Audit log
    // 5. Fire side effects (notifications, SLA timers, etc.)
    // 6. Return updated entity
  }
}
```

**Dependencies:**
- Phase 2.2 (Prisma schema) — state machines reference entity types and status fields
- Phase 2.1 (auth) — transitions need current user for audit logging

**Risk:** High — state machine bugs can put entities in invalid states, corrupting business data.

**Rollback:**
1. All transitions log to audit_logs table — enables manual correction
2. Add admin "force state transition" endpoint for emergency recovery
3. Transition validation runs before any DB write — no partial updates

**Impact:** Core business logic enforcement — this is the **heart** of the CRM workflow.

---

### 3.2 Implement All Business API Endpoints (Backend)

**Affected files:**
All 16 currently-empty route files in `backend/src/api/v1/`:

| Route File | Endpoints to Implement | Service Dependency |
|-----------|----------------------|--------------------|
| `auth.routes.ts` | login, logout, me, refresh, change-password | `auth.service.ts` |
| `users.routes.ts` | CRUD + lock/unlock/reset-password | `user.service.ts` (new) |
| `prospects.routes.ts` | 12 endpoints (CRUD + workflow) | `prospect.service.ts` |
| `projects.routes.ts` | 7 endpoints (CRUD + cancel + timeline) | `project.service.ts` |
| `rks.routes.ts` | 6 endpoints (CRUD + submit + approve/reject) | `rks.service.ts` (new) |
| `lphs-sios.routes.ts` | 7 endpoints (CRUD + submission + review) | `lphs-sios.service.ts` (new) |
| `harga-kompetitor.routes.ts` | 3 endpoints | `harga.service.ts` (new) |
| `pemenang-delivery.routes.ts` | 4 endpoints | `pemenang.service.ts` (new) |
| `approvals.routes.ts` | Full approval inbox, review, reassign | `approval.service.ts` |
| `master-data.routes.ts` | 30+ CRUD endpoints | `master-data.service.ts` (new) |
| `config.routes.ts` | 30+ CRUD endpoints | `config.service.ts` (new) |
| `notifications.routes.ts` | list, mark-read, unread-count | `notification.service.ts` |
| `reports.routes.ts` | win-loss, pipeline, kpi, export | `report.service.ts` (new) |
| `documents.routes.ts` | upload, download, list, version-history | `document.service.ts` (new) |
| `dashboard.routes.ts` | summary, pending-approvals, deadlines | `dashboard.service.ts` (new) |
| `audit.routes.ts` | list, get-by-id, export | `audit.service.ts` (new) |

**New service files needed (7):**
- `backend/src/services/user.service.ts`
- `backend/src/services/rks.service.ts`
- `backend/src/services/lphs-sios.service.ts`
- `backend/src/services/harga.service.ts`
- `backend/src/services/pemenang.service.ts`
- `backend/src/services/document.service.ts`
- `backend/src/services/dashboard.service.ts`
- `backend/src/services/report.service.ts`
- `backend/src/services/audit.service.ts`

**New repository files needed:**
- `backend/src/repositories/*.repository.ts` — One per domain (10+ files)

**Dependencies:**
- Phase 2.2 (Prisma schema) — all endpoints read/write to database
- Phase 3.1 (state machines) — several endpoints trigger state transitions
- Phase 2.1 (auth middleware) — all endpoints need JWT validation + RBAC

**Risk:** High — each endpoint is a potential source of bugs (SQL injection, broken auth, incorrect business logic, race conditions).

**Rollback:**
1. Mounted routers can be selectively commented out in `app.ts`
2. Each endpoint validates input via Zod before processing
3. All mutations wrapped in transactions for atomicity

**Impact:** Fundamental — turns empty server scaffolding into a functional CRM backend.

---

### 3.3 Implement SLA Engine & Escalation

**Affected files:**
- **New:** `backend/src/services/sla-engine.ts` — Working-day calculation, timer management
- **New:** `backend/src/services/escalation-engine.ts` — Escalation chain processing
- `backend/src/scheduler.ts` — Wire SLA timer checks to periodic scheduler
- `backend/src/utils/audit-logger.ts` — Log SLA breaches to audit

**Key algorithm (from Doc 041):**
```
function calculateDueDate(startDate, slaHours):
  workingDays = 0
  while workingDays < slaHours:
    nextDay = startDate + 1
    if nextDay is not holiday and not weekend:
      workingDays++
    // Auto-escalate at T-1, T+0, T+1, T+3, T+7
```

**Dependencies:**
- Phase 2.2 — Needs `SlaConfig`, `PublicHoliday` tables
- Phase 3.2 — Needs approval endpoints to trigger SLA on creation

**Risk:** High — incorrect working-day calculation could mis-set deadlines across the entire system.

**Rollback:**
1. SLA engine has configuration toggle (`sla_enabled: boolean`)
2. Manual due-date override available for admin
3. Escalation notifications use configurable thresholds

**Impact:** GAP-06 critical gap resolution — SLA enforcement for tender deadlines and approval turnaround.

---

### 3.4 Implement KPI / Target Module

**Affected files:**
- **Backend:**
  - `backend/src/api/v1/kpi.routes.ts` — **New file** for KPI endpoints
  - `backend/src/services/kpi.service.ts` — **New file** — Target CRUD, progress calculation, scoring
  - Uses `KpiDefinition`, `KpiWeight`, `Target`, `TargetProgressSnapshot` tables

- **Frontend:**
  - `frontend/src/features/kpi/KPIDashboardPage.tsx` — Wire to `useKpiDashboard()` hook
  - `frontend/src/features/kpi/KPITargetsPage.tsx` — Wire to `useKpiTargets()` hook
  - `frontend/src/features/kpi/KPIProgressPage.tsx` — Wire to `useKpiProgress()` hook
  - `frontend/src/hooks/queries/useKpi.ts` — **New file** for KPI queries

**Key features (from Docs 043–045):**
- Versioned target periods (monthly/quarterly/annual)
- Weighted composite score with traffic-light indicators
- Real-time vs-target progress bars
- Admin target setting with approval workflow

**Dependencies:** Phase 2.2 (KPI tables), Phase 3.2 (general API pattern)
**Risk:** High — scoring formulas are complex; incorrect calculation affects performance evaluations.

**Rollback:**
1. Scores are computed on-read, not stored — no data corruption risk
2. Progress snapshots are append-only — deletion is just a query removal

**Impact:** GAP-01 critical gap — performance monitoring.

---

### 3.5 Implement Approval Engine (Multi-Level)

**Affected files:**
- `backend/src/services/approval.service.ts` — Implement multi-level approval chain with stages
- `backend/src/services/approval-engine.ts` — **New file** — Precondition checks, escalation integration, backup approver resolution
- `backend/src/api/v1/approvals.routes.ts` — Endpoints for inbox, review, approve, reject, reassign

**Key design (from Doc 039):**
```
Approval Stage Chain:
  Stage 1 (PM Review) → Stage 2 (Dept Review) → Stage 3 (Management Approval)
  
  Each stage has:
  - allowed_roles
  - required_count (sequential or parallel)
  - sla_hours
  - escalation_level_id
  - backup_approver_id
```

**Dependencies:**
- Phase 3.1 (state machines) — approval transitions affect prospect/project state
- Phase 3.3 (SLA engine) — approval stages have SLA deadlines
- Phase 2.1 (auth + RBAC) — approval actions require role verification

**Risk:** High — approval chain bugs could cause stalled workflows or skipped approval steps.

**Rollback:**
1. Admin override endpoint for any stuck approval
2. Audit trail on every approval action
3. Approval chain definition is configurable (CFG-02)

**Impact:** Core workflow engine — without this, prospects and projects cannot advance through their lifecycle.

### 3.6 Wire Frontend Pages to Real API (Complete Integration)

**Affected files:**
ALL 46 feature page files — replace `useState(INITIAL_*)` with React Query hooks

**Conversion pattern for each page:**
```typescript
// BEFORE (mock):
const [projects] = useState(INITIAL_PROJECTS);

// AFTER (real API):
const { data: projects, isLoading, error } = useProjects(filters);
```

**Specific pages and their hook dependencies:**

| Page | Current Mock | New Hook |
|------|-------------|----------|
| DashboardPage | `INITIAL_PROJECTS`, `INITIAL_APPROVALS` | `useDashboard()`, `useApprovals()` |
| ProspectsPage | `INITIAL_PROSPECTS` | `useProspects(filters)` |
| ProspectDetailPage | `INITIAL_PROSPECTS.find()` | `useProspectDetail(id)` |
| ProjectListPage | `INITIAL_PROJECTS` | `useProjects(filters)` |
| ProjectDetailPage | `INITIAL_PROJECTS.find()`, `INITIAL_TIMELINE_EVENTS` | `useProjectDetail(id)`, `useTimeline(id)` |
| ApprovalInboxPage | `INITIAL_APPROVALS` | `useApprovals(type, status)` |
| UsersPage | hardcoded | `useUsers(filters)` |
| AuditPage | hardcoded | `useAuditLogs(filters)` |
| ReportsPage | calculated from `INITIAL_PROJECTS` | `useReports(type, filters)` |
| All Master Data pages | hardcoded arrays | `useMasterData(entityType)` |
| All Config pages | hardcoded | `useConfig(section)` |
| NotificationsPage | hardcoded | `useNotifications(filters)` |
| KpiPage | hardcoded | `useKpiDashboard()` |
| ProfilePage | localStorage | `useAuthStore.user` + `useUser(id)` |

**Dependencies:** Phase 2.3 (services), Phase 2.4 (hooks), Phase 3.2 (backend endpoints)
**Risk:** High — every page's data source changes. API errors, latency, or missing endpoints will cause features to fail where they previously worked with mock data.

**Rollback:**
1. Graceful degradation — show `EmptyState` or `ErrorState` when API fails
2. Feature flag `VITE_USE_MOCK=true` falls back to mock data per page
3. Progressive rollout — convert one feature module at a time

**Impact:** The single largest transformation of the project — turns a mock prototype into a live CRM.

---

### 3.7 Add Mobile Responsiveness

**Affected files:**
- `frontend/src/components/layout/Sidebar.tsx` — Add hamburger toggle for mobile; overlay drawer pattern
- `frontend/src/components/layout/Topbar.tsx` — Add mobile menu button
- `frontend/src/components/shared/DataTable.tsx` — Add responsive card-stack pattern for `< 640px`
- `frontend/src/components/ui/Table.tsx` — Same responsive treatment
- `frontend/src/stores/uiStore.ts` — Add `isMobileMenuOpen` state
- All feature pages — Audit and fix layout breakpoints

**Responsive breakpoints (from Doc 012):**
| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, sidebar hidden (hamburger), card-stack tables |
| Tablet | 640–1024px | 2-column grids, collapsed sidebar (icons only) |
| Desktop | > 1024px | Full layout, multi-column |

**Dependencies:** None (independent UX improvement)
**Risk:** Medium — responsive changes could cause layout shifts on desktop if breakpoint classes are applied incorrectly.

**Rollback:** Remove responsive classes from affected components.
**Impact:** Mobile usability — required for field users (Cabang role).

---

## 6. Phase 4 — Extreme Risk / Major Refactor

> **Goal**: Complete the system with accessibility compliance, performance optimization, AI integration, and production readiness.
> **Risk**: Very high — cross-cutting concerns that touch every file.
> **Estimated effort**: 4–8 weeks

---

### 4.1 Implement Accessibility (WCAG 2.1 AA)

**Affected files:** ALL 118 frontend files

**Minimum requirements per component type:**
- **Buttons/links:** `aria-label`, keyboard activation (Enter/Space), focus ring
- **Inputs:** `aria-describedby` for errors, `aria-required`, `aria-invalid`
- **Modals/Drawers:** Focus trap (Tab cycle within modal), `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape to close, focus restoration on close
- **Tables:** `<caption>`, `scope="col"` on headers, `aria-sort` on sortable columns
- **Status badges:** Text labels in addition to color indicators
- **Toast notifications:** `role="alert"`, `aria-live="polite"`
- **Navigation:** Skip-to-content link (visible on focus), `aria-current="page"` on active nav
- **Forms:** Error summary above form, `aria-describedby` linking errors to inputs
- **Icons:** `aria-hidden="true"` on decorative icons, `aria-label` on informative icons
- **Keyboard navigation:** Tab order through all interactive elements, arrow keys for tabs/selects, no keyboard traps

**Testing checklist:**
- [ ] Keyboard-only navigation: Tab through every page
- [ ] Screen reader: VoiceOver/NVDA on critical flows
- [ ] Color contrast: All text ≥ 4.5:1 contrast ratio
- [ ] Zoom: 200% zoom without horizontal scroll
- [ ] `prefers-reduced-motion`: Respect user preference

**Dependencies:** All phases — accessibility changes touch all components and pages.
**Risk:** Very high — touching every file increases merge conflict risk; subtle bugs in focus management can degrade UX for all users.

**Rollback:** Component-level — each ARIA attribute can be reverted independently.
**Impact:** WCAG 2.1 AA compliance — legal requirement for government contracts.

---

### 4.2 AI Feature Integration (Frontend)

**Affected files:**
- `frontend/src/services/ai.ts` — Implement methods for all 10 AI endpoints
- `frontend/src/hooks/queries/useAi.ts` — **New file** — React Query hooks for AI features
- `frontend/src/features/dashboard/DashboardPage.tsx` — Add AI Executive Summary widget
- `frontend/src/features/prospects/ProspectDetailPage.tsx` — Add AI Prospect Analysis section
- `frontend/src/features/projects/tabs/RksTab.tsx` — Add "Ringkasan RKS AI" button
- `frontend/src/features/projects/tabs/LphsSiosTab.tsx` — Add "Ringkasan LPHS AI" button
- `frontend/src/features/kpi/KPIDashboardPage.tsx` — Add KPI Insight AI widget
- `frontend/src/components/shared/GlobalSearch.tsx` — Integrate with AI smart search

**AI Feature Mapping (from Doc 011):**

| AI Feature | Trigger | Target Page | Loading UX |
|-----------|---------|-------------|------------|
| Tender Summary | Button click | RKS tab | Skeleton text |
| RKS Summary | Button click | RKS tab | Skeleton text |
| LPHS Summary | Button click | LPHS/SIOS tab | Skeleton text |
| Prospect Analysis | Auto on page load | Prospect Detail | Skeleton card |
| Customer Insight | Auto on page load | Prospect/Customer | Skeleton card |
| Competitor Analysis | Auto on page load | Harga tab | Skeleton card |
| Meeting Summary | Button | Prospect Detail | Skeleton text |
| KPI Insight | Auto on dashboard | KPI Dashboard | Summary widget |
| Executive Dashboard | Auto on dashboard | Dashboard | Summary widget |
| Smart Search | Ctrl+K / search | Global Search | Dropdown results |

**Backend is already built** — AI service layer, Gemini adapter, prompt manager, cost controller, rate limiter are all fully implemented (10 endpoints). Only frontend integration is needed.

**Dependencies:** Phase 3.6 (frontend API integration) — AI integration follows the same service→hook→page pattern
**Risk:** Medium — AI responses are async and can fail; graceful fallback required. No breaking changes.

**Rollback:** Each AI widget is an isolated component — can be hidden via feature flag.
**Impact:** Differentiator feature — AI capabilities are a core spec requirement.

---

### 4.3 Performance Optimization

**Affected files:**
- `frontend/src/routes/router.tsx` — Review and optimize code-splitting boundaries
- All feature pages — Audit render performance (useMemo, useCallback, React.memo)
- `frontend/vite.config.ts` — Add bundle analysis plugin, code-splitting config
- `backend/src/middleware/` — Add response compression, caching headers
- `backend/prisma/schema.prisma` — Add database indexes (from Doc 055)

**Performance targets (from Doc 059):**
| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | ≤ 1.8s |
| Largest Contentful Paint (LCP) | ≤ 2.5s |
| Initial JS bundle | ≤ 250KB |
| API p95 response time | ≤ 500ms |
| Lighthouse Performance | ≥ 90 |

**Key optimization strategies:**
1. **Code splitting:** Route-level + component-level lazy loading
2. **Bundle analysis:** `vite-plugin-inspect` + manual chunk configuration
3. **Database indexes:** Cover all query patterns (Doc 055)
4. **API caching:** HTTP caching headers + React Query `staleTime`
5. **Image optimization:** Lazy loading, responsive images
6. **Tree shaking:** Remove unused imports, dead code stubs

**Dependencies:** All phases — optimization is the final polish step.
**Risk:** Medium — aggressive optimization could introduce rendering bugs or stale data.

**Rollback:** Revert individual optimization changes; perf targets are non-functional.
**Impact:** User experience — load times directly affect user satisfaction.

---

### 4.4 Testing Infrastructure

**Affected files:**
- **New:** `vitest.config.ts` — Test runner configuration
- **New:** `frontend/src/test/setup.ts` — Test environment setup
- **New:** `frontend/src/test/utils.tsx` — Custom render with providers
- **New:** ~50+ test files across all modules

**Test categories (from Doc 062):**
| Type | Count (estimate) | Coverage |
|------|:----------------:|----------|
| Unit (UI components) | 30 | All UI primitives + shared components |
| Unit (services) | 14 | All service files |
| Integration (hooks) | 11 | All query + mutation hooks (mock API) |
| Integration (pages) | 14 | All feature page smoke tests |
| E2E (critical flows) | 5 | Login → Prospect → Project → Approval |

**Dependencies:** Phase 1–4 all complete (tests validate final state)
**Risk:** Low — tests cannot break production code.
**Impact:** Quality assurance — critical for production deployment confidence.

---

### 4.5 Docker & Deployment Configuration

**Affected files:**
- `docker/docker-compose.yml` — Full compose with services: frontend, backend, MySQL, Redis, Nginx, backup
- `docker/nginx/` — Nginx reverse proxy config, static file serving, TLS
- `.env.example` — Complete environment template with all variables
- `backend/Dockerfile` — Review and optimize multi-stage build
- `frontend/Dockerfile` — Review and optimize multi-stage build
- `scripts/` — Database backup, migration, health check scripts

**Full stack services:**
```
Frontend (Vite dev server / Nginx static)
  → Backend (Express API, port 4000)
    → MySQL (port 3306)
    → Redis (port 6379)
  → Nginx (reverse proxy, port 80/443)
  → Backup container (periodic mysqldump)
```

**Environment separation (from Doc 060):**
| Env | Purpose | Key Differences |
|-----|---------|-----------------|
| `local` | Developer machine | Hot reload, mock data, verbose logging |
| `dev` | Shared dev server | Real API, dev database, debug mode |
| `staging` | Pre-production | Production-like data, all features enabled |
| `production` | Live system | Minimal logging, no debug, TLS, backups |

**Dependencies:** All previous phases — deployment is the final step.
**Risk:** Medium — misconfigured environment variables could expose secrets or misroute traffic.

**Rollback:** Previous deployment remains live; rollback via Docker image tag.
**Impact:** Production readiness — enables actual deployment and user access.

---

## 7. Dependency Graph

```
Phase 1 (Foundation)              Phase 2 (Structural)            Phase 3 (Business Logic)          Phase 4 (Production)
═══════════════════              ═══════════════════            ═══════════════════════           ═══════════════════════

1.1 Fix CSS/Styling ──────────  2.1 Auth (BE + FE) ──────────  3.1 State Machines ──────────     4.1 Accessibility ──────────
        │                               │                              │                                │
1.2 Fix JSX Typos                     │                              │                                │
        │                               │                              │                                │
1.3 Add Missing Routes ───────────     │                              │                                │
        │                               │                              │                                │
1.4 Add Loading States ───────────     │                              │                                │
        │                               │                              │                                │
1.5 Add Empty States ────────────      │                              │                                │
        │                               ├── 2.2 Prisma Schema ────────┤                                │
1.6 UI Labels → ID ──────────────      │         │                    │                                │
        │                               │         │                    │                                │
1.7 Error Boundaries ───────────       │         │                    ├── 3.2 Business APIs ───────────┤
                                       │         │                    │         │                      │
                                       │ 2.3 FE Services ────────────┤         │                      │
                                       │         │                    │         │                      │
                                       │ 2.4 React Query Hooks ──────┤         │                      │
                                       │         │                    │         ├── 4.3 Performance ───┤
                                       │ 2.5 Refactor Monoliths ─────┤         │                      │
                                       │         │                    │         │                      │
                                       │ 2.6 Role-Based Nav ─────────┤         │                      │
                                                                │     │         │                      │
                                                                │ 3.3 SLA Engine ──────────────────┤  │
                                                                │         │                          │  │
                                                                │ 3.4 KPI Module ───────────────────┤  │
                                                                │         │                          │  │
                                                                │ 3.5 Approval Engine ──────────────┤  │
                                                                │         │                          │  │
                                                                │ 3.6 Wire FE to Real API ──────────┤  │
                                                                │         │                          │  │
                                                                │ 3.7 Mobile Responsive ────────────┤  │
                                                                                                     │  │
                                                                        4.2 AI Integration ──────────┤  │
                                                                                                     │  │
                                                                        4.4 Testing ──────────────────┤  │
                                                                                                     │  │
                                                                        4.5 Docker/Deploy ────────────┤  │
                                                                                                        │
                                                                                                        ▼
                                                                                                  PRODUCTION
```

**Critical path:** Phase 1 → 2.1 (Auth) → 2.2 (Prisma) → 2.3/2.4 (Services/Hooks) → 3.2 (Business APIs) → 3.6 (Wire FE) → All others

---

## 8. Rollback Strategy

### Per-Phase Rollback Plan

| Phase | Rollback Procedure | Complexity | Data Risk |
|-------|-------------------|:----------:|:---------:|
| **1.1–1.7** | Revert individual file changes via git | Low | None |
| **2.1 Auth** | Stub guards back to pass-through; restore mock login | Medium | None |
| **2.2 Prisma** | `git checkout -- prisma/schema.prisma`; reset DB | Medium | High if data exists |
| **2.3 Services** | Add `VITE_USE_MOCK=true` env; services return mock fallback | Low | None |
| **2.4 Hooks** | Keep mock data import in pages; feature flag to toggle | Low | None |
| **2.5 Monoliths** | Keep original files as `.legacy.tsx`; revert import paths | Medium | None |
| **2.6 RBAC** | Revert to flat `nav-items`; remove role checks | Low | None |
| **3.1 State Machines** | Remove state machine calls from endpoints; status changes become free-form | High | Medium — misapplied transitions |
| **3.2 APIs** | Comment out new routes in `app.ts`; keep old mocks | Medium | None |
| **3.3 SLA** | Disable SLA engine config toggle | Low | None |
| **3.4 KPI** | Comment out KPI routes; keep frontend mock path | Low | None |
| **3.5 Approval** | Revert to single-level approve/reject | Medium | None |
| **3.6 Wire FE** | Set `VITE_USE_MOCK=true` globally | Low | None |
| **3.7 Responsive** | Remove responsive class additions | Low | None |
| **4.1 Accessibility** | Revert ARIA attribute changes per component | High | None |
| **4.2 AI** | Hide AI widget components behind feature flag | Low | None |
| **4.3 Performance** | Revert individual optimization changes | Medium | None |
| **4.4 Testing** | No rollback needed (tests don't affect prod) | N/A | None |
| **4.5 Docker** | Redeploy previous Docker image tag | Medium | None |

### General Rollback Principles

1. **Feature flags everywhere** — Every major feature should have a `VITE_FEATURE_*` or `FEATURE_*` flag
2. **Mock data lives forever** — Never delete `mock-data.ts`; it's the fallback forever
3. **Small commits** — Each task is a separate commit with clear `git revert` instructions
4. **Database migrations are reversible** — Always test `prisma migrate down` before deploying up
5. **Staged rollout** — Deploy to staging first; validate for 24h before production
6. **Audit trail** — Every state transition and data mutation is logged for forensic rollback

---

## 9. Risk Register

| # | Risk | Phase | Probability | Impact | Mitigation |
|---|------|-------|:-----------:|:------:|------------|
| R1 | **Database migration failure** — MySQL connection issues, schema conflicts | 2.2 | Medium | Critical | Test migration on local MySQL first; have DDL export as SQL fallback |
| R2 | **Auth bugs lock out all users** — Token validation fails, role mapping wrong | 2.1 | Low | Critical | Admin backdoor endpoint; mock auth fallback with env flag |
| R3 | **State machine data corruption** — Invalid transition applied due to race condition | 3.1 | Low | High | Optimistic locking (`updated_at` check); audit log for manual repair |
| R4 | **API endpoint exposes unauthorized data** — Missing RBAC check or scope filter | 3.2 | Medium | Critical | RBAC middleware is centralized; add automated permission tests |
| R5 | **SLA miscalculation** — Incorrect working-day logic causes wrong deadlines | 3.3 | Medium | High | Manual deadline override for admin; comprehensive holiday config |
| R6 | **Monolith refactor introduces regression** — Shared state not extracted properly | 2.5 | Medium | High | Keep original file as `.legacy.tsx` for 2 sprints; compare behavior |
| R7 | **Frontend API integration breaks existing pages** — Hook errors, missing endpoints | 3.6 | High | High | Mock data fallback per page; progressive rollout per feature module |
| R8 | **Accessibility changes introduce UX regressions** — Focus trap too aggressive, ARIA misconfigured | 4.1 | Medium | Medium | QA on critical flows before deployment; user acceptance testing |
| R9 | **AI integration costs exceed budget** — Uncontrolled API usage | 4.2 | Low | Medium | AI cost controller (already implemented); rate limiter; daily budget cap |
| R10 | **Performance optimization causes stale data** — Over-aggressive caching | 4.3 | Low | Medium | Cache invalidation on mutation; `staleTime` < `gcTime` |
| R11 | **Docker deployment exposes secrets** — .env in Dockerfile or committed to repo | 4.5 | Low | Critical | `.dockerignore` for `.env*`; secrets from CI/CD vault; container scanning |
| R12 | **Project scope creep** — Each phase uncovers additional missing features | All | High | High | Strict scope per phase; defer non-critical items to "Future Enhancement" backlog |

---

## Summary: Implementation Order

```
[Week 1-2]   Phase 1 — Low Risk
             ├── 1.1 Fix CSS & Styling Inconsistencies
             ├── 1.2 Fix JSX Typos (class= → className)
             ├── 1.3 Add Missing Route Entries
             ├── 1.4 Add Loading States to DataTable
             ├── 1.5 Add Basic Empty States
             ├── 1.6 Update UI Labels to Bahasa Indonesia
             └── 1.7 Add Error Boundaries

[Week 3-6]   Phase 2 — Medium Risk
             ├── 2.1 Implement Real Authentication (BE + FE)        ← GATE
             ├── 2.2 Implement Prisma Full Schema (61 entities)     ← GATE
             ├── 2.3 Implement API Service Layer (FE)
             ├── 2.4 Implement React Query Hooks
             ├── 2.5 Refactor Monolithic Pages (3→sub-components)
             └── 2.6 Implement Role-Based Navigation & Guards

[Week 7-12]  Phase 3 — High Risk
             ├── 3.1 Implement State Machines (6 machines)
             ├── 3.2 Implement All Business API Endpoints (~200)
             ├── 3.3 Implement SLA Engine & Escalation
             ├── 3.4 Implement KPI / Target Module
             ├── 3.5 Implement Approval Engine (Multi-Level)
             ├── 3.6 Wire Frontend Pages to Real API (complete)
             └── 3.7 Add Mobile Responsiveness

[Week 13-20] Phase 4 — Extreme Risk / Major Refactor
             ├── 4.1 Implement Accessibility (WCAG 2.1 AA)
             ├── 4.2 AI Feature Integration (Frontend)
             ├── 4.3 Performance Optimization
             ├── 4.4 Testing Infrastructure
             └── 4.5 Docker & Deployment Configuration

Total estimated effort: 20 weeks (5 months) for full implementation
```

---

*This plan references the 65 specification documents in `md Kinetic CRM/` and the current codebase state as of June 2026.*
