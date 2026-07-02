# RBAC Implementation — Kinetic CRM (Frontend Only)

**Date:** 2026-07-02
**Status:** Draft
**Reference:** [docs/research-rbac-architecture.md](../../research-rbac-architecture.md)
**Version:** 1.0

---

## 1. Ringkasan

Implementasi arsitektur RBAC berbasis domain-scoped roles pada Kinetic CRM frontend-only. Semua data in-memory dengan Zustand stores + persist (localStorage). Tidak ada backend.

Arsitektur mengacu pada dokumen riset RBAC v2.1, dengan domain-scoped RBAC + additive multi-role + stage-based access + director bypass.

---

## 2. Domain Types (`types/domain/index.ts`)

### Prospect — tambah field optional

```typescript
departmentId?: string;
currentStageId?: string;
ownerUserId?: string;
```

### Project — tambah field optional

```typescript
departmentId?: string;
currentStageId?: string;
ownerUserId?: string;
scopeDepartments?: string[];
```

### ProjectMember — type baru

```typescript
interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
  roleName?: string;
  userName?: string;
  departmentName?: string;
}
```

---

## 3. RBAC Store (`stores/rbacStore.ts`)

Store baru dengan persist key `kinetic-rbac`. Data structures:

### RbacDepartment

```typescript
interface RbacDepartment {
  id: string;
  code: string;        // IT, HC, FINANCE, PROCUREMENT, MARKETING, PM
  name: string;
  description?: string;
  is_active: boolean;
}
```

### RbacRole

```typescript
interface RbacRole {
  id: string;
  name: string;        // staff, manager, admin, director, project_viewer, project_contributor, project_manager
  description?: string;
  is_system: boolean;
}
```

### RbacPermission

```typescript
interface RbacPermission {
  id: string;
  code: string;        // prospect:read, project:write, pengadaan:create
  name: string;
  module: string;      // dashboard, prospect, project, pengadaan, report, notification, profile
  description?: string;
}
```

### RbacUserRole

```typescript
interface RbacUserRole {
  id: string;
  userId: string;
  roleId: string;
  scopeType: 'global' | 'department' | 'project';
  scopeId?: string;
  assignedBy?: string;
  expiresAt?: string | null;
}
```

### RbacRolePermission

```typescript
interface RbacRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  scopeType?: 'global' | 'department' | 'project';
  scopeId?: string;
  stageId?: string;
  accessLevel: 'read' | 'write';
}
```

### WorkflowStage

```typescript
interface WorkflowStage {
  id: string;
  code: string;        // prospecting, waiting_pm, in_project, pengadaan, delivery
  name: string;
  module: string;      // prospect, project, pengadaan
  sequence: number;
  ownerDepartmentCode: string;
}
```

### ProjectScope data (dalam store yang sama)

```typescript
interface ProjectDepartment {
  id: string;
  projectId: string;
  departmentId: string;
}

interface ProjectMemberRecord {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
}
```

### Seed Data

#### Departments (6)

| code | name |
|------|------|
| IT | Information Technology |
| HC | Human Capital |
| FINANCE | Finance |
| PROCUREMENT | Procurement |
| MARKETING | Marketing |
| PM | Project Management |

#### Roles (7)

| name | description | is_system |
|------|------------|-----------|
| staff | Staff department — akses operasional dasar | true |
| manager | Manager department — approve & monitor | true |
| admin | Admin department — full control | true |
| director | Bisa lihat semua department | true |
| project_viewer | View-only di scope project | true |
| project_contributor | Create/edit data di scope project | true |
| project_manager | Manage project scope & members | true |

#### Workflow Stages (5)

| code | name | module | sequence | owner_department_code |
|------|------|--------|----------|----------------------|
| prospecting | Prospecting | prospect | 1 | marketing |
| waiting_pm | Waiting PM | prospect | 2 | pm |
| in_project | In Project | project | 3 | pm |
| pengadaan | Pengadaan | pengadaan | 4 | procurement |
| delivery | Delivery | project | 5 | pm |

#### Permissions (16)

| code | module |
|------|--------|
| dashboard:view | dashboard |
| notification:read | notification |
| profile:manage | profile |
| prospect:read | prospect |
| prospect:write:prospecting | prospect |
| prospect:approve:transition | prospect |
| project:read | project |
| project:create | project |
| project:write | project |
| project:manage:members | project |
| project:manage:scope | project |
| pengadaan:read | pengadaan |
| pengadaan:create | pengadaan |
| pengadaan:write | pengadaan |
| report:view:department | report |
| report:view:crossdept | report |

#### Role-Permission Mapping

**Staff (default department scope):**
- dashboard:view (global), notification:read (global), profile:manage (global)
- prospect:read (department), project:read (department), pengadaan:read (department)

**Staff Marketing (tambah di atas):**
- prospect:write:prospecting (department)

**Manager (tambah di atas staff):**
- project:create (department), project:write (department)
- project:manage:members (department), report:view:department (department)

**Admin:** inherit staff + manager permissions (full department scope)

**Director (global bypass):**
- prospect:read (global), project:read (global), pengadaan:read (global)
- report:view:crossdept (global)

**project_viewer:**
- project:read (project scope)

**project_contributor:**
- project:read, project:write (project scope)

**project_manager:**
- project:read, project:write, project:manage:members, project:manage:scope (project scope)

#### User-Role Assignments (seed untuk 10 user existing)

| userId | user | role | scopeType | scopeId |
|--------|------|------|-----------|---------|
| 1 | Ahmad (Cabang Jakarta) | staff | department | MARKETING |
| 2 | Bambang (PM) | manager | department | PM |
| 3 | Rina (Operations) | staff | department | PROCUREMENT |
| 4 | Doni (Admin) | admin | department | IT |
| 5 | Siti (Cabang Bandung) | staff | department | MARKETING |
| 6 | Hendra (PM) | staff | department | PM |
| 7 | Dewi (Management) | director | global | — |
| 8 | Fajar (Reviewer) | staff | department | IT |
| 9 | Lestari (Staff) | staff | department | PROCUREMENT |
| 10 | Bagus (Branch Manager) | manager | department | MARKETING |

### Store Actions

```
// Departments
addDepartment(data) → void
updateDepartment(id, data) → void
deleteDepartment(id) → void

// Roles
addRole(data) → void
updateRole(id, data) → void
deleteRole(id) → void

// Permissions
addPermission(data) → void
updatePermission(id, data) → void
deletePermission(id) → void

// User Roles
assignUserRole(userId, roleId, scopeType, scopeId?) → void
removeUserRole(userRoleId) → void
getUserRoles(userId) → RbacUserRole[]
getUserDepartments(userId) → RbacDepartment[]

// Role Permissions
addRolePermission(roleId, permissionId, scopeType, scopeId?, stageId?) → void
removeRolePermission(rpId) → void
getRolePermissions(roleId, scopeType?, scopeId?) → RbacRolePermission[]

// Workflow Stages
addStage(data) → void
updateStage(id, data) → void
deleteStage(id) → void
getStagesByModule(module) → WorkflowStage[]

// Project Scope Management
addProjectDepartment(projectId, departmentId) → void
removeProjectDepartment(projectId, departmentId) → void
getProjectDepartments(projectId) → RbacDepartment[]

addProjectMember(projectId, userId, roleId, departmentId, assignedBy) → void
removeProjectMember(projectId, userId) → void
getProjectMembers(projectId) → ProjectMemberRecord[]
```

---

## 4. AuthorizationEngine (`services/authz.ts`)

Class synchronous yang membaca dari `useRbacStore.getState()`. Semua method sync.

```typescript
class AuthorizationEngine {
  hasPermission(userId: string, permissionCode: string, context?: {
    departmentId?: string;
    projectId?: string;
  }): boolean;

  getStageAccess(userId: string, currentStageCode: string, recordDepartmentId: string): 'none' | 'read' | 'write';

  checkDirectorBypass(userId: string, permissionCode: string): boolean;

  buildDepartmentFilter(userId: string, options?: {
    includeProjectAccess?: boolean;
    activeDepartmentId?: string;
  }): string[];

  getAccessibleDepartments(userId: string): RbacDepartment[];
}
```

### hasPermission — algoritma

1. Cek apakah permission adalah global (dashboard:view, notification:read, profile:manage) → return true
2. Cek director bypass → jika user punya role 'director' global + permission mapping → return true
3. Kumpulkan semua userRoles untuk userId yang masih valid (tidak expired)
4. Untuk setiap userRole, cek rolePermissions apakah ada mapping permission yang cocok
5. Cocokkan scopeType: global → langsung match; department → cocokkan context.departmentId atau scopeId; project → cocokkan context.projectId
6. Jika ada 1 match → return true
7. Tidak ada match → return false

### getStageAccess — algoritma

1. Dapatkan rule stage dari currentStageCode: { owner, prev }
2. Dapatkan department user dari authStore.activeDepartmentId
3. Cari department code dari rbacStore
4. Jika user department === owner → 'write'
5. Jika user department === prev → 'read'
6. Selain itu → 'none'

### checkDirectorBypass — algoritma

1. Cari userRoles userId yang roleId mengarah ke role 'director' dan scopeType = 'global'
2. Cek apakah role director punya rolePermission dengan permissionCode yang dimaksud
3. Jika ada → return true

---

## 5. AuthStore Update (`stores/authStore.ts`)

### Tambah field ke AuthUser

```typescript
interface AuthUser {
  // ... existing fields
  roleId?: string;          // role yang aktif
  scopeType?: string;       // 'department' | 'global'
  scopeId?: string;         // department ID jika scope_type='department'
  departmentId?: string;    // department primer user
  departmentCode?: string;
  departmentName?: string;
}
```

### Tambah state & actions

```typescript
interface AuthState {
  // ... existing state
  activeDepartmentId: string | null;
  
  // actions
  setActiveDepartment: (deptId: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  getAccessLevel: (stageCode: string, recordDeptId: string) => 'none' | 'read' | 'write';
}
```

---

## 6. Hook `useAuthz` (`hooks/useAuthz.ts`)

```typescript
function useAuthz() {
  // Baca user dari authStore
  const user = useAuthStore(s => s.user);
  const activeDeptId = useAuthStore(s => s.activeDepartmentId);
  // Baca RBAC data dari rbacStore
  const departments = useRbacStore(s => s.departments);
  const userRoles = useRbacStore(s => s.userRoles);
  // ... etc

  return {
    can: (permission: string) => boolean,
    stageAccess: (stageCode: string, recordDeptId: string) => 'none' | 'read' | 'write',
    isDirector: () => boolean,
    accessibleDepartments: () => RbacDepartment[],
  };
}
```

---

## 7. Project & Prospect Store Updates

### projectStore.ts — tambah actions

```typescript
updateProjectScope(id: string, scopeDepartments: string[]): void;
addProjectMember(projectId: string, member: Omit<ProjectMemberRecord, 'id'>): void;
removeProjectMember(projectId: string, userId: string): void;
getProjectMembers(projectId: string): ProjectMemberRecord[];
getProjectDepartments(projectId: string): string[];
updateProjectStage(id: string, stageId: string): void;
```

### prospectStore.ts — tambah actions

```typescript
updateProspectStage(id: string, stageId: string): void;
```

---

## 8. LoginPage — Department Selector

Flow after login:
1. Validasi credential (mock — existing flow)
2. Ambil accessibleDepartments dari rbacStore berdasarkan userId
3. Jika hanya 1 department → auto-select, redirect ke dashboard
4. Jika multiple departments → tampilkan modal/list department selector
5. User pilih department → set `activeDepartmentId`, `roleId`, `scopeType`, `scopeId` di authStore
6. Redirect ke dashboard

Sidebar: badge nama department di atas + dropdown switch department untuk user dengan akses >1 department.

---

## 9. Project Scope & Tim Tab

Tab baru di ProjectDetailPage, visible hanya untuk `project_manager` atau `manager`.

### Komponen: `ScopeTimTab`

**Section 1 — Department Terlibat**
- Tabel: kolom nama department
- Tombol "Tambah Departemen" → modal checklist department dari rbacStore
- Tombol "Hapus" per baris dengan konfirmasi

**Section 2 — Member per Department**
- Per department: card/list member dengan nama, role badge
- Tombol "Tambah Member" → modal pilih user (dari department terkait) + role (project_viewer / project_contributor)
- Tombol "Hapus Member" dengan konfirmasi

**Section 3 — Informasi Scope**
- Total departemen: X
- Total anggota: Y
- Status: Lengkap / Belum Lengkap (badge)

### Validasi
- Hanya bisa pilih user dari department yang terdaftar di scope
- Role terbatas ke `project_viewer`, `project_contributor`
- PM bisa manage scope kapan saja (paralel dengan input RKS)

---

## 10. Guards, Navigation & Sidebar

### routes/guards.tsx

- **PermissionRoute** — update untuk pakai `hasPermission()` dari authz
- **DepartmentRoute** — baru, cek apakah user punya akses ke department tertentu

### routes/nav-items.ts

Filter menu items berdasarkan permission user di department aktif:
- Prospek → `prospect:read`
- Proyek → `project:read`
- Pengadaan → `pengadaan:read`
- Scope tab → `project:manage:members`

### Sidebar

- Badge nama department aktif di bagian atas
- Dropdown switch department (untuk user dengan akses >1 department)
- Filter menu items berdasarkan permission

---

## 11. Mock Data Update (`services/mock-data.ts`)

INITIAL_PROJECTS: tambah `departmentId: 'PM'`, `currentStageId: 'in_project'`, `scopeDepartments: ['IT', 'FINANCE', 'PROCUREMENT']`.

INITIAL_PROSPECTS: tambah `departmentId: 'MARKETING'`, `currentStageId: 'prospecting'`, `ownerUserId` sesuai user seed.

---

## 12. Catatan Penting

1. **Backward compatible** — Semua field baru optional (`?`). Data existing tanpa field baru tetap jalan.
2. **Persist migration** — Setiap store yang berubah versi harus punya migrate function.
3. **Synchronous** — AuthorizationEngine tidak pakai async/await. Langsung baca dari `getState()`.
4. **Zero dependency baru** — Tidak perlu library external authorization.
5. **Fleksibel** — Nambah department baru cukup seed data, tidak perlu kode baru.
