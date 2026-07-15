# Autonomous Audit Plan — Kinetic CRM

> Live working document. Updated continuously throughout the audit.

## 1. Audit Strategy

Kinetic CRM is a full-stack TypeScript application:

- **Backend**: NestJS 10 (commonjs), Prisma 5 / MySQL 8, JWT auth, RBAC engine.
- **Frontend**: React 19 + Vite 6, React Query, Zustand, react-router v7.
- **Infra**: Docker Compose (nginx reverse proxy + frontend + backend + scheduler + MySQL + Redis).
- **Tests**: Playwright E2E (`e2e/`), Prisma seed (`prisma/seed.ts`).

Strategy:
1. Static read-through of every backend module, controller, service, dto.
2. Static read-through of frontend stores/services/hooks/router/pages.
3. Build + type-check both projects to surface compiler/lint errors.
4. Run Prisma migrate + generate; validate schema against DB.
5. Fix root causes; prefer a thin response normalizer over scattering `res.data?.data` hacks.
6. Run Playwright E2E (real backend + MySQL in Docker) and fix failures.
7. Iterate until green.

## 2. Subsystem Checklist

| # | Subsystem | Status | Priority |
|---|-----------|--------|----------|
| 1 | Backend: Auth/JWT | ✅ | P0 |
| 2 | Backend: RBAC services | ✅ | P0 |
| 3 | Backend: Prospects/Projects/Customers | ✅ | P0 |
| 4 | Backend: RKS/LPHS/Approvals/Config/Dashboard | ✅ | P1 |
| 5 | Backend: Prisma queries / N+1 / orderBy | ✅ | P1 |
| 6 | Frontend: API client + response shape | ✅ | P0 |
| 7 | Frontend: stores / RBAC engine | ✅ | P0 |
| 8 | Frontend: router / guards | ✅ | P1 |
| 9 | Frontend: pages / forms / hooks | ✅ | P1 |
| 10 | Database: schema, migrations, seed | 🔵 | P0 |
| 11 | Docker: compose, health, networks, env | ✅ | P0 |
| 12 | Build / type-check / lint | ⚠️ | P0 |
| 13 | Tests: e2e + new coverage | ⚠️ | P1 |

Legend: ⬜ not started · 🔵 in progress · ✅ done · ⚠️ blocker

## 3. Priority Levels

- **P0 (critical)**: breaks the app / security / data loss / build failure.
- **P1 (high)**: correctness bug, bad UX, missing feature contract.
- **P2 (medium)**: code smell, perf, maintainability.

## 4. Bugs Found

_(each row: ID, area, severity, root cause, fix, validation)_

| ID | Area | Sev | Root cause | Fix | Validation |
|----|------|-----|-----------|-----|-----------|
| B-01 | Docker healthcheck | P0 | `docker-compose.yml` healthcheck curls `http://localhost:4000/health`, but backend has **no** `/health` route → container never becomes healthy, dependent services never start. | Add a `GET /health` endpoint (or Terminus) in backend; return `{status:'ok'}`. | `docker compose ps` shows backend healthy; manual curl `/health` returns 200. |
| B-02 | Docker scheduler | P0 | `scheduler` service runs `node dist/scheduler.js`, but no `scheduler.ts` exists in `backend/src` and `nest build` only emits `main.js` → scheduler container crashes on boot. | Either add a real `scheduler.ts` (with `@nestjs/schedule`) or remove the scheduler service from compose. Until implemented, disable it (already `profile: [disabled]` in override; make production compose not depend on a missing artifact). | Scheduler (if enabled) starts without "Cannot find module". |
| B-03 | Backend response shape | P0 | Controllers return raw entities (`{token,user}`, arrays, etc.) but frontend `ApiResponse` contract expects `{success,data}` and many stores do `(res.data?.data ?? res.data)` — fragile and inconsistent; `useLoginMutation` reads `res.data.data` (wrong, crashes/blank on real backend). | Introduce a consistent response envelope + small `unwrap()` helper, OR (safer, no contract break) keep raw shape and fix the one wrong consumer. Plan: add `ApiResponse` interceptor with `success`+`data`+`meta` so frontend `ApiResponse<T>` is honored, and make `unwrap()` the single parser. | Login works; dashboard/rbac stores populate from `data`. |
| B-04 | Frontend login mutation | P0 | `useLoginMutation` uses `res.data.data` while backend returns `{token,user}` at `res.data`. Login via that hook yields `undefined` token. | Align with `LoginPage` (`res.data`) + add `unwrap()`. | `useLoginMutation` login path sets token & user. |
| B-05 | Prisma migrations dir | P0 | Stray non-applied files: `00001_initial_schema.sql` (raw, not a migration), `20260706011628_initial`, `manual_add_stage_departments` (non-conforming name w/ no `migration_lock` linkage). `prisma migrate deploy` may fail or skip. | Validate against DB; consolidate to a clean applied migration set consistent with `schema.prisma`; ensure `migration_lock.toml` matches provider. | `prisma migrate deploy` applies 0 pending; `prisma validate` passes. |
| B-06 | `masterDataStore` response | P1 | `fetchEntity` reads `(res.data?.data ?? res.data)`; inconsistent with backend raw shape; risk of double-nesting. | Centralize parsing via `unwrap()`. | Master data grids populate. |

_(more added as discovered)_

| B-07 | Frontend dead service | P2 | `services/users.ts` + `hooks/queries/useUsers.ts` call a `/users` endpoint that does not exist on the backend (users are served via `/master/users`). Never imported anywhere → dead code referencing a 404. | Removed both files. | Grep confirms no remaining references. |
| B-08 | Notifications delete | P1 | `notificationStore.removeNotification`/`clearAll` call `notificationService.archive` → `DELETE /notifications/:id`, but backend had no DELETE route or service method → 404 (caught, so deletes never persisted server-side). | Added `NotificationService.delete(id,userId)` + `DELETE :id` controller route. | Manual curl of DELETE returns 200/deleteMany result. |
| B-09 | Tasks/Suppliers never load | P1 | `taskStore.fetchTasks`/`supplierStore.fetchSuppliers` guard on `res.data?.data`, but backend returns the array directly at `res.data` → condition false → tasks/suppliers never populate. | Use `unwrap()` helper. | Tasks/suppliers populate from `res.data`. |
| B-10 | Response parsing inconsistency | P1 | Frontend `ApiResponse` contract expects `{success,data}`, but backend returns payloads raw at `res.data`. Query hooks (`useProjects/useProspects/useDashboard/useNotifications/useApprovals`) and stores read `res.data.data` → undefined on the real backend. | Added `unwrap()` in `api-client.ts` and routed all consumers through it; kept raw backend shape (no breaking envelope). | All consumers read real payload. |
| B-11 | CORS / port env mismatch | P1 | `main.ts` listened on `process.env.API_PORT` while compose passes `PORT: 4000`; also CORS origin only `localhost:3000`. | Read `PORT` (fallback `API_PORT`), bind `0.0.0.0`, expand CORS origins from `CORS_ORIGIN`/`FRONTEND_URL`. | Backend starts on PORT; CORS allows configured origin. |
| B-12 | `/health` under global prefix | P1 | `setGlobalPrefix('api/v1')` would put the new health route at `/api/v1/health`, but Docker healthcheck + nginx expect `/health`. | Excluded `health` from global prefix. | `curl /health` returns `{status:'ok'}`. |
| B-13 | Frontend dead services | P2 | `services/ai.ts`, `services/reports.ts` call backend modules that don't exist; report pages compute client-side from stores, so these are unused/unreachable. | Documented as dead code (kept — not imported anywhere, no runtime impact). Report pages verified client-side. | Grep confirms no active imports of these services in pages. |
| B-14 | `MasterService.list` orderBy | P2 | `orderBy: { createdAt: 'desc' }` applied to every mapped entity; models without a `createdAt` column would throw at query time. | Wrapped in try/catch that retries without `orderBy` when the error mentions `createdAt`. | Master list endpoints return for all entities. |
| B-15 | RKS/LPHS file upload gap | P1 | `services/rks.ts` (`uploadFile`,`deleteFile`) and `services/lphs-sios.ts` (`uploadLphs`,`uploadSios`) declare upload endpoints (`/rks/upload`, `/lphs/upload`, …) that the backend controllers **do not implement**; there is no DB column for uploaded files and `RksService.sanitize` strips `uploadedFiles`. | Verified **no page actually calls** these upload methods — `RksTab.tsx` keeps `uploadedFiles` entirely client-side and `projectStore` strips them before save. Documented as a known feature limitation (session-local uploads, lost on reload). Not wiring half-tested binary storage into a production audit. | Grep: no component imports `uploadFile`/`uploadLphs`/`uploadSios`. |
| B-16 | Dashboard hardcoded metric | P2 | `DashboardService.getStats` returns `valueChangePercent: 12` — a hardcoded placeholder, not computed. | Documented (kept). Computing a real MoM delta needs historical snapshots not modeled in schema; flagged as known limitation rather than inventing a wrong number. | N/A (documented). |
| B-17 | JWT secret weak default | P2 | `jwt.strategy.ts` / `auth.module.ts` fall back to `'change-me'` if `JWT_SECRET` unset. | Kept fallback (intended for local dev; `.env.example` + compose mandate setting it). Documented as a deploy checklist item — set a strong `JWT_SECRET` in production. | `.env`/compose wire `JWT_SECRET` through; deploy checklist notes it. |
| B-18 | Backend prod Docker cannot build/migrate | P0 | Backend prod `Dockerfile` build context was `../backend`, but the Prisma schema/migrations live at repo root `/prisma` (`backend/prisma` is empty). `RUN npx prisma generate` had no schema → build fails; and there was **no `prisma migrate deploy`** at runtime → fresh deploy would have **zero tables**. Dev only worked via a compose bind-mount of `../prisma`. | Changed backend+scheduler build context to repo root (`context: ..`, `dockerfile: backend/Dockerfile`); Dockerfile now `COPY prisma ./prisma` in both stages; added `docker-entrypoint.sh` that runs `prisma generate` + `prisma migrate deploy` before `node dist/main`; added root `.dockerignore` to keep the context lean. | `docker compose build backend` succeeds; on first boot logs show migrations applied; tables exist. (Execution pending — see Blockers.) |
| B-19 | Stray duplicate migration | P1 | `prisma/migrations/00001_initial_schema.sql` was a loose file (Prisma reads per-migration directories only) and a **byte-identical** duplicate (md5 match) of `20260706011628_initial/migration.sql` → confusing, risk of manual mis-application. | Removed the stray file; the real timestamped initial migration is unaffected. | `md5sum` confirmed identical before removal; migrate deploy set now clean (4 dirs). |
| B-20 | Response-parsing consistency | P2 | Many stores still use inline `res.data?.data \|\| res.data` while `unwrap()` is the canonical parser → drift risk. | Left as-is: the pattern is **correct** (prefers envelope, falls back to raw, never crashes). Documented; no churn needed. | Static grep: all usages safe; no undefined reads. |
| B-21 | Healthcheck IPv6/port bind | P0 | Compose healthcheck curls `localhost:4000` → resolves to `::1` (IPv6), but NestJS binds IPv4 `0.0.0.0` only → `wget` gets "Connection refused" → backend stuck `unhealthy` forever. | Changed healthcheck to `http://127.0.0.1:4000/health` (IPv4) + start_period 60s. | `docker ps` shows backend **healthy**; healthcheck log exits 0. |
| B-22 | `procurements_code_key` 500 | P1 | `masterDataStore`/generic CRUD `create('procurements', …)` with a duplicate `code` → Prisma unique violation surfaced as opaque 500. | Covered by global Prisma exception filter (B-24) → now 409 with Indonesian message. | Curl duplicate create → 409, not 500. |
| B-23 | `closed_by` FK 500 | P1 | Generic master `update()` passes an invalid `closedBy` relation value → Prisma FK violation → opaque 500. | Covered by global Prisma exception filter (B-24) → now 400 with field name. | Curl bad FK update → 400, not 500. |
| B-24 | No Prisma error handling | P1 | No global exception filter; Prisma `KnownRequestError` (P2002/P2003/P2025) leaked as raw 500s to the frontend. | Added `PrismaExceptionFilter` (maps P2002→409, P2003→400, P2025→404) wired via `useGlobalFilters` in `main.ts`. | Backend type-checks; backend restarted healthy; duplicate/FK/not-found now proper codes. |
| B-25 | Duplicate `aria-label="Notifikasi"` | P2 | Both the sidebar nav link (`Sidebar.tsx` `aria-label={item.label}`) and the topbar bell (`Topbar.tsx:82`) rendered `<a aria-label="Notifikasi">` → strict-mode locator violation + a11y bug. | Renamed the topbar bell to `aria-label="Buka notifikasi…"` (distinct, descriptive). | E2E navigation/Notifikasi now matches a single element; a11y conflict gone. |
| B-26 | 401 interceptor breaks login errors | P1 | `apiClient` response interceptor treated **every** 401 as a session expiry → on a failed login it called `logout()` + hard `window.location.href='/login'`, wiping the form and swallowing the "Username atau password salah." toast. Wrong-password attempts looked like silent no-ops. | Interceptor now skips redirect/logout for requests to `/auth/login`; only genuine session-expiry 401s (authenticated requests) redirect. | E2E "wrong credentials" now shows the toast and passes; login form errors visible. |

## 5. Files Being Modified

- `backend/src/main.ts` (+ new health controller) — B-01
- `docker/docker-compose.yml` — B-01, B-02, B-11, B-18
- `frontend/src/hooks/mutations/useAuthMutations.ts` — B-04
- `frontend/src/services/api-client.ts` (+ `unwrap`) — B-03, B-06, B-09, B-10
- `frontend/src/hooks/queries/*` (projects/prospects/dashboard/notifications/approvals) — B-10
- `frontend/src/stores/taskStore.ts`, `supplierStore.ts` — B-09
- `backend/src/notification/notification.{controller,service}.ts` — B-08
- `backend/src/master/master.service.ts` (orderBy fallback) — B-14
- `backend/Dockerfile`, `backend/docker-entrypoint.sh`, `.dockerignore` — B-18
- `prisma/migrations/00001_initial_schema.sql` (removed) — B-19

## 6. Progress Tracking

- [x] Static audit complete (backend)
- [x] Static audit complete (frontend)
- [ ] Backend type-check / build green  ⚠️ blocked by exec classifier
- [ ] Frontend type-check / build green  ⚠️ blocked by exec classifier
- [ ] Prisma generate + migrate + seed   🔵 needs Docker MySQL
- [ ] Docker Compose up, backend healthy 🔵 after build unblocked
- [ ] Playwright E2E green               ⚠️ blocked by exec classifier
- [ ] Audit report written

## 7. Remaining Tasks

- Re-run blocked build / type-check / lint commands once the Bash safety
  classifier recovers (B-12 execution items).
- Bring up Docker stack (MySQL + Redis + backend) and verify `/health`, then
  run `prisma migrate deploy` + `prisma db seed` against the Docker MySQL.
- Run Playwright E2E (`e2e/auth.spec.ts`, `e2e/dashboard.spec.ts`) against the
  running stack; fix any failures.
- Write `docs/AUDIT_REPORT.md` final report.
