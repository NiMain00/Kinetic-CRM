# Prompt Implementasi RBAC — Kinetic CRM (Frontend Only)

## Konteks

Implementasi arsitektur RBAC dari `docs/research-rbac-architecture.md` ke sistem saat ini. Sistem saat ini adalah **frontend-only** dengan Zustand stores + `persist` (localStorage). Tidak ada backend — semua data in-memory.

Keadaan saat ini:
- **Auth**: Login mock (cek username = password), token palsu, store di `authStore.ts`
- **Master Data**: 18 entity types di `masterDataStore.ts` (departments, users, roles, dll)
- **Projects**: `projectStore.ts` — 4 proyek mock, tab RKS/LPHS/Harga/Kompetitor/Dokumen/Timeline
- **Prospects**: `prospectStore.ts` — 8 prospek mock, approval flow
- **Procurement**: `procurementStore.ts` + store sendiri
- **Routes**: `router.tsx` dengan PermissionRoute guard (cek dari `masterDataStore.roles`)
- **Types**: `types/domain/index.ts` — `Project`, `Prospect`, dll

## Yang Perlu Diubah/Ditambahkan

### 1. Domain Types — Update di `types/domain/index.ts`

Tambah field berikut ke **Prospect**:
```ts
departmentId?: string;
currentStageId?: string;
ownerUserId?: string;
```

Tambah field berikut ke **Project**:
```ts
departmentId?: string;
currentStageId?: string;
ownerUserId?: string;
scopeDepartments?: string[];         // daftar department IDs yang terlibat
```

### 2. RBAC Store — File Baru `stores/rbacStore.ts`

Buat store baru dengan persist key `kinetic-rbac` yang handle:

**A. Data Structures:**
- `departments: RbacDepartment[]` — kode, nama, deskripsi, is_active
- `roles: RbacRole[]` — name (staff/manager/admin/director/project_viewer/project_contributor/project_manager), description, is_system
- `permissions: RbacPermission[]` — code (contoh: `prospect:read`, `project:write`, `pengadaan:create`), name, module
- `userRoles: RbacUserRole[]` — userId, roleId, scopeType (global/department/project), scopeId, assignedBy, expiresAt
- `rolePermissions: RbacRolePermission[]` — roleId, permissionId, scopeType, scopeId, stageId, accessLevel
- `workflowStages: WorkflowStage[]` — code, name, module, sequence, ownerDepartmentCode

**B. Seed Data (sama persis dengan research doc section 9.3):**

Departments (6):
- IT, HC, FINANCE, PROCUREMENT, MARKETING, PM

Roles (7):
- staff, manager, admin, director, project_viewer, project_contributor, project_manager

Workflow Stages (5-6):
- prospecting (owner: marketing), supervisor_review (opsional), waiting_pm (owner: pm), in_project (owner: pm), pengadaan (owner: procurement), delivery (owner: pm)

Permissions:
- Global: dashboard:view, notification:read, profile:manage
- Prospect: prospect:read, prospect:write:prospecting, prospect:approve:transition
- Project: project:read, project:create, project:write, project:manage:members, project:manage:scope
- Pengadaan: pengadaan:read, pengadaan:create, pengadaan:write
- Report: report:view:department, report:view:crossdept

Role-Permission Mapping (sama persis dengan research doc):
- Staff: dashboard:view, notification:read, profile:manage (global) + prospect:read, project:read, pengadaan:read (department)
- Staff Marketing tambah: prospect:write:prospecting (department)
- Manager tambah: project:create, project:write, project:manage:members, report:view:department
- Admin: semua di scope department
- Director: bypass global — prospect:read, project:read, pengadaan:read, report:view:crossdept (global)

User-Role Assignments (seed untuk 10 user existing):
- User '1' (Ahmad, Cabang Jakarta) → staff di scope_id Marketing
- User '2' (Bambang, PM) → manager di scope_id PM
- User '3' (Rina, Operations) → staff di scope_id Procurement
- User '4' (Doni, Admin) → admin di scope_id IT
- User '5' (Siti, Cabang Bandung) → staff di scope_id Marketing
- User '6' (Hendra, PM) → staff di scope_id PM
- User '7' (Dewi, Management) → director global
- User '8' (Fajar, Reviewer) → staff di scope_id IT
- User '9' (Lestari, Staff) → staff di scope_id Procurement
- User '10' (Bagus, Branch Manager) → manager di scope_id Marketing

**C. Store Actions:**
```ts
// Departments
addDepartment, updateDepartment, deleteDepartment

// Roles
addRole, updateRole, deleteRole

// Permissions
addPermission, updatePermission, deletePermission

// User Roles
assignUserRole(userId, roleId, scopeType, scopeId)
removeUserRole(userRoleId)
getUserRoles(userId) → returns all roles for a user
getUserDepartments(userId) → returns departments user can access

// Role Permissions
addRolePermission(roleId, permissionId, scopeType, scopeId, stageId?)
removeRolePermission(rpId)
getRolePermissions(roleId, scopeType, scopeId?)

// Workflow Stages
addStage, updateStage, deleteStage
getStagesByModule(module) → filter by module ('prospect'|'project'|'pengadaan')

// Project Scope Management
addProjectDepartment(projectId, departmentId)
removeProjectDepartment(projectId, departmentId)
getProjectDepartments(projectId) → departments involved in project

addProjectMember(projectId, userId, roleId, departmentId, assignedBy)
removeProjectMember(projectId, userId)
getProjectMembers(projectId) → members of a project
```

### 3. AuthorizationEngine — File Baru `services/authz.ts`

Implement class `AuthorizationEngine` (reference: research doc section 10.1):

Method yang harus ada:
```ts
class AuthorizationEngine {
  // Core check
  async hasPermission(userId: string, permissionCode: string, context?: {
    departmentId?: string;
    projectId?: string;
  }): Promise<boolean>

  // Stage-based access — research doc section 5.3
  async getStageAccess(userId: string, currentStageCode: string, recordDepartmentId: string): Promise<'none' | 'read' | 'write'>

  // Director bypass — research doc section 7.4
  async checkDirectorBypass(userId: string, permissionCode: string): Promise<boolean>

  // Department filter builder — research doc section 11
  buildDepartmentFilter(userId: string, options?: {
    includeProjectAccess?: boolean;
    activeDepartmentId?: string;
  }): { query: string; params: any[] }

  // Get accessible departments for a user
  getAccessibleDepartments(userId: string): string[]
}
```

Karena ini frontend-only, semua method synchronous aja (jangan async). Langsung baca dari `useRbacStore.getState()`.

### 4. AuthStore — Update `stores/authStore.ts`

Tambah:
```ts
interface AuthUser {
  // ... existing fields
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  roleName?: string;       // existing
  roleId?: string;         // NEW — role yang aktif
  scopeType?: string;      // NEW — 'department' | 'global'
  scopeId?: string;        // NEW — department ID jika scope_type='department'
}

interface AuthState {
  // ... existing
  activeDepartmentId: string | null;
  setActiveDepartment: (deptId: string) => void;
  hasPermission: (permissionCode: string) => boolean;   // convenience
  getAccessLevel: (stageCode: string, recordDeptId: string) => 'none' | 'read' | 'write';
}
```

### 5. Hook useAuthz — File Baru `hooks/useAuthz.ts`

```ts
// Convenience hook wrapping AuthorizationEngine
function useAuthz() {
  return {
    can: (permission: string) => boolean,
    stageAccess: (stageCode: string, recordDeptId: string) => 'none'|'read'|'write',
    isDirector: () => boolean,
    accessibleDepartments: () => RbacDepartment[],
  }
}
```

### 6. ProjectStore — Update

Tambah actions:
```ts
// Scope management
updateProjectScope(id: string, scopeDepartments: string[])
addProjectMember(projectId: string, member: ProjectMember)
removeProjectMember(projectId: string, userId: string)
getProjectMembers(projectId: string): ProjectMember[]
getProjectDepartments(projectId: string): string[]

// Stage management
updateProjectStage(id: string, stageId: string)
```

### 7. ProspectStore — Update

Tambah actions:
```ts
updateProspectStage(id: string, stageId: string)
```

### 8. LoginPage — Update

Tambahkan **department selector** setelah login berhasil:
- Munculkan dropdown/list departemen yang bisa diakses user (dari `userRoles` di rbacStore)
- User pilih department aktif
- Set `activeDepartmentId` di authStore
- Setelah itu redirect ke dashboard

Simpan juga role yang aktif sesuai department yang dipilih.

### 9. Project Scope Page/Tab — Halaman Baru

Buat halaman/tab untuk PM mengatur scope proyek:

**Akses:** Hanya `project_manager` atau `manager` yang bisa akses.

**Fitur:**
1. **Daftar Departemen Terlibat** (project scope)
   - Tabel/list department yang sudah ditambahkan ke proyek
   - Tombol "Tambah Departemen" — modal pilih dari daftar department
   - Tombol "Hapus" untuk remove department dari scope
   - Validasi: cuma department yang terdaftar di `project_departments` yang bisa diassign member

2. **Manajemen Member per Departemen**
   - Per department: list user dari department itu yang jadi member proyek
   - Tombol "Tambah Member" — pilih user + role (project_viewer / project_contributor)
   - Tombol "Hapus Member"
   - Role member: `project_viewer` (read-only), `project_contributor` (read+write dalam scope proyek)

3. **Informasi Scope**
   - Total departemen terlibat: X
   - Total anggota: Y
   - Status scope: `Lengkap` / `Belum Lengkap` (indikator)

**UI/UX:**
- Bisa sebagai tab baru di `ProjectDetailPage` (misal tab "Scope & Tim")
- Atau halaman terpisah `/project/:id/scope`
- Gunakan komponen existing (Table, Modal, Select, Button, Badge)

**Integrasi:**
- PM bisa atur scope proyek **kapan saja** — tidak harus sebelum RKS
- Cabang bisa tetap input RKS paralel sementara PM atur scope
- Data scope disimpan di `rbacStore` (projectDepartments, projectMembers)

### 10. Guards & Navigation — Update

**Route guards** di `routes/guards.tsx`:
- `PermissionRoute` sudah ada — gunakan `hasPermission()` dari authz
- Tambah `DepartmentRoute` — cek apakah user punya akses ke department tertentu

**Navigation items** di `routes/nav-items.ts`:
- Filter berdasarkan permission user (existing) + scope department
- Prospek: hanya visible kalau user punya `prospect:read` di department aktif
- Proyek: hanya visible kalau user punya `project:read` di department aktif
- Pengadaan: hanya visible kalau user punya `pengadaan:read` di department aktif
- Scope/Tim menu: hanya visible untuk PM di proyek tertentu

**Sidebar** di `components/layout/Sidebar.tsx`:
- Tampilkan department aktif di bagian atas sidebar (badge/nama department)
- Tambah dropdown switch department (untuk user yang punya akses >1 department)
- Filter menu items berdasarkan permission user

### 11. Mock Data — Update `services/mock-data.ts`

Update `INITIAL_PROJECTS`:
- Tambah `departmentId` (PM department)
- Tambah `currentStageId` (stage 'in_project')
- Tambah `scopeDepartments` (array department IDs yang terlibat)

Update `INITIAL_PROSPECTS`:
- Tambah `departmentId` (Marketing department)
- Tambah `currentStageId` (stage 'prospecting')
- Tambah `ownerUserId` (userId pembuat)

## Catatan Penting

1. **Backward compatible** — Jangan rusak existing flow. Tambah field baru sebagai optional.
2. **Persist migration** — Setiap store yang diubah versinya harus punya migrate function.
3. **Semua synchronous** — Karena frontend-only, jangan pakai async/await.
4. **Ikuti research doc** — Struktur tabel, naming convention, seed data harus sama persis dengan `docs/research-rbac-architecture.md`.
5. **PM scope management** — Bisa paralel dengan input RKS. PM atur scope kapan saja.
6. **Tidak usah buat backend** — Semua di frontend dengan Zustand.
