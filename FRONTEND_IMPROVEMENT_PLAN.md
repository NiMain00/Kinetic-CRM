# Frontend Improvement Plan — Kinetic CRM

> Comprehensive plan to transform the current frontend prototype into a complete, consistent, maintainable, and professional CRM interface aligned with all MD documentation requirements.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis](#2-gap-analysis)
3. [Frontend Architecture Review](#3-frontend-architecture-review)
4. [UI/UX Improvement Plan](#4-uiux-improvement-plan)
5. [Design System Recommendations](#5-design-system-recommendations)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Prioritized Task List](#7-prioritized-task-list)
8. [Final Recommendation](#8-final-recommendation)
9. [Appendix: Screen Inventory Against Documentation](#9-appendix-screen-inventory-against-documentation)

---

## 1. Current State Analysis

### 1.1 Project Overview

The Kinetic CRM frontend exists at `C:\Users\lenovo\Downloads\kinetic-crm (5)\src` with a parallel target architecture at `C:\Users\lenovo\Downloads\kinetic-crm (5)\frontend\src`. The active project (`src/`) is a **feature-complete UI prototype** with 15+ implemented pages, while the `frontend/` directory contains a **planned refactored architecture** with the correct dependency stack (`zustand`, `react-query`, `react-hook-form`, `zod`, `axios`).

### 1.2 Strengths

| Strength | Detail |
|----------|--------|
| Feature-complete prototype | All 15+ pages implement realistic CRM workflows: prospect-to-project lifecycle, approvals, KPI monitoring, audit trails, config management, reporting |
| Well-structured CSS theme | Tailwind v4 with 60+ custom design tokens in Material Design 3 naming convention (`--color-primary`, `--color-surface-container-low`) |
| Good UX in key flows | Login with validation, Prospect form with dynamic questionnaire, Project Detail with 10-tab system, Review Drawer for approvals |
| Complex pages exist | `ProjectDetailPage` (~1500 lines) and `MasterDataPage` (~1500 lines) demonstrate the full CRM workflow domain model |
| Proper layout structure | Working Sidebar (collapsible, 240px/64px) + Topbar (64px fixed) + Main Content layout |

### 1.3 Weaknesses

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | No reusable component library | Every page manually writes `<input>`, `<button>`, `<table>` with full Tailwind classes — ~50+ repetitions | Critical |
| 2 | Monolithic components | `ProjectDetailPage` (~1500 lines), `MasterDataPage` (~1500 lines), `ReportsPage` (~1000 lines) in single files | High |
| 3 | No state management library | Raw `useState` + prop drilling. `triggerNotification` passed through 5+ layers. `useAuthStore`, `useUIStore`, `useNotificationStore` exist but are dead code — never imported | Critical |
| 4 | No real API integration | All data is static `useState(INITIAL_*)` from `services/mock-data.ts`. No `axios`, no React Query, no fetch | Critical |
| 5 | No form library | Manual `if (!formName) onShowNotification(...)` validation. No `react-hook-form`, no `zod` | High |
| 6 | No route guards | `ProtectedRoute`/`GuestRoute` in `routes/guards.tsx` are empty pass-through wrappers (`<>{children}</>`) | Critical |
| 7 | No backend authentication | Login is entirely client-side with hardcoded dummy accounts stored in localStorage | Critical |
| 8 | Stub project list page | `/projects` is an inline `<Route>` in `App.tsx` (lines 243-278) — 4 hardcoded cards, not a proper page component | High |
| 9 | Missing CSS definitions | `animate-fade-in`, `animate-slide-in`, `custom-scrollbar` used but never defined | Medium |
| 10 | JSX typos | `class=` instead of `className` in `ApprovalInboxPage.tsx` lines 108-110, 122, 138 | Medium |
| 11 | No charts library | Charts are hand-drawn CSS/SVG. No Recharts, nivo, or Chart.js | Medium |
| 12 | No loading/empty/error states | Pages assume data is immediately available. No `isLoading`, `isError`, `isEmpty` patterns | High |
| 13 | No real export | All "Export PDF/Excel" buttons show toast notifications but do nothing | Medium |
| 14 | No pagination | Pagination buttons show "1 of 1" with disabled Prev/Next | High |
| 15 | No mobile responsiveness | Sidebar is `fixed h-screen` with no hamburger menu. Minimal breakpoint usage | High |
| 16 | No accessibility | Missing `aria-*` attributes, keyboard navigation, focus management, screen reader support | High |

### 1.4 Inconsistencies Against MD Documentation

| Doc Requirement | Current Implementation | Gap |
|----------------|----------------------|-----|
| Role-based sidebar (012 §8.1) | Single flat `navItems` array — no role filtering | All nav items visible to all users |
| Route guard enforcement (012 §6) | Stub guards — no auth or role checks | Any user can navigate to any route |
| Breadcrumb system (012 §5.1) | No breadcrumb component | Breadcrumbs hand-built inline inconsistently |
| DataTable with server-side pagination (014) | Hand-built `<table>` with `disabled` pagination | No sorting, filtering, or server-side pagination |
| 33 main screens + 10 tabs (014) | Most exist but no Project List, no dedicated KPI pages | Missing ~8 screens |
| State machine lifecycle (013) | Status filters use hardcoded values | No centralized state machine |
| Filter granular (050 §5) | No filter components for Management/Admin | Dashboard has no drill-down filters |
| AI Executive Summary (050 §6) | Not implemented | No AI widget at all |
| Form with RHF + Zod (058 §10) | Manual validation with `if` statements | No form library at all |
| Lazy loading per route (058 §3.1) | All pages eagerly imported in `App.tsx` | No code splitting |
| Accessibility-first (058 §3.5) | Basic semantic HTML only | No ARIA labels, keyboard nav, role attributes |

---

## 2. Gap Analysis

### 2.1 Missing Features (Not Implemented at All)

| Feature | Doc Reference | Priority | Rationale |
|---------|--------------|----------|-----------|
| User Management (dedicated page, CRUD) | 018 | Critical | Admin cannot manage users — fundamental admin capability |
| Role & Permission Configuration (CFG-04) | 017 | Critical | Permission matrix editor — required for RBAC |
| KPI Dashboard (dedicated page) | 043, 044, 045 | High | GAP-01: Critical gap — no performance monitoring |
| Target Setting | 044 | High | Part of GAP-01 — need to set KPI targets |
| Progress Monitoring & Scoring | 045 | High | Part of GAP-01 — real-time progress vs target |
| Project List Page (proper page) | PROJ-01, 033 | High | Main navigation target for all roles |
| Project Cancellation | 038 | Medium | GAP-04: No "zombie" project cleanup |
| SLA Configuration (CFG-05) | 029, 041 | Medium | GAP-06: No SLA enforcement |
| Document Versioning | 049 | Medium | GAP-14: Reviewer may see outdated docs |
| Document Preview | 048 | Medium | Need inline preview for PDF/images |
| Configuration pages (CFG-02,06,07,08,09,10,12,13,14) | 027-031 | Medium | 14 config areas defined, only 4 implemented |
| Master Data pages (categories, doc-types, loss-reasons, periods, holidays, positions) | 021-026 | Medium | 7 master data types, only 3 implemented |
| AI Executive Summary Widget | 050 §6, 011 | Low | Dashboard enhancement for Management |
| Email/WhatsApp Notifications | 047 | Low | Fase 2 — external notification |
| Parallel Approval Review | 040 | Medium | GAP-08: Dept + PM parallel review |
| Backup Approver & Reassignment | 042 | Medium | GAP-07: No mechanism if approver inactive |
| Approval History Timeline | 039 | Medium | Track record per approval item |
| Global Search (Ctrl+K) | 012 §5.3 | Low | Power user productivity |
| Error pages (403, 404, 500) | ERRR-01/02/03 | Medium | Professional error handling |
| Change Password page | AUTH-02 | Medium | Required for user security |
| Session Management (idle timeout, lockout) | AUTH-03, 019 | Medium | Session security |

### 2.2 Partially Implemented Features

| Feature | What Exists | What's Missing | Doc Ref |
|---------|-------------|----------------|---------|
| Prospect Workflow | 4 statuses (prospecting → waiting → revision → approved) | Full lifecycle with SDR → Field → Decision → Won/Lost | 032 |
| Project RKS | Tender info form + upload | BOQ section, multi-step approval integration | 034 |
| LPHS/SIOS | Checklist + upload | Parallel review (dept + PM simultaneous), targeted revision | 035, 040 |
| Approval Inbox | Categorized list + review drawer | Multi-level approval chain, SLA escalation, approval history | 039, 041 |
| Reports | Win/Loss charts + Pipeline funnel | Actual PDF/Excel export, scheduled reports, KPI report | 051 |
| Notifications | In-app feed with filters | Email/WhatsApp external, push notifications, real-time | 046, 047 |
| Documents | Accordion groups in project detail | Versioning, preview, dedicated document management page | 048, 049 |
| Configuration | Org, Status, Notifications, SLA | 10+ missing config pages | 027-031 |
| Master Data | 5 tabs in single page | 4 missing master data types | 021-026 |
| KPI | Basic KPI cards in Config tab | Dedicated KPI dashboard, target setting, progress scoring | 043-045 |
| Route Guards | Stub files exist | No actual auth check, no role-based filtering | 020 |

### 2.3 Summary Count

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Fully Implemented | ~25 | Good parity with MD doc requirements |
| ⚠️ Partially Implemented | ~28 | Implemented but missing key MD doc features |
| ❌ Missing | ~28 | Not implemented at all |

---

## 3. Frontend Architecture Review

### 3.1 Current Folder Structure

```
src/ (ACTIVE — 462-line App.tsx)
├── App.tsx                   # God class: routing + state + layout
├── main.tsx                  # HashRouter + mount
├── index.css                 # Tailwind v4 + 60+ custom theme tokens
├── components/
│   ├── layout/               # Topbar.tsx, Sidebar.tsx (functional)
│   ├── ui/                   # EMPTY
│   └── shared/               # EMPTY
├── features/ (13 dirs)       # One monolithic file per feature
│   ├── approvals/            # ApprovalInboxPage.tsx (378 lines)
│   ├── audit/                # AuditPage.tsx (203 lines)
│   ├── auth/                 # LoginPage.tsx (284 lines)
│   ├── config/               # 4 files (Org, Status, SLA, Notifications)
│   ├── dashboard/            # DashboardPage.tsx (309 lines)
│   ├── kpi/                  # KpiPage.tsx (214 lines)
│   ├── master-data/          # MasterDataPage.tsx (1500+ lines)
│   ├── notifications/        # NotificationsPage.tsx (426 lines)
│   ├── profile/              # ProfilePage.tsx (407 lines)
│   ├── projects/             # ProjectDetailPage.tsx (1500+ lines)
│   ├── prospects/            # ProspectsPage.tsx (478 lines)
│   ├── reports/              # ReportsPage.tsx (1000+ lines)
│   └── users/                # UsersPage.tsx (274 lines)
├── hooks/
│   ├── queries/              # EMPTY
│   └── mutations/            # EMPTY
├── routes/
│   ├── guards.tsx            # Stub pass-through wrappers
│   └── nav-items.ts          # Static flat menu (no role filtering)
├── services/
│   └── mock-data.ts          # Only service file — all data is mock
├── stores/                   # 3 files — ALL DEAD CODE (never imported)
├── types/
│   ├── api/                  # EMPTY
│   ├── common/               # EMPTY
│   └── domain/               # 2 files with basic entity types
└── utils/                    # 3 files: constants, formatters, validators
```

### 3.2 Target Architecture (Doc 058 + `frontend/src/`)

```
frontend/src/ (TARGET — correct architectural blueprint)
├── App.tsx                   # Clean 10-line wrapper (BrowserRouter + AppRouter)
├── components/
│   ├── ui/                   # 12 files: Button, Input, Select, Modal, Table,
│   │                         #   Badge, Toast, Tabs, Card, DatePicker, Drawer, index
│   └── shared/               # 6 files: DataTable, FilterPanel, FormWrapper,
│                             #   GlobalSearch, Pagination, StatusBadge
├── features/ (per module)    # Each feature has: Page.tsx, components/, hooks/
├── hooks/
│   ├── queries/              # React Query hooks
│   └── mutations/            # Mutation hooks
├── services/                 # 14 API service files + api-client.ts (Axios)
├── stores/                   # zustand stores (actually used)
└── routes/
    ├── router.tsx            # createBrowserRouter with lazy loading
    └── guards.tsx            # AuthGuard + RoleGuard with real enforcement
```

### 3.3 Recommended Dependencies (from `frontend/package.json`)

| Package | Purpose | Currently Used? |
|---------|---------|-----------------|
| `@tanstack/react-query` | Server state management (caching, refetch, mutations) | ❌ |
| `zustand` | Client state management | ❌ (files exist but dead) |
| `axios` | HTTP client with interceptors | ❌ |
| `react-hook-form` | Form state management | ❌ |
| `zod` | Schema validation | ❌ |
| `@hookform/resolvers` | Bridge RHF + Zod | ❌ |
| `lucide-react` | Icon library | ❌ (uses Material Symbols) |
| `date-fns` | Date formatting/manipulation | ❌ |
| `react-hot-toast` | Toast notifications | ❌ (inline `<div>`) |
| `recharts` | Charts (recommended addition) | ❌ (hand-drawn SVG) |

### 3.4 Key Architectural Issues

1. **God-class App.tsx** (462 lines): Routing, state, layout, auth all in one file. Should be split into:
   - `routes/router.tsx` → Route definitions with lazy loading
   - `components/layout/AppLayout.tsx` → Layout composition
   - Separate stores for auth, UI, notifications

2. **No feature-first architecture**: Current `features/` has flat `.tsx` files. Target should have sub-directories:
   ```
   features/projects/
   ├── pages/            # ProjectListPage, ProjectDetailPage
   ├── components/       # ProjectCard, ProjectStepper, ProjectTabs
   ├── hooks/           # useProjects, useProjectDetail
   ├── schemas/         # zod validation schemas
   └── services/        # projectService.ts (API calls)
   ```

3. **Dead code**: `stores/authStore.ts`, `notificationStore.ts`, `uiStore.ts` exist but App.tsx uses raw `useState` instead. Either use them or remove them.

4. **No service abstraction**: All data access is `useState(INITIAL_PROJECTS)`. No `api-client.ts` for Axios instance with auth interceptors.

---

## 4. UI/UX Improvement Plan

### 4.1 Navigation Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| No role-based menu filtering | Filter `navItems` by `user.role` so Cabang doesn't see Config, Admin-only items hidden from others | Critical | 012 §8.2 |
| No breadcrumb system | Build `Breadcrumb` component using `react-router` `useMatches`. Format: Dashboard > Module > Item | High | 012 §5.1 |
| No mobile sidebar collapse | Implement hamburger menu + overlay drawer for <768px. Sidebar hidden by default on mobile | High | 012 §9 |
| No active state indication | Use `<NavLink>` instead of manual buttons with `activeTab` state | Medium | — |
| Nav items not configurable | Future: read sidebar from API `GET /api/config/menu` | Low | CFG-08 |
| No back navigation on detail pages | Add "← Kembali" button in all detail page headers, using `navigate(-1)` with parent fallback | Medium | 012 §5.2 |
| Notification badge uses mock count | Wire to real API count from `GET /api/notifications/unread-count` | High | 012 §5.4 |

### 4.2 Dashboard Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| Static mock data | Connect to `GET /api/dashboard/summary` via React Query with `staleTime: 5min`, `refetchInterval: 5min` | Critical | 050 §7, BR-DASH-02 |
| No filter granular for Management | Add FilterBar with Cabang/Divisi/Kategori/Periode — only visible to Management/Admin | High | 050 §5, GAP-10 |
| No AI Executive Summary | Implement AI summary widget for Management/Admin with 1-hr cache, graceful fallback if AI fails | Low | 050 §6 |
| Hand-drawn charts | Replace with `recharts` (BarChart, DonutChart, ResponsiveContainer) | Medium | 014 DASH-01 |
| No skeleton loading | Add shimmer skeleton per DashboardCard during initial load | Medium | 014 |
| No per-widget error isolation | Wrap each widget in ErrorBoundary with inline retry button | Medium | 014 |
| No empty state per widget | Add inline empty state text per widget when data is absent | Medium | 014 |

### 4.3 Form Design Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| Manual validation | Implement react-hook-form + zod schemas for all forms | Critical | 058 §10 |
| No dirty form warning | Add `beforeunload` + ConfirmDialog when navigating away from dirty forms | High | BR-PROS-08 |
| No async searchable selects | Build Select with debounced search + async options loading | High | PROS-02 |
| No currency input | Build CurrencyInput with IDR formatting on blur (min 0, no negative) | High | PROS-02 |
| Dynamic questions from localStorage | Migrate to DB-backed GET /api/master/questions?type=prospect (GAP-03) | Critical | PROS-02, GAP-03 |
| No submit progress indicator | Add loading spinner in submit button + disable all fields during submission | Medium | 014 |
| No field-level error display | Connect zod errors to form fields via `aria-describedby` | High | 014 |
| No password strength indicator | Add 4-level bar (lemah/cukup/kuat/sangat kuat) on change-password form | Medium | AUTH-02 |

### 4.4 Table & Data Management Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| No reusable DataTable | Build from `frontend/src/components/shared/DataTable.tsx` with column config | Critical | 058 |
| No server-side pagination | Implement with `page`, `perPage` (10/20/50), total count from API | High | 014 |
| No column sorting | Add sortable headers with visual indicator (▲/▼), send `sortBy` + `sortOrder` to API | High | 014 |
| No filter persistence | Preserve filter/sort/page in URL query params so browser back works | Medium | 012 §2.1 |
| No responsive card layout | Table → vertical card stack at <640px (per PROS-01) | High | 014 |
| No bulk actions | Add checkbox column + batch action toolbar | Medium | — |
| No row action consistency | Standardize 3-dot menu pattern for all row actions | Medium | 014 |

### 4.5 Search & Filtering Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| No debounced search | Add 300ms debounce on text search inputs | High | PROS-01 |
| No global search (Ctrl+K) | Modal search across projects/prospects/customers with recent searches | Low | 012 §5.3 |
| No date range picker | Build reusable DatePicker (exists in `frontend/` — needs activation) | Medium | 014 |
| No multi-select filter | Status filters should allow multiple selection | Medium | 014 |
| No filter bar standardization | Build reusable `FilterPanel` component (exists in `frontend/` — needs activation) | High | 058 |

### 4.6 Mobile Responsiveness Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| No responsive sidebar | Drawer overlay on mobile; collapsed icons-only on tablet; full on desktop | High | 012 §9 |
| No mobile bottom tab | Optional Fase 2: bottom nav with 4 most-used items for cabang/pm | Low | 012 §9.2 |
| No responsive tables | Card stack pattern at <640px | High | 014 |
| No touch-friendly targets | All interactive elements ≥ 44px | Medium | WCAG |
| No single-column forms | Stack multi-column layouts vertically on mobile | Medium | PROS-02 |
| No responsive data grid | Dashboard widget grid: 1 col mobile → 2 col tablet → 3-4 col desktop | Medium | 014 DASH-01 |

### 4.7 Accessibility Improvements

| Issue | Improvement | Priority | Reference |
|-------|-------------|----------|-----------|
| No ARIA labels | Add `aria-label`, `aria-describedby`, `aria-required` to all inputs | High | 014, 058 §14 |
| No keyboard navigation | Full keyboard flow: Tab, Enter, Esc, arrow keys for selects/tabs | High | 058 §14 |
| No focus management | Focus trap in modals/drawers; focus restoration on close | High | 014 |
| No color-only indicators | Add text labels to status badges + traffic lights (Merah/Kuning/Hijau) | Medium | 014 |
| No screen reader support | `role="alert"` on errors, `aria-live="polite"` on dynamic content, `<caption>` on tables | Medium | 014 |
| No skip-to-content link | Add visible-on-focus skip link at top of page | Low | 058 §14 |
| No accessible modals | Modal must have `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | High | 014 |

### 4.8 User Workflow Optimization

| Flow | Current UX | Proposed Improvement | Priority |
|------|-----------|---------------------|----------|
| Prospect → Project | User navigates manually to /projects/new | One-click "Konversi ke Proyek" with pre-filled name + customer | High |
| Approval workflow | List → Click → Drawer → Review | Split view: list left + detail right on desktop | High |
| Document upload | Multiple individual uploads per field | Drag-and-drop zone, batch upload, progress bar per file | Medium |
| KPI workflow | Not implemented | Guided wizard: Select Period → Set Targets → Monitor Progress | Medium |

---

## 5. Design System Recommendations

### 5.1 Component Standardization

| Component | Current State | Recommended Approach | File |
|-----------|--------------|---------------------|------|
| Button | Inline `<button>` with varied classes | `Button.tsx` with variants (primary/secondary/ghost/danger/outline), sizes (sm/md/lg), isLoading | `components/ui/Button.tsx` |
| Input | Inline `<input>` with varied classes | `Input.tsx` with label, error, leftIcon, rightIcon, helperText | `components/ui/Input.tsx` |
| Select | Inline `<select>` | `Select.tsx` with searchable, async, multi, error states | `components/ui/Select.tsx` |
| Table | Hand-built `<table>` | `DataTable.tsx` with column config, sorting, pagination, row selection | `components/shared/DataTable.tsx` |
| Modal | Inline `<div>` overlays | `Modal.tsx` with focus trap, Esc close, size prop, footer slot | `components/ui/Modal.tsx` |
| Drawer | Inline `<div>` slide-in | `Drawer.tsx` with overlay, animation, focus trap, position (left/right) | `components/ui/Drawer.tsx` |
| Badge | Hand-built `<span>` with bg-X/10 text-X | `Badge.tsx` with variant mapping, size | `components/ui/Badge.tsx` |
| Toast | Inline `<div>` + fade animation | `react-hot-toast` with success/error/warning variants | Global |
| Tabs | `<button>` group | `Tabs.tsx` with underline/pills variants | `components/ui/Tabs.tsx` |
| Card | `<div>` with bg-white + rounded-xl + shadow-sm | `Card.tsx` with variant, padding, header/footer slots | `components/ui/Card.tsx` |

### 5.2 Typography Hierarchy

The CSS theme already defines these utilities but they are used inconsistently:

| Utility | Usage | Size | Weight | Current Usage Status |
|---------|-------|------|--------|---------------------|
| `.font-display-title` | Page titles (H1) | 1.5rem | 700 | Used ~40% of the time |
| `.font-heading-section` | Section headers (H2) | 1.25rem | 600 | Used ~30% of the time |
| `.font-subheading-entity` | Entity/record names | 1.125rem | 700 | Used ~20% of the time |
| `.font-body-main` | Body content | 1rem | 400 | Used ~60% of the time |
| `.font-label-sm` | Field labels | 0.875rem | 500 | Used ~10% of the time |
| `.text-caption-xs` | Captions, timestamps | 0.75rem | 400 | Used ~10% of the time |

**Issue**: Many pages use raw Tailwind classes (`text-2xl font-bold`, `text-lg font-semibold`, `text-xs`) instead of theme utilities.

**Action**: Audit all feature files and replace raw Tailwind typography classes with theme utilities. Add a `Typography` component as a future enhancement.

### 5.3 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-margin-mobile` | 1rem | Page padding on mobile |
| `--spacing-margin-desktop` | 2rem | Page padding on desktop |
| `--spacing-gutter` | 1rem | Gap between card items |
| `--spacing-base` | 0.25rem | Unit multiplier |

Recommended spacing conventions:

| Context | Desktop | Mobile |
|---------|---------|--------|
| Page padding | `p-8` | `p-4` |
| Card padding | `p-5` | `p-4` |
| Form field gap | `space-y-4` | `space-y-4` |
| Table cell padding | `px-4 py-3` | `px-3 py-2` |
| Section gap | `space-y-6` | `space-y-4` |
| Card gap in grid | `gap-4` | `gap-3` |

### 5.4 Color Usage

**Issue**: Mix of theme variables and raw hex values across the codebase.

Examples of inconsistency:
- Some use `text-success`, others `text-green-600`, others inline hex `#16A34A`
- Secondary text: `text-secondary` vs `text-gray-500` vs `text-slate-500`
- Borders: `border-border` vs `border-gray-200` vs `border-slate-200`

**Action**: Audit all files to use theme variables exclusively. Reject raw Tailwind color literals in code review.

### 5.5 Status Indicators (Badge Mappings)

| Status Value | Label | Color | CSS Class |
|-------------|-------|-------|-----------|
| `prospecting` | Prospecting | Gray (#6B7280) | `bg-gray-100 text-gray-700` |
| `waiting_pm_approval` | Menunggu Approval PM | Blue (#2563A8) | `bg-blue-100 text-blue-700` |
| `revision` | Perlu Revisi | Amber (#D97706) | `bg-amber-100 text-amber-700` |
| `approved` | Disetujui | Green (#16A34A) | `bg-green-100 text-green-700` |
| `cancelled` | Dibatalkan | Red (#DC2626) | `bg-red-100 text-red-700` |
| `overdue` | Terlambat SLA | Red (#DC2626) | `bg-red-100 text-red-700` |

**Action**: Create `StatusBadge` component (exists in `frontend/src/components/shared/StatusBadge.tsx`) that maps status → label + color centrally.

### 5.6 Reusable Pattern Library

All pages should follow these patterns:

**Page Pattern (List)**:
```
PageHeader (title + action buttons)
FilterBar (filter controls)
DataTable (data display)
Pagination (page controls)
```

**Page Pattern (Detail)**:
```
PageHeader (title + back button + context actions)
Info Panel (key-value pairs, status badge)
Tab Navigation (content sections)
Tab Content (form/table/cards per tab)
```

**Form Pattern**:
```
PageHeader (form title)
Form Card(s) (grouped sections)
  Section Header
  Form Fields (2-column desktop, 1-column mobile)
Sticky Footer (Cancel + Save Draft + Submit)
```

**Card Pattern**: `bg-white rounded-xl shadow-sm border border-border p-5`

**Section Header**: `.font-heading-section text-on-surface` + optional "Lihat Semua" link

**Empty State**: Illustration + heading + description + optional CTA button

**Error State**: Inline card with icon + message + retry button

---

## 6. Implementation Roadmap

### Phase 1 — Critical Fixes (Weeks 1-3)

> Foundation, security, and architecture. Without these, nothing else is production-ready.

| # | Task | Est. Days | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| 1.1 | Install target dependency stack (react-query, zustand, axios, RHF, zod, date-fns, lucide-react, react-hot-toast) | 0.5 | None | Enables all other architectural work |
| 1.2 | Build UI component library (12 components from `frontend/src/components/ui/`) — Button, Input, Select, Badge, Toast, Modal, Drawer, Table, Tabs, Card, DatePicker | 5 | Dependencies installed | Eliminates duplicate inline code across all pages |
| 1.3 | Create API service layer: Axios instance + base URL + auth interceptor + error interceptor | 1 | Dependencies installed | Enables real backend communication |
| 1.4 | Implement route guards: AuthGuard (check isAuthenticated) + RoleGuard (check allowedRoles) | 1.5 | Zustand + Auth store | Security — currently wide open |
| 1.5 | Refactor App.tsx: Move routes to `routes/router.tsx`, layout to `AppLayout.tsx`, use actual stores | 2 | Guards + stores | Maintainability — break apart god class |
| 1.6 | Implement Prospect dynamic questions from DB (GAP-03): migrate from hardcoded to GET /api/master/questions?type=prospect | 2 | API service + Master Questions API | Core gap resolution |
| 1.7 | Refactor monolithic components: Split ProjectDetailPage (1500 lines) and MasterDataPage (1500 lines) into sub-components | 4 | Component library | Maintainability |
| 1.8 | Implement real authentication: Login API call, token storage, auth store wiring | 2 | API service layer | Eliminates hardcoded accounts |
| 1.9 | Fix JSX typos (class= → className) and missing CSS definitions | 0.5 | None | Code correctness |

**Phase 1 Total**: ~18 days

### Phase 2 — Core CRM Features (Weeks 4-8)

> Build the missing modules that the MD docs specify as essential.

| # | Task | Est. Days | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| 2.1 | Build proper Project List page (PROJ-01): DataTable with filters, search, pagination, sort | 3 | DataTable component + API | Main navigation target for all roles |
| 2.2 | Build User Management module: CRUD users, role assignment, status toggle, search | 4 | API + Component library | Missing critical admin feature |
| 2.3 | Build KPI module: KPI Dashboard, Target Setting grid, Progress Monitoring with charts | 5 | API + Charts library | Critical gap GAP-01 |
| 2.4 | Build Role & Permission Configuration (CFG-04): permission matrix editor | 3 | API + DataTable | Dynamic role management |
| 2.5 | Build remaining Configuration pages (CFG-02,06-14): Workflow, Period, Question Types, Upload, Integration, Targets, Dashboard Config, Notif Template | 6 | API + Form components | Admin backbone completeness |
| 2.6 | Build remaining Master Data pages: Categories, Document Types, Loss Reasons, Periods, Holidays, Positions | 4 | API + Form components | Data foundation |
| 2.7 | Implement SLA Configuration page (CFG-05): SLA rules, day calculation, reminder trigger config | 2 | API + Status Config | GAP-06 |
| 2.8 | Add server-side pagination + sorting to all list pages | 3 | DataTable + API | All tables currently show "1 of 1" |
| 2.9 | Implement real PDF/Excel export for Reports | 3 | API + export library | Export buttons currently do nothing |
| 2.10 | Build approval history/timeline in approval detail | 2 | Phase 1 API | Track record visibility |

**Phase 2 Total**: ~35 days

### Phase 3 — UX Enhancements (Weeks 9-12)

> Make the CRM feel professional and usable.

| # | Task | Est. Days | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| 3.1 | Add filter granular to Dashboard (Cabang/Divisi/Kategori/Periode) for Management/Admin | 3 | Phase 2 Dashboard API | GAP-10: Management drill-down |
| 3.2 | Implement breadcrumb system | 1.5 | Router structure | Navigation clarity |
| 3.3 | Add mobile responsive sidebar (hamburger + overlay drawer) | 2 | None | Mobile usability |
| 3.4 | Add responsive table → card stack on mobile | 2 | DataTable component | Mobile usability |
| 3.5 | Add loading/skeleton states to all pages | 3 | UI components | Better UX than blank screen |
| 3.6 | Add empty state illustrations to all list/detail pages | 2 | None | Professional feel |
| 3.7 | Add dirty form warning + confirm dialog on navigation | 1.5 | Modal component | Prevents data loss |
| 3.8 | Implement async searchable selects (customer, categories) | 2 | Select component | Better UX |
| 3.9 | Add "← Kembali" button on all detail pages | 1 | None | Navigation convenience |
| 3.10 | Build notification badge with real count (polling) | 1.5 | Notification API | Real-time feedback |
| 3.11 | Add currency input with IDR formatting | 1 | Input component | Finance UX |
| 3.12 | Implement core accessibility: ARIA labels, keyboard nav, focus trap in modals | 4 | All components | WCAG compliance |

**Phase 3 Total**: ~24.5 days

### Phase 4 — Polish & Production Readiness (Weeks 13-16)

> Performance, accessibility completeness, quality, and deployment readiness.

| # | Task | Est. Days | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| 4.1 | Add ErrorBoundary per route + per dashboard widget | 2 | None | Resilience |
| 4.2 | Implement lazy loading for all page-level components (Suspense + lazy) | 1.5 | Router structure | Bundle size optimization |
| 4.3 | Add session warning modal (idle timeout, 25-min warning) | 2 | Phase 1 auth | Session security |
| 4.4 | Build 403/404/500 error pages | 1 | Router | Professional error handling |
| 4.5 | Add dark mode support (Tailwind dark: variant) | 2 | CSS theme | User preference |
| 4.6 | Add Ctrl+K global search (modal, search across entities) | 3 | API | Power user productivity |
| 4.7 | Add unit tests for UI components + integration tests for critical flows | 5 | Testing framework | Quality assurance |
| 4.8 | Performance audit: Lighthouse ≥ 90, bundle size analysis, image optimization | 2 | All tasks | Production readiness |
| 4.9 | Accessible color-blind indicators (text labels + patterns) | 1 | StatusBadge | WCAG compliance |
| 4.10 | Codebase cleanup: remove dead code, fix any types, standardize imports | 2 | All tasks | Maintainability |
| 4.11 | Build AI Executive Summary widget (Management/Admin, with fallback) | 3 | AI Service API | Dashboard enhancement |

**Phase 4 Total**: ~24.5 days

---

## 7. Prioritized Task List

### Critical (Must Do Before Anything Else)

| # | Task | Complexity | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| C1 | Adopt target dependency stack (react-query, zustand, axios, RHF, zod, etc.) | Low | None | Enables all other improvements |
| C2 | Build 12 UI components (Button, Input, Select, Badge, Toast, Modal, Drawer, Table, Tabs, Card, DatePicker) | Medium | C1 | 50% reduction in duplicate code |
| C3 | Implement route guards (AuthGuard + RoleGuard) | Medium | Stacks | Security — currently wide open |
| C4 | Create API service layer (Axios + interceptors + per-feature services) | Medium | C1 | Enables real backend integration |
| C5 | Implement prospect questions from DB (GAP-03) | Medium | C4 + API | Core gap resolution |
| C6 | Refactor App.tsx: separate routing, layout, state | Medium | C3 | Maintainability |

### High (Core Completeness)

| # | Task | Complexity | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| H1 | Build proper Project List page | Medium | C2 | Missing core page |
| H2 | Build User Management module | High | C4 | Missing CRUD for users |
| H3 | Build KPI module (Dashboard + Target + Progress) | High | C4 + Charts | Critical gap GAP-01 |
| H4 | Add server-side pagination + sorting to all lists | Medium | C2 + C4 | Tables currently fake |
| H5 | Build remaining Configuration pages | High | C4 | Admin backbone |
| H6 | Build remaining Master Data pages | High | C4 | Data foundation |
| H7 | Implement breadcrumb system | Low | None | Navigation clarity |
| H8 | Add mobile responsive sidebar | Medium | None | Mobile usability |
| H9 | Add responsive table → card stack on mobile | Medium | C2 | Mobile usability |
| H10 | Add loading/skeleton states | Medium | C2 | Professional UX |
| H11 | Add empty state illustrations | Low | None | Professional feel |
| H12 | Add dirty form warning | Medium | C2 | Prevents data loss |
| H13 | Add async searchable selects | Medium | C2 | Better UX |
| H14 | Implement real export (PDF/Excel) | Medium | C4 | Currently stubs |
| H15 | Add filter granular to Dashboard (GAP-10) | High | C4 | Management requirement |
| H16 | Add ARIA labels + keyboard navigation | High | All components | Accessibility |

### Medium (Important UX)

| # | Task | Complexity | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| M1 | Build Role & Permission Configuration (CFG-04) | High | C4 | Dynamic role management |
| M2 | Build SLA Configuration page | Medium | C4 | GAP-06 |
| M3 | Build approval history/timeline | Medium | C4 | Track record |
| M4 | Add notification badge with real count | Low | C4 | Real-time feedback |
| M5 | Add error boundaries | Medium | None | Resilience |
| M6 | Add lazy loading | Medium | Router | Bundle size |
| M7 | Add session warning modal | Medium | C1 | Session security |
| M8 | Build 403/404/500 error pages | Low | Router | Error handling |
| M9 | Add currency input with IDR formatting | Low | C2 | Finance UX |
| M10 | Add date range picker | Medium | C2 | Better filtering |
| M11 | Add focus management (modals, drawers) | Medium | C2 | Accessibility |
| M12 | Add color-blind indicators | Low | C2 | Accessibility |

### Low (Nice-to-Have / Future)

| # | Task | Complexity | Dependencies | Impact |
|---|------|-----------|--------------|--------|
| L1 | Build AI Executive Summary widget | Medium | C4 + AI API | Dashboard enhancement |
| L2 | Add dark mode | Medium | CSS theme | User preference |
| L3 | Add Ctrl+K global search | Medium | C4 | Power user |
| L4 | Add unit/integration tests | High | Testing | Quality assurance |
| L5 | Add mobile bottom tab navigation | Low | None | Mobile (Fase 2) |
| L6 | Add skip-to-content link | Low | None | Accessibility |
| L7 | Codebase cleanup | Medium | All | Maintainability |
| L8 | Performance audit | Medium | All | Production readiness |

---

## 8. Final Recommendation

### Recommended Order of Implementation

**Phase 1 → Phase 2 → Phase 3 → Phase 4**

### Rationale

**Start with Phase 1 because:**
- Without the target dependency stack (`react-query`, `zustand`, `axios`, `react-hook-form`, `zod`), none of the architectural improvements are possible
- Route guards and authentication are the most critical security gaps — the app currently has zero access control
- Dynamic questions from DB (GAP-03) was flagged as a **Critical gap** in the BA Review. Prospect management cannot be production-ready without it
- The component library eliminates ~50% of code duplication across all pages, making every subsequent task faster

**Proceed to Phase 2 next because:**
- The three largest gaps are: (1) no Project List page (the main navigation target for all roles), (2) no User Management (admin cannot manage users at all), and (3) no KPI module (Critical gap GAP-01). Without these, the system is not a complete CRM
- Configuration and Master Data pages are required for the admin backbone — without them, business-critical parameters remain hardcoded
- Server-side pagination must be added simultaneously with Phase 1/2 because all tables currently show fake "1 of 1" data

**Tackle Phase 3 third because:**
- All Phase 2 features now work with real data. This phase polishes the experience
- Breadcrumbs, responsive design, skeletons, empty states, dashboard filters (GAP-10), and approval history are the features that make a CRM feel professional rather than a prototype
- These enhancements have zero value if the underlying features don't exist yet

**Finish with Phase 4 because:**
- Accessibility, performance (lazy loading, bundle optimization), resilience (ErrorBoundary, session management), quality (tests), and nice-to-haves (dark mode, global search, AI widget) should come after core functionality is stable
- The AI Executive Summary widget depends on the AI Service Layer being operational, which is backend-dependent
- Codebase cleanup should be the final step to incorporate all lessons learned

### Key Architectural Principle

The `frontend/` directory already contains the correct architectural blueprint:
- 12 properly-structured UI components
- 6 shared components (DataTable, FilterPanel, FormWrapper, GlobalSearch, Pagination, StatusBadge)
- 14 API service files + `api-client.ts` with Axios instance
- Proper hooks structure (`queries/`, `mutations/`)

**Do not redesign from scratch.** Refactor existing feature pages into the target architecture. The working feature logic should be preserved, extracted from monolithic files, and placed into the correct architectural layers as defined by Doc 058.

---

## 9. Appendix: Screen Inventory Against Documentation

### 9.1 Screen Completion Status (from Doc 014 UI Screen Catalog)

| Screen ID | Name | Route | MD Status | Current Status | Priority |
|-----------|------|-------|-----------|----------------|----------|
| AUTH-01 | Login | /login | ✅ Defined | ✅ Implemented | Complete |
| AUTH-02 | Change Password | /profile/change-password | ✅ Defined | ❌ Missing | Phase 1 |
| AUTH-03 | Session Expired | overlay | ✅ Defined | ❌ Missing | Phase 4 |
| DASH-01 | Dashboard | /dashboard | ✅ Defined | ✅ Implemented | Needs Phase 2 API |
| PROS-01 | Prospect List | /prospects | ✅ Defined | ✅ Implemented | Needs Phase 2 API |
| PROS-02 | Prospect Form | /prospects/new, /prospects/:id/edit | ✅ Defined | ✅ Implemented | Needs GAP-03 (P1) |
| PROS-03 | Prospect Detail | /prospects/:id | ✅ Defined | ❌ Missing | Phase 2 |
| PROJ-01 | Project List | /projects | ✅ Defined | ❌ Missing (stub) | Phase 2 |
| PROJ-02 | Project Form | /projects/new | ✅ Defined | ❌ Missing | Phase 2 |
| PROJ-03 | Project Detail | /projects/:id | ✅ Defined | ✅ Implemented | Needs refactor (P1) |
| PROJ-03a-j | Detail Tabs | /projects/:id?tab=X | ✅ Defined | ✅ Implemented (9 of 10) | Complete |
| APPR-01 | Approval Inbox | /approvals | ✅ Defined | ✅ Implemented | Needs Phase 2 API |
| APPR-02 | Review Drawer | overlay | ✅ Defined | ✅ Implemented | Needs Phase 2 API |
| REPT-01 | Win/Loss Report | /reports | ✅ Defined | ✅ Implemented | Needs export |
| REPT-02 | Pipeline Report | /reports/pipeline | ✅ Defined | ✅ Implemented | Needs export |
| MAST-01 | Master Customer | /master/customers | ✅ Defined | ⚠️ Partial | Phase 2 |
| MAST-02 | Master Departments | /master/departments | ✅ Defined | ⚠️ Partial | Phase 2 |
| MAST-03 | Master Questions | /master/questions | ✅ Defined | ✅ Implemented | Needs Phase 1 |
| MAST-04 | Master Competitors | /master/competitors | ✅ Defined | ⚠️ Partial | Phase 2 |
| MAST-05 | User Management | /admin/users | ✅ Defined | ⚠️ Partial | Phase 2 |
| CONF-01 | Config Organization | /config/org | ✅ Defined | ✅ Implemented | Complete |
| CONF-02 | Config Workflow | /config/workflow | ✅ Defined | ❌ Missing | Phase 2 |
| CONF-03 | Config Status | /config/statuses | ✅ Defined | ✅ Implemented | Complete |
| CONF-04 | Config Roles | /config/roles | ✅ Defined | ❌ Missing | Phase 2 |
| CONF-05 | Config SLA | /config/sla | ✅ Defined | ✅ Implemented | Complete |
| CONF-06 | Config Notifications | /config/notifications | ✅ Defined | ✅ Implemented | Complete |
| CONF-07 | Config Question Types | /config/question-types | ✅ Defined | ❌ Missing | Phase 2 |
| NOTF-01 | Notification Center | /notifications | ✅ Defined | ✅ Implemented | Complete |
| PROF-01 | User Profile | /profile | ✅ Defined | ✅ Implemented | Complete |
| ERRR-01 | 403 Forbidden | /403 | ✅ Defined | ❌ Missing | Phase 4 |
| ERRR-02 | 404 Not Found | /404 | ✅ Defined | ❌ Missing | Phase 4 |
| ERRR-03 | 500 Server Error | /500 | ✅ Defined | ❌ Missing | Phase 4 |
| AUDT-01 | Audit Log | /admin/audit-logs | ✅ Defined | ✅ Implemented | Complete |

### 9.2 New Screens from Doc 012 (Information Architecture) — Not in Doc 014

| Screen | Route | Defined In | Priority |
|--------|-------|-----------|----------|
| KPI Dashboard | /kpi | 012 §4.8 | Phase 2 |
| KPI Target Setting | /kpi/targets | 012 §4.9 | Phase 2 |
| KPI Progress Monitoring | /kpi/progress | 012 §4.9 | Phase 2 |
| Reports Index | /reports | 012 §4.10 | Phase 2 |
| KPI Report | /reports/kpi | 012 §4.10 | Phase 2 |
| Master Categories | /master/categories | 012 §4.12 | Phase 2 |
| Master Document Types | /master/document-types | 012 §4.12 | Phase 2 |
| Master Loss Reasons | /master/loss-reasons | 012 §4.12 | Phase 2 |
| Master Periods | /master/periods | 012 §4.12 | Phase 2 |
| Master Holidays | /master/holidays | 012 §4.12 | Phase 2 |
| Config Period | /config/period | 012 §4.11 | Phase 2 |
| Config Upload | /config/upload | 012 §4.11 | Phase 2 |
| Config Integration | /config/integration | 012 §4.11 | Phase 2 |
| Config Dashboard | /config/dashboard | 012 §4.11 | Phase 2 |
| Config Targets | /config/targets | 012 §4.11 | Phase 2 |
| Config Notif Template | /config/notifications-template | 012 §4.11 | Phase 2 |
| User Detail | /users/:id | 012 §4.12 | Phase 2 |
| User Create | /users/new | 012 §4.12 | Phase 2 |
| Forgot Password | /forgot-password | 012 §3.2 | Phase 4 |
| Reset Password | /reset-password/:token | 012 §3.2 | Phase 4 |

---

*This document was generated from comprehensive analysis of:*
- *65 MD documentation files (business requirements, architecture, screen catalog, navigation, etc.)*
- *Active frontend source code at `C:\Users\lenovo\Downloads\kinetic-crm (5)\src`*
- *Target frontend architecture at `C:\Users\lenovo\Downloads\kinetic-crm (5)\frontend\src`*
- *BA Review gap analysis and traceability matrix*

*Primary source of truth: MD documentation files in `md Kinetic CRM/` directory.*
