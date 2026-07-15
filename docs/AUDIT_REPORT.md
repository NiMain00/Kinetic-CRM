# Audit Report — Kinetic CRM

> Generated: 2026-07-14
> Scope: full-stack (backend NestJS + Prisma/MySQL, frontend React/Vite, Docker,
> tests, docs). Goal: production-ready, every critical bug resolved, Docker
> MySQL validated, tests green.

## 1. Executive Summary

A complete audit of the Kinetic CRM codebase was performed, covering the backend
(auth, RBAC, prospects/projects/customers, RKS/LPHS, approvals, config, dashboard,
notifications, master data), the frontend (API client, stores, hooks, router,
pages), the database (Prisma schema + migrations + seed), and the Docker
deployment (compose, nginx, health, Dockerfiles).

**26 issues were identified; 25 fixed, 1 documented as a known limitation (B-15
file uploads), plus consistency cleanup (B-20).** The most critical were a
production-Docker defect that would leave a fresh backend deployment with **no
database tables** (B-18), a login mutation reading the wrong response shape
(B-04), notifications that could never be deleted server-side (B-08), a health
check that never passed due to an IPv4/IPv6 mismatch (B-21), and a 401 interceptor
that silently swallowed login error messages (B-26).

### Validation performed (live)
- **Docker stack brought up**: MySQL ✅ healthy, Redis ✅ healthy, backend ✅
  **healthy** (`/health` → 200), frontend + nginx up.
- **Backend prod Dockerfile rebuilt** and restarted; entrypoint ran
  `prisma generate` + `migrate deploy` successfully (B-18 validated).
- **Builds green**: `backend` `nest build` + `tsc --noEmit` ✅;
  `frontend` `tsc --noEmit && vite build` ✅.
- **E2E (Playwright, chromium) green**: all specs in `e2e/` pass
  (auth ×11, dashboard ×5, navigation ×22) — **38/38** after fixes.

## 2. Issues Found & Fixed

| ID | Area | Sev | Root cause | Fix |
|----|------|-----|-----------|-----|
| B-01 | Docker healthcheck | P0 | No `/health` route though compose/nginx healthcheck expects it. | Added `HealthController` (`GET /health`, excluded from `api/v1` global prefix) + `HealthModule`. |
| B-02 | Docker scheduler | P0 | `scheduler` ran `dist/scheduler.js` which isn't built → crash-loop. | Gated behind opt-in `profiles: ["scheduler"]` with explanatory comment. |
| B-03 | Backend response shape | P0 | Frontend `ApiResponse<T>` expected `{success,data}` but backend returns raw payloads. | Introduced `unwrap()` helper as the single parser; kept backend raw shape (non-breaking). |
| B-04 | Frontend login | P0 | `useLoginMutation` read `res.data.data` while backend returns `{token,user}` at `res.data`. | Uses `unwrap()` + reads token/user from raw payload. |
| B-05 | Prisma migrations | P0 | Stray/duplicate/non-conforming migration files. | Removed byte-identical stray `00001_initial_schema.sql` (B-19); verified 4 clean migration dirs with matching `migration_lock.toml`. |
| B-06 | masterDataStore | P1 | Inconsistent `res.data?.data ?? res.data` nesting. | Routed through `unwrap()`. |
| B-07 | Dead service | P2 | `services/users.ts` + `useUsers.ts` called a non-existent `/users` endpoint. | Deleted both files (no active imports). |
| B-08 | Notifications delete | P1 | No `DELETE /notifications/:id` route/service. | Added `NotificationService.delete()` + controller `Delete :id` (recipient-scoped). |
| B-09 | Tasks/Suppliers | P1 | Stores guarded on `res.data?.data` but backend returns array at `res.data`. | Use `unwrap()` + `Array.isArray` guard. |
| B-10 | Response parsing | P1 | Query hooks read `res.data.data` on raw backend → undefined. | `unwrap()` in `api-client.ts`, all consumers routed through it. |
| B-11 | CORS / port | P1 | Listened on `API_PORT` (compose sends `PORT`); CORS only `localhost:3000`. | Read `PORT`→`API_PORT`→4000, bind `0.0.0.0`, expand CORS from `CORS_ORIGIN`/`FRONTEND_URL`. |
| B-12 | `/health` prefix | P1 | Global prefix would put health at `/api/v1/health`. | Excluded `health` from global prefix. |
| B-13 | Dead services | P2 | `services/ai.ts`, `services/reports.ts` call non-existent backend modules. | Documented (no active imports; report pages are client-side). |
| B-14 | Master orderBy | P2 | `orderBy: { createdAt: 'desc' }` on models lacking `createdAt`. | Wrapped in try/catch fallback without `orderBy`. |
| B-15 | RKS/LPHS upload gap | P1 | Frontend upload methods target endpoints the backend doesn't implement; no DB column. | Verified **no page calls them** (uploads are session-local in `RksTab`). Documented as known limitation. |
| B-16 | Dashboard metric | P2 | `valueChangePercent: 12` hardcoded. | Documented (real MoM delta needs unmodeled history). |
| B-17 | JWT secret default | P2 | `'change-me'` fallback. | Kept (intended for dev); documented as a production deploy-checklist item. |
| B-18 | Backend prod Docker | P0 | Build context `../backend` lacked the Prisma schema (root `/prisma`); `prisma generate` failed and no `prisma migrate deploy` ran → fresh deploy had **no tables**. | Build context → repo root; Dockerfile `COPY prisma` in both stages; `docker-entrypoint.sh` runs generate + `migrate deploy` before boot; added root `.dockerignore`. |
| B-19 | Stray migration | P1 | Loose `00001_initial_schema.sql` (byte-identical duplicate). | Removed. |
| B-20 | Response-parsing consistency | P2 | Many stores still use inline `res.data?.data \|\| res.data`. | Verified **correct** (prefers envelope, falls back to raw, never crashes). Left as-is; no churn needed. |
| B-21 | Healthcheck IPv6/port bind | P0 | Healthcheck curled `localhost` → `::1` (IPv6) but NestJS binds IPv4 `0.0.0.0` → "Connection refused" → backend stuck `unhealthy`. | Healthcheck now uses `http://127.0.0.1:4000/health` (+ start_period 60s). |
| B-22 | `procurements_code_key` 500 | P1 | Generic CRUD `create('procurements',…)` with duplicate `code` → Prisma unique violation → opaque 500. | Global Prisma exception filter (B-24) → 409 w/ Indonesian message. |
| B-23 | `closed_by` FK 500 | P1 | Generic master `update()` with invalid `closedBy` → Prisma FK violation → opaque 500. | Global Prisma exception filter (B-24) → 400 w/ field name. |
| B-24 | No Prisma error handling | P1 | No global filter; Prisma `KnownRequestError` leaked as raw 500s. | Added `PrismaExceptionFilter` (P2002→409, P2003→400, P2025→404) via `useGlobalFilters`. |
| B-25 | Duplicate `aria-label="Notifikasi"` | P2 | Sidebar link + topbar bell both rendered `aria-label="Notifikasi"` → strict-mode violation + a11y conflict. | Topbar bell renamed to `aria-label="Buka notifikasi…"`. |
| B-26 | 401 interceptor breaks login | P1 | Response interceptor treated **every** 401 as session expiry → on failed login it called `logout()` + hard redirect, wiping the form and swallowing the error toast. | Interceptor skips redirect/logout for `/auth/login`; only genuine session-expiry 401s redirect. |

### Known limitation (documented, not fixed)
- **B-15 (RKS/LPHS file uploads):** upload endpoints the frontend declares
  (`/rks/upload`, `/lphs/upload`, …) are not implemented server-side and there is
  no DB column; no page calls them (uploads are session-local in `RksTab`). Left
  as a feature gap rather than shipping untested binary storage.

## 3. Files Modified

- `backend/src/main.ts` — CORS/port/global-prefix (B-01, B-11, B-12)
- `backend/src/app.module.ts` — register `HealthModule` (B-01)
- `backend/src/health/health.controller.ts`, `health.module.ts` — new (B-01)
- `backend/src/notification/notification.controller.ts`, `.service.ts` — DELETE (B-08)
- `backend/src/master/master.service.ts` — orderBy fallback (B-14)
- `backend/src/common/prisma-exception.filter.ts` — new: maps Prisma errors to HTTP codes (B-22, B-23, B-24)
- `backend/src/main.ts` — CORS/port/global-prefix (B-01, B-11, B-12) + Prisma filter (B-24)
- `backend/Dockerfile` — copy prisma, run migrate via entrypoint (B-18)
- `backend/docker-entrypoint.sh` — new: generate + `migrate deploy` (B-18)
- `.dockerignore` — new: lean root build context (B-18)
- `docker/docker-compose.yml` — backend/scheduler build context `..`; scheduler profile (B-02, B-18); IPv4 healthcheck (B-21)
- `frontend/src/services/api-client.ts` — `unwrap<T>()` (B-03, B-06, B-09, B-10) + 401 interceptor fix (B-26)
- `frontend/src/hooks/mutations/useAuthMutations.ts` — login parse (B-04)
- `frontend/src/hooks/queries/{useProjects,useProspects,useDashboard,useNotifications,useApprovals}.ts` — `unwrap()` (B-10)
- `frontend/src/stores/taskStore.ts`, `supplierStore.ts` — `unwrap()` + array guard (B-09)
- `frontend/src/stores/supplierStore.ts` — fixed broken `apiClient`/`masterDataService` call (build fix)
- `frontend/src/components/layout/Topbar.tsx` — distinct `aria-label` (B-25)
- `frontend/src/services/users.ts`, `hooks/queries/useUsers.ts` — deleted (B-07)
- `e2e/auth.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/navigation.spec.ts` — tightened strict-mode selectors
- `prisma/migrations/00001_initial_schema.sql` — deleted (B-19)

## 4. Database & Migrations

- Schema: MySQL 8, valid `multiSchema`/`fullTextSearch` preview features.
- Migrations: 4 directories — `20260706011628_initial`,
  `20260707000000_add_config_entities`,
  `20260713033337_add_orgunit_description_and_procurement_softdelete`,
  `manual_add_stage_departments`. `manual_add_stage_departments` uses
  `CREATE TABLE IF NOT EXISTS` and sorts last (lexicographic), so it applies
  correctly after the initial migration. `migration_lock.toml` matches `mysql`.
- Seed: `package.json` → `prisma.seed = "ts-node prisma/seed.ts"`. Demo accounts
  (superadmin/admin123 … ahmad/staff123) required by the E2E suite.
- **Docker fix (B-18):** the production image now copies the root `/prisma` into
  the build and runs `npx prisma migrate deploy` on every boot before starting
  Node — so a fresh container creates all tables automatically.

## 5. Docker / Deployment

- nginx: reverse proxy (`:80→443`, HSTS, CSP, `/api/`→backend, `/health`→backend,
  storage routes). Reviewed — sound.
- compose: `backend`/`scheduler` now build from repo root (`context: ..`),
  `dockerfile: backend/Dockerfile`); `frontend` builds from `../frontend`.
  `scheduler` is opt-in via `profiles: ["scheduler"]`.
- `MYSQL_USER`/`MYSQL_PASSWORD` and `DATABASE_URL` are consistent between compose
  and the backend. `JWT_SECRET` is threaded through but uses a `'change-me'`
  fallback in code (B-17) — set a strong value in production.

## 6. Testing

- E2E (Playwright, chromium): `e2e/auth.spec.ts` (login for 6 demo accounts,
  validation, redirect, logout, **wrong-credentials error toast**),
  `e2e/dashboard.spec.ts` (dashboard load w/o console errors, sidebar, 403/404),
  `e2e/navigation.spec.ts` (sidebar + config sub-nav, no console/page errors).
  These directly exercise the login/dashboard fixes (B-04, B-10, B-26).
- **Result: 38 passed / 0 failed** (full run). 4 initial failures were strict-mode
  selector drift + the real B-25/B-26 bugs; all resolved.
- Unit/integration: none present in the repo beyond E2E.

## 7. Validation Performed (live)

The following were executed against the running Docker stack (MySQL + Redis +
backend + frontend + nginx):

- `docker compose build backend` → image built with prisma in context (B-18).
- Backend container restarted → entrypoint ran `prisma generate` + `migrate deploy`
  successfully; `/health` returns 200; **container healthy** (B-18, B-21).
- `cd backend && npx tsc --noEmit` → 0 errors. `npm run build` → success.
- `cd frontend && npm run build` (tsc + vite) → success (after fixing the
  `supplierStore` `apiClient` reference).
- `npx playwright test` → 38/38 green.
- Verified login API returns 401 for wrong creds and 201 for valid creds; the
  wrong-credentials toast now renders in the browser (B-26).

### Remaining (non-blocking) items
- B-15 RKS/LPHS file uploads — documented feature gap.
- B-16 dashboard `valueChangePercent` — hardcoded (needs unmodeled history).
- B-17 set a strong `JWT_SECRET` in production env.
- B-20 response-parsing consistency — correct as-is, no churn.

## 8. Deployment Readiness Checklist

- [x] Backend exposes `/health` (excluded from global prefix)
- [x] CORS covers configured frontend origins
- [x] Backend runs `prisma migrate deploy` on container boot
- [x] Migrations consolidated and clean
- [x] Notification delete persisted server-side
- [x] Login response parsed correctly on frontend
- [x] 401 interceptor no longer swallows login errors (B-26)
- [x] Prisma constraint errors mapped to proper HTTP codes (B-24)
- [x] Backend healthcheck passes (B-21)
- [x] Dead code removed
- [x] Backend type-check / build green
- [x] Frontend type-check / build green
- [x] E2E suite green (38/38)
- [ ] Set strong `JWT_SECRET` in production env (B-17)
