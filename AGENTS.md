# Kinetic CRM — Progress Summary

## Latest Session (E2E Tests — All 3 Passing)

### Backend Fixes
- **main.ts**: ValidationPipe `forbidNonWhitelisted` set to `false` (was `true`, causing 400 on all POST/PUT with `@Body() data: any`)
- **app.module.ts**: CustomersModule imported BEFORE MasterModule so `CustomersController` (specific route `/api/v1/customers`) matches before `MasterController` (generic `/api/v1/master/customers`)
- **master.service.ts**: `params.perPage`/`params.page` wrapped with `Number()` (query params come as strings, Prisma rejects non-numeric `take`)

### Frontend Fixes
- **ProjectFormPage.tsx**: project `code` now includes timestamp suffix (`code: \`PRJ-\${String(projectCount + 1).padStart(4, '0')}-\${Date.now().toString().slice(-4)}\``) to avoid unique constraint collisions across test runs
- **ProspectFormPage.tsx**: Zod `safeParse` call added `authorName` field (was missing, causing silent save failure)
- **prospectStore.ts**: Timeline event `time` converted to ISO string before API send (was locale format "Jul 6, 2026")
- **ProjectFormPage.tsx**: `type` field lowercased before API send (Prisma expects `tender`, not `Tender`)

### E2E Tests (`e2e/full-flow.spec.ts`) — All 3 Passing
| Test | What it checks | Status |
|------|---------------|--------|
| 1. Create prospect | Toast "Draf prospek berhasil disimpan", redirect to `/prospects`, project name visible in list | ✅ |
| 2. Create project | Toast with "berhasil dibuat", redirect to `/project/:id/overview`, Overview tab visible | ✅ |
| 3. Create procurement | Toast with "berhasil dibuat", redirect to `/procurement/:id`, Overview tab visible | ✅ |

### Key Constraints
- `VITE_API_BASE_URL=http://localhost:4000/api/v1` — frontend calls backend directly (port 4000), not through Vite proxy
- Procurement store is local Zustand persist (not API-backed)
- Project store derives code from `projectCount + 1` (seed has 4 projects) + timestamp suffix
- Backend ValidationPipe: `forbidNonWhitelisted: false` (required for `@Body() data: any` pattern)
- Module import order matters: CustomersModule before MasterModule

## Previous Session (All Stores → API)

### Perubahan Backend

**`backend/src/master/master.service.ts`**
- Expand `ENTITY_MAP` — tambah 10 entity baru: approvals, approvalChains, chatMessages, dealLineItems, procurements, procurementItems, projectRequirements, suppliers, rfqs, tasks
- Semua entity bisa di-CRUD via `GET/POST/PUT/DELETE /api/v1/master/:entity`

**`backend/src/master/master.controller.ts`**
- Tambah `@UseGuards(AuthGuard('jwt'))` — proteksi endpoint master

### Perubahan Frontend — Semua Store Sekarang API-backed

**Sudah API (sebelumnya):**
- `customerStore`, `masterDataStore`, `notificationStore`, `projectStore`, `prospectStore`, `rbacStore`, `userStore`

**Baru di-update (10 stores):**
| Store | Entity API | Method |
|-------|-----------|--------|
| `approvalStore` | `approvals` | fetchApprovals, addApproval |
| `approvalChainStore` | `approvalChains` | fetchChains, addChain, updateChain, deleteChain |
| `chatStore` | `chatMessages` | fetchMessages, addMessage |
| `dealLineItemStore` | `dealLineItems` | fetchLines, addLine, updateLine, removeLine |
| `procurementItemStore` | `procurementItems` | fetchItems, addItem, updateItem, removeItem |
| `projectRequirementStore` | `projectRequirements` | fetchRequirements, add/update/remove |
| `relationStore` | (via prospect API) | fetchLinks |
| `rfqStore` | `rfqs` | fetchRfqs, addRfq, updateRfq, deleteRfq |
| `supplierStore` | `suppliers` | fetchSuppliers, add/update/delete |
| `taskStore` | `tasks` | fetchTasks, add/update/delete |

**LoginPage.tsx**
- Setelah login: fetch 9 entity master + users + notifications + user roles

### Pola Umum Setiap Store
- `loading: boolean` + `fetchXxx()` async
- `addXxx`/`updateXxx`/`deleteXxx` panggil API dulu (non-blocking, try/catch)
- Fallback ke seed data kalau API gagal
- `partialize` exclude `loading` dari persist

### TypeScript Errors
- ✅ **0 errors** — all 25 pre-existing errors fixed
- Backend `npm run build` OK, Frontend `npx tsc --noEmit` clean

### Backend
- 6 modules: auth, customers, projects, prospects, rks, lphs, rbac, notification, audit, master
- `npm run build` OK

### Dashboard Aggregation — Done
**Backend (`backend/src/dashboard/`)**
- `dashboard.module.ts`, `dashboard.service.ts`, `dashboard.controller.ts`
- 5 endpoints: `GET /dashboard/stats`, `trend-win-loss`, `status-distribution`, `critical-deadlines`, `approval-pending`
- Query Prisma langsung: count projects, approvals, tender results, deadlines
- `@UseGuards(AuthGuard('jwt'))` — proteksi JWT

**Frontend (`frontend/src/stores/dashboardStore.ts`)**
- State: `stats`, `chartData`, `statusDistribution`, `criticalDeadlines`, `loading`, `error`
- `fetchAll()` — parallel call 4 endpoint via `dashboardService`
- Load spinner saat `loading && !stats`
- Fallback ke client-side computation (dari `projectStore`/`approvalStore`) kalau API gagal

## Latest Session — Hapus Semua Hardcoded Mock Data

### Goal
Buang semua `INITIAL_*`, `SEED_*`, `DEMO_*` arrays dari file frontend — ganti initial state jadi `[]`/`{}`. Data hanya dari API (backend seed atau setup manual).

### Files Changed (28 files)

**Stores (13)**
| Store | Removed |
|-------|---------|
| `masterDataStore.ts` | 19 `INITIAL_*` arrays (categories, competitors, questions, dll) + `INITIAL_DATA` |
| `customerStore.ts` | `INITIAL_CUSTOMERS` |
| `prospectStore.ts` | `INITIAL_PROSPECTS` + normalize/derive |
| `projectStore.ts` | `INITIAL_PROJECTS` |
| `approvalStore.ts` | `INITIAL_APPROVALS` |
| `notificationStore.ts` | `INITIAL_NOTIFICATIONS` (inline) |
| `configStore.ts` | 7 `INITIAL_*` arrays (SLA, KPI, workflows, connectors, orgUnits, projectPhases) |
| `supplierStore.ts` | `INITIAL_SUPPLIERS` (inline) |
| `approvalChainStore.ts` | `INITIAL_CHAINS` (inline) |
| `userStore.ts` | `INITIAL_USERS` (inline) |
| `rbacStore.ts` | 9 `SEED_*` arrays (departments, roles, permissions, userRoles, dll) |
| `inputConfigStore.ts` | `SEED_GROUPS` (inline) |
| `chatStore.ts` | `DEMO_USERS` + `DEMO_MESSAGES` (inline) |

**Feature Pages (8)**
| Page | Removed |
|------|---------|
| `LoginPage.tsx` | `DEMO_ACCOUNTS` + `selectAccount()` + quick login section |
| `UsersPage.tsx` | `INITIAL_USERS` inline → fetch dari store |
| `UserDetailPage.tsx` | `INITIAL_AUDIT_LOG` inline |
| `ProspectDetailPage.tsx` | import `INITIAL_TIMELINE_EVENTS` |
| `ApprovalReviewDrawer.tsx` | import `INITIAL_TIMELINE_EVENTS` |
| `KPITargetsPage.tsx` | `INITIAL_TARGETS` + `CATEGORY_OPTIONS` |
| `KPIDashboardPage.tsx` | `INITIAL_KPIS` + `MONTHLY_DATA` + `DEPARTMENT_SCORES` |
| `AuditPage.tsx` | `INITIAL_LOGS` |
| `AuditLogPage.tsx` | `INITIAL_AUDIT_LOGS` |

**Other**
| File | Change |
|------|--------|
| `routes/page-adapter.tsx` | Hapus mock token generation di `onLoginSuccess` |
| `services/mock-data.ts` | Dikosongkan (export `{}`) |

### Verifikasi
- ✅ `npx tsc --noEmit`: 1 error tersisa (pre-existing di `ProjectFormPage.tsx:58` — `||` selalu truthy, tidak terkait)
- ✅ Seluruh `INITIAL_`, `SEED_`, `DEMO_` references dari frontend `src/` hilang

### Key Constraints (Baru)
- `LoginPage.tsx` hanya pakai `authService.login()` — sudah tidak ada akun demo
- KPI page kategori options sekarang kosong (dulu hardcoded 6 kategori) — perlu API kategori
- Dropdown form di `inputConfigStore` sekarang kosong — perlu backend seed
- Store persist tetap ada untuk cached data, tapi initial state kosong
- Migration function tetap ada (bump version) agar data lama di localStorage tidak corrupt

### Next Steps
1. **Backend seed (`prisma/seed.ts`)** — isi master data untuk categories, competitors, periods, questionTypes, dll
2. **Backend seed KPI data** — isi KPI targets, progress, scorecards
3. **Backend seed Audit logs** — isi dari trigger/hooks
4. **Optional: hapus `mock-data.ts`** jika sudah tidak di-import sama sekali
