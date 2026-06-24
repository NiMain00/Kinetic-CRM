# Implementation Plan — Kinetic CRM

> Actionable breakdown of what needs to be done, ordered by dependency and priority.
> Generated from full codebase audit vs 65 specification documents.

---

## Current State Summary

| Layer | Done | Remaining | Blocker? |
|-------|------|-----------|----------|
| Prisma Schema | 90% | Relations fine-tuning | No |
| Seed Data | 70% | Project/KPI data | No |
| Backend Routes | 33% | 12 stubs → real impl | Yes |
| Backend Services | 20% | 10+ services missing | Yes |
| Backend Repositories | 15% | 10+ repos missing | Yes |
| Frontend Pages | 95% UI | 38 pages on mock data | Yes |
| Frontend Hooks/Stores | 80% | Built but unused | Yes |
| State Machines | 0% | All 6 planned | Yes (Sprint 3+) |
| Shared Library | 5% | Empty shell | Yes |
| Infrastructure | 85% | Minor fixes | No |
| Testing | 0% | Everything | No |

---

## Phase 1 — Foundation Fixes (Days 1-3)

> Goal: Clean up structural issues before building features.

### 1.1 Remove Root/Frontend Config Duplication

The root `package.json`, `vite.config.ts`, and `tsconfig.json` duplicate the `frontend/` versions. This causes confusion and potential conflicts.

- [ ] Delete root `package.json` (keep `frontend/package.json` as source of truth)
- [ ] Delete root `vite.config.ts` (keep `frontend/vite.config.ts`)
- [ ] Merge root `tsconfig.json` into `frontend/tsconfig.json` if any settings differ
- [ ] Update root `package.json` scripts to delegate to `frontend/` and `backend/`
- [ ] Verify `npm run dev` still works from root

### 1.2 Fix CI/CD Pipeline

- [ ] Remove corrupted YAML artifact in `.github/workflows/deploy.yml` (trailing `</write_to_file>` tag)
- [ ] Add lint step to `test` job
- [ ] Add actual test runner (even just `echo "no tests yet"` until Vitest is set up)

### 1.3 Fix Backup Script

- [ ] Clean AI agent output artifacts from `scripts/backup-db.sh`

### 1.4 Shared Library Bootstrap

- [ ] Create `shared/src/types/` — move shared domain types from `frontend/src/types/`
- [ ] Create `shared/src/utils/` — extract reusable formatters, validators
- [ ] Create `shared/src/constants.ts` — shared status enums, permission keys
- [ ] Update `shared/src/index.ts` to export all shared code
- [ ] Update `frontend/tsconfig.json` path alias to reference `shared/`

---

## Phase 2 — Backend Core Services (Days 4-10)

> Goal: Implement all missing backend services and wire routes.

### 2.1 Project Service (Critical Path)

Depends on: Prisma schema (done), auth middleware (done)

- [ ] Create `backend/src/repositories/project.repository.ts`
- [ ] Create `backend/src/services/project.service.ts`
  - `list()` — paginated, filterable by status/branch/category/period
  - `get()` — with timeline events, project code generation
  - `create()` — auto project_code, initial status = "created"
  - `update()` — with optimistic locking (check `updated_at`)
  - `delete()` — soft delete only
- [ ] Create `backend/src/validators/project.schema.ts`
- [ ] Implement `backend/src/api/v1/projects.routes.ts` — replace 501 stubs
- [ ] Wire `ProjectService` into `app.ts` dependency injection

### 2.2 RKS Service

Depends on: Project Service

- [ ] Create `backend/src/repositories/rks.repository.ts`
- [ ] Create `backend/src/services/rks.service.ts`
  - `getByProject()` — with review questions and notes
  - `create()` — linked to project
  - `update()` — only if status allows
  - `submit()` — state transition: draft → submitted
  - `approve()` — with RBAC check (PM only)
  - `reject()` — with revision notes
- [ ] Implement `backend/src/api/v1/rks.routes.ts`

### 2.3 LPHS/SIOS Service

Depends on: Project Service, RKS Service, Approval Engine

- [ ] Create `backend/src/repositories/lphs.repository.ts`
- [ ] Create `backend/src/services/lphs.service.ts`
  - `getByProject()` — with department reviews and targeted revisions
  - `create()` — linked to project
  - `submit()` — triggers department review assignments
  - `departmentApprove()` — per-department approval
  - `departmentReject()` — triggers targeted revision
  - `pmApprove()` — PM final approval
- [ ] Implement `backend/src/api/v1/lphs-sios.routes.ts`

### 2.4 Approval Engine Service

Depends on: State Machine (Phase 4), but basic version can start now

- [ ] Create `backend/src/services/approval.service.ts`
  - `createRequest()` — create approval request for a resource
  - `list()` — filterable by status, resource type
  - `get()` — with reassignment history
  - `approve()` — with SLA tracking
  - `reject()` — with rejection notes
  - `reassign()` — backup approver delegation
- [ ] Create `backend/src/services/sla-engine.service.ts`
  - `calculateDeadline()` — based on working days (uses Holiday master)
  - `checkEscalation()` — called by scheduler
  - `sendReminder()` — triggers notification
- [ ] Create `backend/src/services/escalation.service.ts`
- [ ] Implement `backend/src/api/v1/approvals.routes.ts`

### 2.5 Notification Service

Depends on: Approval Engine (triggers notifications)

- [ ] Create `backend/src/repositories/notification.repository.ts`
- [ ] Create `backend/src/services/notification.service.ts`
  - `send()` — from template, with variable substitution
  - `list()` — paginated, filterable by read/unread
  - `markRead()` / `markAllRead()`
  - `getUnreadCount()` — for bell badge
- [ ] Implement `backend/src/api/v1/notifications.routes.ts`

### 2.6 Document Service

Depends on: Storage config (done)

- [ ] Create `backend/src/services/document.service.ts`
  - `upload()` — to `STORAGE_ROOT`, create DB record
  - `getByProject()` — list documents for a project
  - `getVersions()` — version chain (is_latest flag)
  - `delete()` — soft delete
- [ ] Create file upload middleware (multer or similar)
- [ ] Implement `backend/src/api/v1/documents.routes.ts`

### 2.7 Dashboard Service

Depends on: All other services (aggregates data)

- [ ] Create `backend/src/services/dashboard.service.ts`
  - `getSummary()` — counts by status, by branch, by category
  - `getPendingApprovals()` — user's pending approval inbox
  - `getApproachingDeadline()` — projects nearing deadline
  - Role-based filtering (PM sees own, Management sees all)
- [ ] Implement `backend/src/api/v1/dashboard.routes.ts`

### 2.8 Report Service

Depends on: Project Service, KPI data

- [ ] Create `backend/src/services/report.service.ts`
  - `getWinLoss()` — aggregated win/loss by period, category, competitor
  - `getPipeline()` — funnel stages
  - `getProgressVsTarget()` — KPI actual vs target
  - `exportExcel()` / `exportPdf()` — export functionality
- [ ] Implement `backend/src/api/v1/reports.routes.ts`

### 2.9 Audit Service

Depends on: AuditLog model (done)

- [ ] Create `backend/src/services/audit.service.ts`
  - `log()` — called by other services on CRUD operations
  - `list()` — filterable by user, action, date range
  - `exportCsv()` — for compliance
- [ ] Implement `backend/src/api/v1/audit.routes.ts`

### 2.10 Config Service

Depends on: All master data models (done)

- [ ] Create `backend/src/services/config.service.ts`
  - CRUD for: organization, workflow, SLA, notification templates, question types, upload policies, integrations, roles/permissions
- [ ] Implement `backend/src/api/v1/config.routes.ts`

### 2.11 Expand Master Data Routes

- [ ] Add endpoints for: competitors, positions, question types, document types, loss reasons, approval levels, periods, holidays, roles, departments, divisions

### 2.12 Implement Scheduler Jobs

- [ ] `backend/src/scheduler.ts` — replace empty `runTasks()`:
  - SLA deadline checking (every 15 min)
  - Notification dispatch (every 5 min)
  - Session cleanup (daily)
  - KPI snapshot (daily)

---

## Phase 3 — Frontend API Wiring (Days 8-15)

> Goal: Replace all mock data with real API calls. Can overlap with Phase 2.

### 3.1 Wire Core Pages First

These pages already have React Query hooks ready — just need to swap data sources:

- [ ] **DashboardPage** — replace `INITIAL_APPROVALS` with `useDashboard()` hook
- [ ] **ProjectListPage** — replace `INITIAL_PROJECTS` with `useProjects()` hook
- [ ] **ProjectFormPage** — replace mock with `useProjectMutations()`
- [ ] **ProjectDetailPage** — replace mock with `useProject()` + tab hooks
- [ ] **ApprovalInboxPage** — replace `INITIAL_APPROVALS` with `useApprovals()` hook
- [ ] **ApprovalReviewDrawer** — wire to `useApprovalMutations()`

### 3.2 Wire Remaining Pages

- [ ] **All Config Pages (12)** — replace local state with `useConfig()` hook
- [ ] **All Master Data Pages (9)** — wire to expanded master data API
- [ ] **All Report Pages (5)** — wire to `reportService`
- [ ] **All KPI Pages (3)** — wire to KPI endpoints
- [ ] **Audit Pages (2)** — wire to audit endpoints
- [ ] **Notifications Page** — wire to `useNotifications()` hook
- [ ] **Profile Page** — wire to user service

### 3.3 Wire User Management Pages

- [ ] **UserListPage** — replace local `ALL_USERS` with `useUsers()` hook
- [ ] **UserFormPage** — wire to `useUserMutations()`
- [ ] **UserDetailPage** — wire to `useUser()` hook

### 3.4 Remove Mock Data

- [ ] Delete `frontend/src/services/mock-data.ts` after all pages are wired
- [ ] Remove all inline hardcoded arrays from page components
- [ ] Verify no page imports from mock sources

### 3.5 Add Proper UX States

For every wired page:

- [ ] Add `isLoading` → `PageSkeleton` during fetch
- [ ] Add `isEmpty` → `EmptyState` with icon + message + CTA
- [ ] Add `isError` → `ErrorBoundary` or inline error with retry button
- [ ] Ensure consistent use of shared components

---

## Phase 4 — State Machines (Days 12-18)

> Goal: Implement the 6 state machines per Doc 013.

### 4.1 Generic State Machine Engine

- [ ] Create `shared/src/state-machine.ts`
  - Generic `StateMachine<S, E>` class
  - `transition(currentState, event)` → `{ nextState, effects }`
  - `canTransition(currentState, event)` → boolean
  - Configurable guards and side effects

### 4.2 Implement Each State Machine

**Prospect State Machine** (Doc 013 + Doc 032):
- [ ] States: `prospect_sdr`, `prospect_field`, `prospect_decision`, `won`, `lost`
- [ ] Events: `submit_sdr`, `submit_field`, `decide_won`, `decide_lost`, `revise`, `cancel`
- [ ] Guards: role-based (SDR can only submit from SDR state, etc.)

**Project State Machine** (Doc 013 + Doc 033):
- [ ] States: `created`, `active`, `in_review`, `completed`, `cancelled`
- [ ] Events: `activate`, `submit_review`, `approve`, `complete`, `cancel`
- [ ] Guards: only PM/Admin can cancel; only after certain stages

**Approval State Machine** (Doc 013 + Doc 039):
- [ ] States: `pending`, `in_review`, `approved`, `rejected`, `revision`
- [ ] Events: `start_review`, `approve`, `reject`, `request_revision`, `resubmit`
- [ ] Guards: only assigned approver can act

**Document State Machine** (Doc 013 + Doc 048/049):
- [ ] States: `draft`, `review`, `final`, `obsolete`
- [ ] Events: `submit_review`, `approve`, `obsolete`, `upload_new_version`
- [ ] Guards: only uploader can submit; only PM can approve

**User State Machine** (Doc 013 + Doc 018):
- [ ] States: `active`, `inactive`, `suspended`, `terminated`
- [ ] Events: `activate`, `deactivate`, `suspend`, `terminate`
- [ ] Guards: only Admin can suspend/terminate

### 4.3 Integrate State Machines into Backend

- [ ] Import state machine into each service
- [ ] Add transition validation before every status change
- [ ] Add audit log entry for every state transition
- [ ] Add notification trigger on relevant transitions

---

## Phase 5 — Refactor Monoliths (Days 15-20)

> Goal: Break down large components into manageable pieces.

### 5.1 MasterDataPage Refactor (~153KB)

- [ ] Extract `MasterCustomerSection` → `master-data/MasterCustomerPage.tsx`
- [ ] Extract `MasterCompetitorSection` → `master-data/MasterCompetitorPage.tsx`
- [ ] Extract `MasterQuestionSection` → `master-data/MasterQuestionPage.tsx`
- [ ] Extract `MasterCategorySection` → `master-data/MasterCategoryPage.tsx`
- [ ] Extract `MasterDocTypeSection` → `master-data/MasterDocTypePage.tsx`
- [ ] Extract `MasterHolidaySection` → `master-data/MasterHolidayPage.tsx`
- [ ] Extract `MasterLossReasonSection` → `master-data/MasterLossReasonPage.tsx`
- [ ] Extract `MasterPeriodSection` → `master-data/MasterPeriodPage.tsx`
- [ ] Create `MasterDataLayout` wrapper with sidebar navigation
- [ ] Update routing in `router.tsx`

### 5.2 ProjectDetailPage Refactor (~106KB)

Already has tab stubs — need to extract:

- [ ] Extract `OverviewTab` content → `projects/tabs/OverviewTab.tsx`
- [ ] Extract `RksTab` content → `projects/tabs/RksTab.tsx`
- [ ] Extract `LphsSiosTab` content → `projects/tabs/LphsSiosTab.tsx`
- [ ] Extract `HargaTab` content → `projects/tabs/HargaTab.tsx`
- [ ] Extract `DokumenTab` content → `projects/tabs/DokumenTab.tsx`
- [ ] Extract `DeliveryTab` content → `projects/tabs/DeliveryTab.tsx`
- [ ] Extract `PemenangTab` content → `projects/tabs/PemenangTab.tsx`
- [ ] Extract `TimelineTab` content → `projects/tabs/TimelineTab.tsx`
- [ ] Slim down `ProjectDetailPage.tsx` to just tab shell + routing

### 5.3 ReportsPage Refactor (~57KB)

- [ ] Extract report cards → `reports/ReportsIndexPage.tsx`
- [ ] Ensure `WinLossReportPage` uses API not local data
- [ ] Ensure `PipelineReportPage` uses API not local data
- [ ] Ensure `KPIDashboardPage` uses API not local data
- [ ] Slim down parent `ReportsPage.tsx`

---

## Phase 6 — Adoption of react-hook-form (Days 18-22)

> Goal: Replace manual form state with react-hook-form + zod validation.

Already installed but unused. Forms to migrate:

- [ ] `LoginPage` — login form
- [ ] `ProspectFormPage` — prospect create/edit
- [ ] `ProjectFormPage` — project create/edit
- [ ] `UserFormPage` — user create/edit
- [ ] All Config Pages — form-based configuration
- [ ] All Master Data Pages — CRUD forms

For each form:
- [ ] Define Zod schema in `validators/*.schema.ts`
- [ ] Replace `useState` + `onChange` with `useForm()` + `register()`
- [ ] Add proper validation messages
- [ ] Add loading states on submit buttons

---

## Phase 7 — Testing Infrastructure (Days 20-25)

> Goal: Set up testing framework and write critical path tests.

### 7.1 Setup

- [ ] Install Vitest + React Testing Library in `frontend/`
- [ ] Install Vitest + Supertest in `backend/`
- [ ] Install MSW (Mock Service Worker) for API mocking
- [ ] Install Playwright for E2E tests
- [ ] Add test scripts to `package.json` files
- [ ] Add test coverage thresholds

### 7.2 Backend Tests

- [ ] Unit tests: auth service (login, logout, token refresh)
- [ ] Unit tests: user service (CRUD, password validation)
- [ ] Unit tests: prospect service (CRUD, state transitions)
- [ ] Integration tests: auth endpoints (login → token → authenticated request)
- [ ] Integration tests: RBAC middleware (permission denied scenarios)

### 7.3 Frontend Tests

- [ ] Component tests: Login form validation
- [ ] Component tests: Prospect list rendering
- [ ] Component tests: Project detail tabs
- [ ] Hook tests: useAuthMutations, useProspectMutations
- [ ] Hook tests: useProjects, useApprovals

### 7.4 E2E Tests

- [ ] Login flow → Dashboard
- [ ] Create Prospect → Submit → Approve
- [ ] Create Project → RKS → LPHS → Approval
- [ ] Error handling (403, 404, 500 pages)

---

## Phase 8 — Polish & Go-Live Prep (Days 25-30)

> Goal: Production readiness.

### 8.1 Mobile Responsiveness

- [ ] Hamburger menu for sidebar on mobile
- [ ] Responsive DataTable (card view on mobile)
- [ ] Touch-friendly targets (min 44px)
- [ ] Bottom navigation for mobile

### 8.2 Accessibility

- [ ] ARIA labels on all form controls
- [ ] Keyboard navigation for DataTable, Modal, Drawer
- [ ] Focus management on route changes
- [ ] Screen reader support for status badges
- [ ] Color contrast compliance (WCAG AA)

### 8.3 Performance

- [ ] Code splitting per page (verify lazy loading)
- [ ] Bundle analysis with `vite-plugin-visualizer`
- [ ] Image optimization
- [ ] Memoization for heavy components (DataTable, FilterPanel)
- [ ] Virtual scrolling for large lists

### 8.4 Security Hardening

- [ ] OWASP Top 10 audit
- [ ] Rate limiting on login endpoint
- [ ] Input sanitization
- [ ] SQL injection testing
- [ ] XSS testing

### 8.5 Documentation

- [ ] API documentation (Postman collection)
- [ ] Deployment guide
- [ ] User manual basics

---

## Dependency Graph

```
Phase 1 (Foundation Fixes)  ← START HERE
    │
    ▼
Phase 2 (Backend Services)  ← CRITICAL PATH
    │
    ├──► Phase 3 (Frontend Wiring)  ← CAN PARALLEL WITH Phase 2
    │
    ▼
Phase 4 (State Machines)  ← DEPENDS ON Phase 2
    │
    ▼
Phase 5 (Refactor Monoliths)  ← DEPENDS ON Phase 3
    │
    ▼
Phase 6 (react-hook-form)  ← DEPENDS ON Phase 3
    │
    ▼
Phase 7 (Testing)  ← DEPENDS ON Phases 2-6
    │
    ▼
Phase 8 (Polish & Go-Live)  ← FINAL
```

---

## Estimated Timeline

| Phase | Days | Dependencies |
|-------|------|-------------|
| Phase 1 — Foundation Fixes | 1-3 | None |
| Phase 2 — Backend Services | 4-10 | Phase 1 |
| Phase 3 — Frontend Wiring | 8-15 | Phase 1, partial Phase 2 |
| Phase 4 — State Machines | 12-18 | Phase 2 |
| Phase 5 — Refactor Monoliths | 15-20 | Phase 3 |
| Phase 6 — react-hook-form | 18-22 | Phase 3 |
| Phase 7 — Testing | 20-25 | Phases 2-6 |
| Phase 8 — Polish & Go-Live | 25-30 | All phases |

**Total: ~30 working days (~6 weeks)** with a focused developer.

---

## Quick Wins (Do First for Maximum Impact)

These items unblock the most downstream work:

1. **Wire Projects route** — unblocks Project pages, RKS, LPHS, Approvals
2. **Wire Dashboard to real API** — validates aggregation logic
3. **Remove mock-data.ts dependency** — forces all pages to use real APIs
4. **Expand Master Data routes** — unblocks all config/master-data pages
5. **Implement Scheduler** — unblocks SLA, notifications, deadline features

---

## Files to Create (Backend)

```
backend/src/
├── repositories/
│   ├── project.repository.ts
│   ├── rks.repository.ts
│   ├── lphs.repository.ts
│   ├── approval.repository.ts
│   ├── notification.repository.ts
│   ├── document.repository.ts
│   ├── audit.repository.ts
│   └── config.repository.ts
├── services/
│   ├── project.service.ts
│   ├── rks.service.ts
│   ├── lphs.service.ts
│   ├── approval.service.ts
│   ├── sla-engine.service.ts
│   ├── escalation.service.ts
│   ├── notification.service.ts
│   ├── document.service.ts
│   ├── dashboard.service.ts
│   ├── report.service.ts
│   ├── audit.service.ts
│   └── config.service.ts
├── validators/
│   ├── project.schema.ts
│   ├── rks.schema.ts
│   ├── lphs.schema.ts
│   ├── approval.schema.ts
│   ├── notification.schema.ts
│   ├── document.schema.ts
│   └── config.schema.ts
└── middleware/
    └── upload.middleware.ts
```

## Files to Create (Shared)

```
shared/src/
├── index.ts
├── state-machine.ts
├── types/
│   ├── index.ts
│   ├── domain.ts
│   └── api.ts
├── utils/
│   ├── index.ts
│   ├── formatter.ts
│   └── validator.ts
└── constants/
    ├── index.ts
    ├── statuses.ts
    └── permissions.ts
```

## Files to Create (Testing)

```
backend/src/__tests__/
├── auth.service.test.ts
├── user.service.test.ts
├── prospect.service.test.ts
└── integration/
    ├── auth.test.ts
    └── rbac.test.ts

frontend/src/__tests__/
├── components/
│   ├── LoginPage.test.tsx
│   └── ProspectList.test.tsx
├── hooks/
│   ├── useAuthMutations.test.ts
│   └── useProjects.test.ts
└── e2e/
    ├── login.spec.ts
    └── prospect-flow.spec.ts
```
