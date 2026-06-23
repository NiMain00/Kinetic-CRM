# Phase 2.3 — Frontend API Service Layer

> **Status:** Ready to implement
> **Risk:** Medium — service layer changes the data architecture from mock to real
> **Estimated effort:** 2-3 days
> **Dependencies:** Phase 2.1 (Auth) ✅ done, Phase 2.2 (Prisma schema) ✅ done

---

## Overview

Implement the 10 remaining empty frontend service stubs so every page has a real HTTP client ready to call backend endpoints. Each service follows the exact same pattern established by the 3 implemented services (`auth.ts`, `prospects.ts`, `projects.ts`).

**Note:** The backend routes are currently empty stubs. The frontend services define the API contract that backend routes will implement in Phase 3.2. This is intentional — frontend and backend can be developed in parallel.

---

## Canonical Service Pattern

Every service follows this template (from `auth.ts`, `prospects.ts`, `projects.ts`):

```typescript
import apiClient from './api-client';

export const <serviceName> = {
  list: (params?: unknown) => apiClient.get('/<endpoint>', { params }),
  get: (id: string) => apiClient.get(`/<endpoint>/${id}`),
  create: (data: unknown) => apiClient.post('/<endpoint>', data),
  update: (id: string, data: unknown) => apiClient.put(`/<endpoint>/${id}`, data),
  delete: (id: string) => apiClient.delete(`/<endpoint>/${id}`),
};
```

**Rules:**
- All imports: `import apiClient from './api-client';`
- All exports: `export const <name>Service = { ... };` (object literal, not class)
- No return type annotations (Axios `Promise<AxiosResponse<...>>` is implicit)
- ID params: `string` type
- Request bodies: `unknown` type
- Query params: `params?: unknown`

---

## Files to Implement (10 files)

### 1. `frontend/src/services/approvals.ts`

**Export:** `approvalService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `list` | GET | `/approvals` | `{ status?, resourceType?, page?, perPage? }` | — |
| `get` | GET | `/approvals/:id` | — | — |
| `decide` | POST | `/approvals/:id/decide` | — | `{ decision: 'approved'\|'rejected', comment? }` |
| `reassign` | POST | `/approvals/:id/reassign` | — | `{ newAssigneeUserId, reason }` |

**Page consumer:** `ApprovalInboxPage.tsx` imports `INITIAL_APPROVALS`

---

### 2. `frontend/src/services/dashboard.ts`

**Export:** `dashboardService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `getSummary` | GET | `/dashboard/summary` | `{ periodMonth?, periodYear? }` | — |
| `getPendingApprovals` | GET | `/dashboard/approvals-pending` | — | — |
| `getApproachingDeadline` | GET | `/dashboard/approaching-deadline` | — | — |

**Page consumer:** `DashboardPage.tsx` imports `INITIAL_APPROVALS` (hardcoded stats)

---

### 3. `frontend/src/services/users.ts`

**Export:** `userService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `list` | GET | `/users` | `{ search?, role?, branchId?, isActive?, page?, perPage? }` | — |
| `get` | GET | `/users/:id` | — | — |
| `create` | POST | `/users` | — | `{ name, username, email, password, role, branchId?, departmentId? }` |
| `update` | PATCH | `/users/:id` | — | `{ name?, email?, role?, branchId?, departmentId?, isActive? }` |
| `deactivate` | DELETE | `/users/:id` | — | — |
| `resetPassword` | POST | `/users/:id/reset-password` | — | `{ newPassword? }` |
| `lock` | POST | `/users/:id/lock` | — | — |
| `unlock` | POST | `/users/:id/unlock` | — | — |

**Page consumers:** `UsersPage.tsx`, `UserDetailPage.tsx`, `UserFormPage.tsx` (all inline mock)

---

### 4. `frontend/src/services/master-data.ts`

**Export:** `masterDataService`

Generic CRUD for 15 master data resources. Uses a factory pattern to avoid repeating code:

```typescript
function createMasterCrud(resource: string) {
  return {
    list: (params?: unknown) => apiClient.get(`/master/${resource}`, { params }),
    get: (id: string) => apiClient.get(`/master/${resource}/${id}`),
    create: (data: unknown) => apiClient.post(`/master/${resource}`, data),
    update: (id: string, data: unknown) => apiClient.patch(`/master/${resource}/${id}`, data),
    delete: (id: string) => apiClient.delete(`/master/${resource}/${id}`),
  };
}

export const masterDataService = {
  customers: createMasterCrud('customers'),
  industries: createMasterCrud('industries'),
  categories: createMasterCrud('categories'),
  competitors: createMasterCrud('competitors'),
  statuses: createMasterCrud('statuses'),
  docTypes: createMasterCrud('document-types'),
  questions: createMasterCrud('questions'),
  questionTypes: createMasterCrud('question-types'),
  periods: createMasterCrud('periods'),
  holidays: createMasterCrud('holidays'),
  lossReasons: createMasterCrud('loss-reasons'),
  approvalLevels: createMasterCrud('approval-levels'),
  departments: createMasterCrud('departments'),
  companies: createMasterCrud('companies'),
  branches: createMasterCrud('branches'),
};
```

**Page consumers:** `MasterDataPage.tsx`, `MasterCustomerPage.tsx`, `MasterCompetitorPage.tsx`, `MasterHolidayPage.tsx`, `MasterDocTypePage.tsx`, `MasterCategoryPage.tsx`, `MasterPeriodPage.tsx`, `MasterLossReasonPage.tsx`, `MasterQuestionPage.tsx`

---

### 5. `frontend/src/services/config.ts`

**Export:** `configService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `getOrganization` | GET | `/config/organization` | — | — |
| `updateOrganization` | PUT | `/config/organization` | — | Full org structure |
| `getWorkflow` | GET | `/config/workflow` | — | — |
| `updateWorkflow` | PUT | `/config/workflow` | — | Workflow stages array |
| `getSla` | GET | `/config/sla` | — | — |
| `updateSla` | PUT | `/config/sla` | — | SLA config |
| `getNotificationTemplates` | GET | `/config/notifications` | — | — |
| `updateNotificationTemplate` | PUT | `/config/notifications/:eventCode` | — | Template config |
| `getQuestionTypes` | GET | `/config/question-types` | — | — |
| `createQuestionType` | POST | `/config/question-types` | — | `{ code, label, options? }` |
| `getUploadPolicy` | GET | `/config/upload-policy` | — | — |
| `updateUploadPolicy` | PUT | `/config/upload-policy/:code` | — | Policy config |
| `getIntegrations` | GET | `/config/integrations` | — | — |
| `updateIntegration` | PUT | `/config/integrations/:key` | — | `{ value }` |
| `getRoles` | GET | `/config/roles` | — | — |
| `createRole` | POST | `/config/roles` | — | `{ code, name, description? }` |
| `updateRole` | PATCH | `/config/roles/:id` | — | `{ name?, description? }` |
| `getRolePermissions` | GET | `/config/roles/:id/permissions` | — | — |
| `updateRolePermissions` | PUT | `/config/roles/:id/permissions` | — | `{ permissions: string[] }` |
| `getPermissions` | GET | `/config/permissions` | — | — |

**Page consumers:** `ConfigOrgPage.tsx`, `ConfigWorkflowPage.tsx`, `ConfigSlaPage.tsx`, `ConfigNotifTemplatePage.tsx`, `ConfigQuestionTypesPage.tsx`, `ConfigUploadPage.tsx`, `ConfigIntegrationPage.tsx`, `ConfigRolesPage.tsx`, `ConfigTargetsPage.tsx`

---

### 6. `frontend/src/services/reports.ts`

**Export:** `reportService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `getWinLoss` | GET | `/reports/win-loss` | `{ periodId?, branchId?, categoryId? }` | — |
| `getPipeline` | GET | `/reports/pipeline` | — | — |
| `getProgressVsTarget` | GET | `/reports/progress-vs-target` | — | — |
| `export` | POST | `/reports/:reportType/export` | — | `{ format: 'xlsx'\|'pdf', filters? }` |

**Page consumers:** `ReportsPage.tsx`, `WinLossReportPage.tsx`, `PipelineReportPage.tsx`, `KPIReportPage.tsx`

---

### 7. `frontend/src/services/notifications.ts`

**Export:** `notificationService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `list` | GET | `/notifications` | `{ isRead?, page?, perPage? }` | — |
| `markRead` | POST | `/notifications/:id/mark-read` | — | — |
| `markAllRead` | POST | `/notifications/mark-all-read` | — | — |

**Page consumer:** `NotificationsPage.tsx` (inline mock)

---

### 8. `frontend/src/services/rks.ts`

**Export:** `rksService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `getByProject` | GET | `/projects/:projectId/rks` | — | — |
| `create` | POST | `/projects/:projectId/rks` | — | `{ content, attachmentIds? }` |
| `update` | PATCH | `/rks/:id` | — | Partial update fields |
| `submit` | POST | `/rks/:id/submit` | — | — |
| `approve` | POST | `/rks/:id/approve` | — | `{ comment? }` |
| `reject` | POST | `/rks/:id/reject` | — | `{ comment }` |

**Page consumer:** `ProjectDetailPage.tsx` → `RksTab.tsx` (inline mock)

---

### 9. `frontend/src/services/lphs-sios.ts`

**Export:** `lphsSiosService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `getByProject` | GET | `/projects/:projectId/lphs-sios` | — | — |
| `create` | POST | `/projects/:projectId/lphs-sios` | — | `{ departmentIds, attachmentIds? }` |
| `submit` | POST | `/lphs-sios/:id/submit` | — | — |
| `departmentApprove` | POST | `/lphs-sios/:id/departments/:deptId/approve` | — | `{ comment? }` |
| `departmentReject` | POST | `/lphs-sios/:id/departments/:deptId/reject` | — | `{ comment }` |
| `pmApprove` | POST | `/lphs-sios/:id/pm-approve` | — | — |
| `departmentRevise` | POST | `/lphs-sios/:id/departments/:deptId/revise` | — | `{ attachmentIds, note? }` |

**Page consumer:** `ProjectDetailPage.tsx` → `LphsSiosTab.tsx` (inline mock)

---

### 10. `frontend/src/services/ai.ts`

**Export:** `aiService`

| Method | HTTP | Endpoint | Params | Body |
|--------|------|----------|--------|------|
| `tenderSummary` | POST | `/ai/tender-summary` | — | `{ projectId, documentType }` |
| `prospectAnalysis` | POST | `/ai/prospect-analysis` | — | `{ prospectId }` |
| `competitorAnalysis` | POST | `/ai/competitor-analysis` | — | `{ competitorId }` |
| `kpiInsight` | POST | `/ai/kpi-insight` | — | `{ branchId?, periodId }` |
| `executiveSummary` | POST | `/ai/executive-summary` | — | `{ periodMonth, periodYear }` |
| `smartSearch` | GET | `/ai/smart-search` | `{ query, scope? }` | — |

**Page consumers:** Dashboard, Prospect Detail, RKS Tab, LPHS Tab, KPI Dashboard, Global Search

---

## Bonus: Expand `auth.ts`

Current: `login`, `logout`, `me` (3 methods). Add:

| Method | HTTP | Endpoint | Body |
|--------|------|----------|------|
| `refresh` | POST | `/auth/refresh` | `{ refreshToken }` |
| `changePassword` | POST | `/auth/change-password` | `{ currentPassword, newPassword }` |

---

## Files NOT Modified

| File | Reason |
|------|--------|
| `api-client.ts` | Already updated in Phase 2.1 |
| `prospects.ts` | Already implemented (5 methods) |
| `projects.ts` | Already implemented (4 methods) |
| `mock-data.ts` | Kept as fallback; deprecated but not deleted |

---

## Implementation Order

| Order | File | Methods | Est. Lines |
|:-----:|------|:-------:|:----------:|
| 1 | `auth.ts` (expand) | +2 | ~15 |
| 2 | `notifications.ts` | 3 | ~15 |
| 3 | `dashboard.ts` | 3 | ~15 |
| 4 | `users.ts` | 8 | ~40 |
| 5 | `reports.ts` | 4 | ~25 |
| 6 | `approvals.ts` | 4 | ~25 |
| 7 | `rks.ts` | 6 | ~35 |
| 8 | `lphs-sios.ts` | 7 | ~45 |
| 9 | `ai.ts` | 6 | ~35 |
| 10 | `master-data.ts` | 15 CRUDs | ~50 |
| 11 | `config.ts` | 20 | ~100 |
| **Total** | | **76 methods** | **~400 lines** |

---

## Post-Implementation Verification

```bash
cd frontend
npx tsc --noEmit
```

All services should compile with zero type errors. The services are pure HTTP clients — no business logic, no state management. They are called by React Query hooks (Phase 2.4) which are called by feature pages (Phase 3.6).

---

## What This Enables

After Phase 2.3, the frontend has:
- A complete HTTP client layer for all 96 API endpoints
- Every service method returns `Promise<AxiosResponse<T>>` ready for React Query
- The API contract is defined and can be validated against backend implementations

**Next step:** Phase 2.4 (React Query Hooks) — wire these services into `useQuery`/`useMutation` hooks.
