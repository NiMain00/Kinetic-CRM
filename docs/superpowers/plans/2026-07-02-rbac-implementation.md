# RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement RBAC architecture with domain-scoped roles, stage-based access, and project scope management.

**Architecture:** New `rbacStore.ts` holds RBAC data (departments, roles, permissions, user-roles, role-permissions, workflow stages, project scope). New `authz.ts` service provides synchronous permission checking using store reads. New `useAuthz.ts` hook wraps authz for React components. Login flow extended with department selector. Project detail gets new "Scope & Tim" tab for PM scope management.

**Tech Stack:** React 19 + TypeScript + Zustand (persist) + Tailwind CSS 4 + Vite

## Global Constraints

- Backward compatible — all new fields optional (`?`). No breaking changes to existing data.
- Synchronous — no async/await. All methods read from `useXxxStore.getState()`.
- Zero new dependencies — no external auth libraries.
- Persist migration — every store version bump includes a migrate function.
- Naming follows research doc: permission codes use `<domain>:<entity>:<action>` format.
- Seed data matches research doc section 9.3 exactly.

---

### Task 1: Domain Types Update

**Files:**
- Modify: `frontend/src/types/domain/index.ts`

**Interfaces:**
- Produces: Extended `Prospect` and `Project` with optional RBAC fields, and new `ProjectMember` type

- [ ] **Step 1: Add RBAC fields to Prospect**

Find the `export interface Prospect {` block and add these fields inside (after existing fields):

```typescript
  departmentId?: string;
  currentStageId?: string;
  ownerUserId?: string;
```

- [ ] **Step 2: Add RBAC fields to Project**

Find the `export interface Project {` block and add:

```typescript
  departmentId?: string;
  currentStageId?: string;
  ownerUserId?: string;
  scopeDepartments?: string[];
```

- [ ] **Step 3: Add ProjectMember type**

Add after the `export interface Project {` block (before the `ApprovalItem` interface):

```typescript
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/domain/index.ts
git commit -m "feat(rbac): add RBAC fields to domain types

Add optional departmentId, currentStageId, ownerUserId to Prospect
and Project. Add scopeDepartments to Project. Add ProjectMember type.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: RBAC Store

**Files:**
- Create: `frontend/src/stores/rbacStore.ts`

**Interfaces:**
- Consumes: `ProjectMember` from types/domain
- Produces: `useRbacStore` with all RBAC data structures and CRUD/query actions

- [ ] **Step 1: Write the full rbacStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Data Types ──

export interface RbacDepartment {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface RbacPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface RbacUserRole {
  id: string;
  userId: string;
  roleId: string;
  scopeType: 'global' | 'department' | 'project';
  scopeId?: string;
  assignedBy?: string;
  expiresAt?: string | null;
}

export interface RbacRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  scopeType?: 'global' | 'department' | 'project';
  scopeId?: string;
  stageId?: string;
  accessLevel: 'read' | 'write';
}

export interface WorkflowStage {
  id: string;
  code: string;
  name: string;
  module: string;
  sequence: number;
  ownerDepartmentCode: string;
}

export interface ProjectDeptRecord {
  id: string;
  projectId: string;
  departmentId: string;
}

export interface ProjectMemberRecord {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
}

// ── Seed Data ──

const SEED_DEPARTMENTS: RbacDepartment[] = [
  { id: 'dept-it', code: 'IT', name: 'Information Technology', description: 'Divisi Teknologi Informasi', is_active: true },
  { id: 'dept-hc', code: 'HC', name: 'Human Capital', description: 'Divisi Sumber Daya Manusia', is_active: true },
  { id: 'dept-finance', code: 'FINANCE', name: 'Finance', description: 'Divisi Keuangan', is_active: true },
  { id: 'dept-procurement', code: 'PROCUREMENT', name: 'Procurement', description: 'Divisi Pengadaan', is_active: true },
  { id: 'dept-marketing', code: 'MARKETING', name: 'Marketing', description: 'Divisi Pemasaran', is_active: true },
  { id: 'dept-pm', code: 'PM', name: 'Project Management', description: 'Divisi Manajemen Proyek', is_active: true },
];

const SEED_ROLES: RbacRole[] = [
  { id: 'role-staff', name: 'staff', description: 'Staff department — akses operasional dasar', is_system: true },
  { id: 'role-manager', name: 'manager', description: 'Manager department — approve & monitor', is_system: true },
  { id: 'role-admin', name: 'admin', description: 'Admin department — full control', is_system: true },
  { id: 'role-director', name: 'director', description: 'Bisa lihat semua department', is_system: true },
  { id: 'role-pv', name: 'project_viewer', description: 'View-only di scope project', is_system: true },
  { id: 'role-pc', name: 'project_contributor', description: 'Create/edit data di scope project', is_system: true },
  { id: 'role-pm', name: 'project_manager', description: 'Manage project scope & members', is_system: true },
];

const SEED_PERMISSIONS: RbacPermission[] = [
  { id: 'perm-dash-view', code: 'dashboard:view', name: 'View Dashboard', module: 'dashboard' },
  { id: 'perm-notif-read', code: 'notification:read', name: 'Read Notifications', module: 'notification' },
  { id: 'perm-profile-manage', code: 'profile:manage', name: 'Manage Profile', module: 'profile' },
  { id: 'perm-prospect-read', code: 'prospect:read', name: 'Read Prospects', module: 'prospect' },
  { id: 'perm-prospect-write-prospecting', code: 'prospect:write:prospecting', name: 'Edit (Prospecting)', module: 'prospect' },
  { id: 'perm-prospect-approve-transition', code: 'prospect:approve:transition', name: 'Approve stage transisi', module: 'prospect' },
  { id: 'perm-project-read', code: 'project:read', name: 'Read Projects', module: 'project' },
  { id: 'perm-project-create', code: 'project:create', name: 'Create Projects', module: 'project' },
  { id: 'perm-project-write', code: 'project:write', name: 'Edit Projects', module: 'project' },
  { id: 'perm-project-manage-members', code: 'project:manage:members', name: 'Manage Project Members', module: 'project' },
  { id: 'perm-project-manage-scope', code: 'project:manage:scope', name: 'Manage Project Scope', module: 'project' },
  { id: 'perm-pengadaan-read', code: 'pengadaan:read', name: 'Read Pengadaan', module: 'pengadaan' },
  { id: 'perm-pengadaan-create', code: 'pengadaan:create', name: 'Create Pengadaan', module: 'pengadaan' },
  { id: 'perm-pengadaan-write', code: 'pengadaan:write', name: 'Edit Pengadaan', module: 'pengadaan' },
  { id: 'perm-report-view-dept', code: 'report:view:department', name: 'View Department Report', module: 'report' },
  { id: 'perm-report-view-crossdept', code: 'report:view:crossdept', name: 'View Cross-Dept Report', module: 'report' },
];

const SEED_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'stage-prospecting', code: 'prospecting', name: 'Prospecting', module: 'prospect', sequence: 1, ownerDepartmentCode: 'MARKETING' },
  { id: 'stage-waiting-pm', code: 'waiting_pm', name: 'Waiting PM', module: 'prospect', sequence: 2, ownerDepartmentCode: 'PM' },
  { id: 'stage-in-project', code: 'in_project', name: 'In Project', module: 'project', sequence: 3, ownerDepartmentCode: 'PM' },
  { id: 'stage-pengadaan', code: 'pengadaan', name: 'Pengadaan', module: 'pengadaan', sequence: 4, ownerDepartmentCode: 'PROCUREMENT' },
  { id: 'stage-delivery', code: 'delivery', name: 'Delivery', module: 'project', sequence: 5, ownerDepartmentCode: 'PM' },
];

// Role-Permission mappings (roleId → permissionId[])
// Staff: dashboard:view, notification:read, profile:manage (global) + prospect:read, project:read, pengadaan:read (dept)
// Staff Marketing tambah: prospect:write:prospecting (dept)
// Manager tambah: project:create, project:write, project:manage:members, report:view:department (dept)
// Director: prospect:read, project:read, pengadaan:read, report:view:crossdept (global)

const SEED_ROLE_PERMISSIONS: RbacRolePermission[] = [
  // ── Staff (global) ──
  { id: 'rp-staff-global-1', roleId: 'role-staff', permissionId: 'perm-dash-view', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-staff-global-2', roleId: 'role-staff', permissionId: 'perm-notif-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-staff-global-3', roleId: 'role-staff', permissionId: 'perm-profile-manage', scopeType: 'global', accessLevel: 'write' },
  // ── Staff (department) ──
  { id: 'rp-staff-dept-1', roleId: 'role-staff', permissionId: 'perm-prospect-read', scopeType: 'department', accessLevel: 'read' },
  { id: 'rp-staff-dept-2', roleId: 'role-staff', permissionId: 'perm-project-read', scopeType: 'department', accessLevel: 'read' },
  { id: 'rp-staff-dept-3', roleId: 'role-staff', permissionId: 'perm-pengadaan-read', scopeType: 'department', accessLevel: 'read' },
  // ── Staff Marketing tambahan ──
  { id: 'rp-staff-mkt-1', roleId: 'role-staff', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', accessLevel: 'write' },
  // ── Manager (department) ──
  { id: 'rp-mgr-dept-1', roleId: 'role-manager', permissionId: 'perm-project-create', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-2', roleId: 'role-manager', permissionId: 'perm-project-write', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-3', roleId: 'role-manager', permissionId: 'perm-project-manage-members', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-4', roleId: 'role-manager', permissionId: 'perm-report-view-dept', scopeType: 'department', accessLevel: 'read' },
  // ── Admin inherits all staff + manager through detection logic ──
  // ── Director (global bypass) ──
  { id: 'rp-dir-global-1', roleId: 'role-director', permissionId: 'perm-prospect-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-2', roleId: 'role-director', permissionId: 'perm-project-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-3', roleId: 'role-director', permissionId: 'perm-pengadaan-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-4', roleId: 'role-director', permissionId: 'perm-report-view-crossdept', scopeType: 'global', accessLevel: 'read' },
  // ── Project roles (project scope — assigned per-project) ──
  { id: 'rp-pv-project', roleId: 'role-pv', permissionId: 'perm-project-read', scopeType: 'project', accessLevel: 'read' },
  { id: 'rp-pc-project-1', roleId: 'role-pc', permissionId: 'perm-project-read', scopeType: 'project', accessLevel: 'read' },
  { id: 'rp-pc-project-2', roleId: 'role-pc', permissionId: 'perm-project-write', scopeType: 'project', accessLevel: 'write' },
  { id: 'rp-pm-project-1', roleId: 'role-pm', permissionId: 'perm-project-read', scopeType: 'project', accessLevel: 'read' },
  { id: 'rp-pm-project-2', roleId: 'role-pm', permissionId: 'perm-project-write', scopeType: 'project', accessLevel: 'write' },
  { id: 'rp-pm-project-3', roleId: 'role-pm', permissionId: 'perm-project-manage-members', scopeType: 'project', accessLevel: 'write' },
  { id: 'rp-pm-project-4', roleId: 'role-pm', permissionId: 'perm-project-manage-scope', scopeType: 'project', accessLevel: 'write' },
];

// Seed: assign role ke 10 user existing
// User mapping: 1=Ahmad(Marketing), 2=Bambang(PM), 3=Rina(Procurement), 4=Doni(IT),
//               5=Siti(Marketing), 6=Hendra(PM), 7=Dewi(director), 8=Fajar(IT),
//               9=Lestari(Procurement), 10=Bagus(Marketing)

const SEED_USER_ROLES: RbacUserRole[] = [
  // Ahmad (user 1) → staff di Marketing
  { id: 'ur-1', userId: '1', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-marketing' },
  // Bambang (user 2) → manager di PM
  { id: 'ur-2', userId: '2', roleId: 'role-manager', scopeType: 'department', scopeId: 'dept-pm' },
  // Rina (user 3) → staff di Procurement
  { id: 'ur-3', userId: '3', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-procurement' },
  // Doni (user 4) → admin di IT
  { id: 'ur-4', userId: '4', roleId: 'role-admin', scopeType: 'department', scopeId: 'dept-it' },
  // Siti (user 5) → staff di Marketing
  { id: 'ur-5', userId: '5', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-marketing' },
  // Hendra (user 6) → staff di PM
  { id: 'ur-6', userId: '6', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-pm' },
  // Dewi (user 7) → director global
  { id: 'ur-7', userId: '7', roleId: 'role-director', scopeType: 'global' },
  // Fajar (user 8) → staff di IT
  { id: 'ur-8', userId: '8', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-it' },
  // Lestari (user 9) → staff di Procurement
  { id: 'ur-9', userId: '9', roleId: 'role-staff', scopeType: 'department', scopeId: 'dept-procurement' },
  // Bagus (user 10) → manager di Marketing
  { id: 'ur-10', userId: '10', roleId: 'role-manager', scopeType: 'department', scopeId: 'dept-marketing' },
];

// ── RBAC Store Interface ──

interface RbacState {
  // Data
  departments: RbacDepartment[];
  roles: RbacRole[];
  permissions: RbacPermission[];
  userRoles: RbacUserRole[];
  rolePermissions: RbacRolePermission[];
  workflowStages: WorkflowStage[];
  projectDepartments: ProjectDeptRecord[];
  projectMembers: ProjectMemberRecord[];

  // Department CRUD
  addDepartment: (data: Omit<RbacDepartment, 'id'>) => void;
  updateDepartment: (id: string, data: Partial<RbacDepartment>) => void;
  deleteDepartment: (id: string) => void;

  // Role CRUD
  addRole: (data: Omit<RbacRole, 'id'>) => void;
  updateRole: (id: string, data: Partial<RbacRole>) => void;
  deleteRole: (id: string) => void;

  // Permission CRUD
  addPermission: (data: Omit<RbacPermission, 'id'>) => void;
  updatePermission: (id: string, data: Partial<RbacPermission>) => void;
  deletePermission: (id: string) => void;

  // User-Role management
  assignUserRole: (userId: string, roleId: string, scopeType: RbacUserRole['scopeType'], scopeId?: string) => void;
  removeUserRole: (userRoleId: string) => void;
  getUserRoles: (userId: string) => RbacUserRole[];
  getUserDepartments: (userId: string) => RbacDepartment[];

  // Role-Permission management
  addRolePermission: (roleId: string, permissionId: string, scopeType?: RbacRolePermission['scopeType'], scopeId?: string, stageId?: string) => void;
  removeRolePermission: (rpId: string) => void;
  getRolePermissions: (roleId: string, scopeType?: string, scopeId?: string) => RbacRolePermission[];

  // Workflow Stages
  addStage: (data: Omit<WorkflowStage, 'id'>) => void;
  updateStage: (id: string, data: Partial<WorkflowStage>) => void;
  deleteStage: (id: string) => void;
  getStagesByModule: (module: string) => WorkflowStage[];

  // Project Scope Management
  addProjectDepartment: (projectId: string, departmentId: string) => void;
  removeProjectDepartment: (projectId: string, departmentId: string) => void;
  getProjectDepartments: (projectId: string) => RbacDepartment[];
  getProjectDeptIds: (projectId: string) => string[];
  addProjectMember: (projectId: string, userId: string, roleId: string, departmentId: string, assignedBy: string) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  getProjectMembers: (projectId: string) => ProjectMemberRecord[];
}

// ── Helpers ──

let _nextId = 1000;
const nextId = () => `rbac-${++_nextId}`;

// ── Store ──

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      departments: SEED_DEPARTMENTS,
      roles: SEED_ROLES,
      permissions: SEED_PERMISSIONS,
      userRoles: SEED_USER_ROLES,
      rolePermissions: SEED_ROLE_PERMISSIONS,
      workflowStages: SEED_WORKFLOW_STAGES,
      projectDepartments: [],
      projectMembers: [],

      // ── Department CRUD ──
      addDepartment: (data) =>
        set((s) => ({ departments: [...s.departments, { ...data, id: nextId() }] })),
      updateDepartment: (id, data) =>
        set((s) => ({
          departments: s.departments.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDepartment: (id) =>
        set((s) => ({
          departments: s.departments.filter((d) => d.id !== id),
        })),

      // ── Role CRUD ──
      addRole: (data) =>
        set((s) => ({ roles: [...s.roles, { ...data, id: nextId() }] })),
      updateRole: (id, data) =>
        set((s) => ({
          roles: s.roles.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRole: (id) =>
        set((s) => ({
          roles: s.roles.filter((r) => r.id !== id),
        })),

      // ── Permission CRUD ──
      addPermission: (data) =>
        set((s) => ({ permissions: [...s.permissions, { ...data, id: nextId() }] })),
      updatePermission: (id, data) =>
        set((s) => ({
          permissions: s.permissions.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePermission: (id) =>
        set((s) => ({
          permissions: s.permissions.filter((p) => p.id !== id),
        })),

      // ── User-Role ──
      assignUserRole: (userId, roleId, scopeType, scopeId) =>
        set((s) => ({
          userRoles: [...s.userRoles, { id: nextId(), userId, roleId, scopeType, scopeId }],
        })),
      removeUserRole: (userRoleId) =>
        set((s) => ({
          userRoles: s.userRoles.filter((ur) => ur.id !== userRoleId),
        })),
      getUserRoles: (userId) => get().userRoles.filter((ur) => ur.userId === userId),
      getUserDepartments: (userId) => {
        const store = get();
        const deptScopeIds = store.userRoles
          .filter((ur) => ur.userId === userId && ur.scopeType === 'department' && ur.scopeId)
          .map((ur) => ur.scopeId!);
        // Also include departments from project membership
        const projectDeptIds = store.projectMembers
          .filter((pm) => pm.userId === userId)
          .map((pm) => pm.departmentId);
        const allDeptIds = [...new Set([...deptScopeIds, ...projectDeptIds])];
        return store.departments.filter((d) => allDeptIds.includes(d.id) && d.is_active);
      },

      // ── Role-Permission ──
      addRolePermission: (roleId, permissionId, scopeType, scopeId, stageId) =>
        set((s) => ({
          rolePermissions: [
            ...s.rolePermissions,
            { id: nextId(), roleId, permissionId, scopeType, scopeId, stageId: stageId || undefined, accessLevel: 'write' },
          ],
        })),
      removeRolePermission: (rpId) =>
        set((s) => ({
          rolePermissions: s.rolePermissions.filter((rp) => rp.id !== rpId),
        })),
      getRolePermissions: (roleId, scopeType, scopeId) =>
        get().rolePermissions.filter((rp) => {
          if (rp.roleId !== roleId) return false;
          if (scopeType && rp.scopeType !== scopeType) return false;
          if (scopeId !== undefined && rp.scopeId !== scopeId) return false;
          return true;
        }),

      // ── Workflow Stages ──
      addStage: (data) =>
        set((s) => ({ workflowStages: [...s.workflowStages, { ...data, id: nextId() }] })),
      updateStage: (id, data) =>
        set((s) => ({
          workflowStages: s.workflowStages.map((st) => (st.id === id ? { ...st, ...data } : st)),
        })),
      deleteStage: (id) =>
        set((s) => ({
          workflowStages: s.workflowStages.filter((st) => st.id !== id),
        })),
      getStagesByModule: (module) =>
        get().workflowStages.filter((st) => st.module === module).sort((a, b) => a.sequence - b.sequence),

      // ── Project Scope ──
      addProjectDepartment: (projectId, departmentId) =>
        set((s) => {
          const exists = s.projectDepartments.find((pd) => pd.projectId === projectId && pd.departmentId === departmentId);
          if (exists) return s;
          return {
            projectDepartments: [...s.projectDepartments, { id: nextId(), projectId, departmentId }],
          };
        }),
      removeProjectDepartment: (projectId, departmentId) =>
        set((s) => ({
          projectDepartments: s.projectDepartments.filter(
            (pd) => !(pd.projectId === projectId && pd.departmentId === departmentId)
          ),
        })),
      getProjectDepartments: (projectId) => {
        const store = get();
        const deptIds = store.projectDepartments
          .filter((pd) => pd.projectId === projectId)
          .map((pd) => pd.departmentId);
        return store.departments.filter((d) => deptIds.includes(d.id));
      },
      getProjectDeptIds: (projectId) => {
        return get().projectDepartments
          .filter((pd) => pd.projectId === projectId)
          .map((pd) => pd.departmentId);
      },
      addProjectMember: (projectId, userId, roleId, departmentId, assignedBy) =>
        set((s) => ({
          projectMembers: [
            ...s.projectMembers,
            { id: nextId(), projectId, userId, roleId, departmentId, assignedBy },
          ],
        })),
      removeProjectMember: (projectId, userId) =>
        set((s) => ({
          projectMembers: s.projectMembers.filter(
            (pm) => !(pm.projectId === projectId && pm.userId === userId)
          ),
        })),
      getProjectMembers: (projectId) =>
        get().projectMembers.filter((pm) => pm.projectId === projectId),
    }),
    {
      name: 'kinetic-rbac',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          return {
            departments: SEED_DEPARTMENTS,
            roles: SEED_ROLES,
            permissions: SEED_PERMISSIONS,
            userRoles: SEED_USER_ROLES,
            rolePermissions: SEED_ROLE_PERMISSIONS,
            workflowStages: SEED_WORKFLOW_STAGES,
            projectDepartments: [],
            projectMembers: [],
          };
        }
        return (persisted || {}) as RbacState;
      },
    },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/stores/rbacStore.ts
git commit -m "feat(rbac): add rbacStore with data structures and seed data

New store holding departments, roles, permissions, user-roles,
role-permissions, workflow stages, and project scope data.
Includes full CRUD actions and query helpers. Seed data matches
research-rbac-architecture.md section 9.3.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: AuthorizationEngine

**Files:**
- Create: `frontend/src/services/authz.ts`

**Interfaces:**
- Consumes: `useRbacStore` (via getState)
- Produces: `AuthorizationEngine` class with `hasPermission`, `getStageAccess`, `checkDirectorBypass`, `buildDepartmentFilter`, `getAccessibleDepartments`

- [ ] **Step 1: Write the AuthorizationEngine**

```typescript
import { useRbacStore } from '@/stores/rbacStore';
import type { RbacDepartment } from '@/stores/rbacStore';

/**
 * Synchronous authorization engine — reads directly from Zustand store.
 * Since this is frontend-only, no async/await needed.
 *
 * Permission checking order:
 * 1. Is permission a global/base permission (dashboard:view, notification:read, profile:manage)?
 * 2. Is user a director with bypass?
 * 3. Loop through user's roles — additive (any match = true)
 */

const GLOBAL_PERMISSIONS = new Set([
  'dashboard:view',
  'notification:read',
  'profile:manage',
]);

type StageAccessLevel = 'none' | 'read' | 'write';

const STAGE_RULES: Record<string, { owner: string; prev: string | null }> = {
  prospecting:  { owner: 'MARKETING', prev: null },
  waiting_pm:   { owner: 'PM', prev: 'MARKETING' },
  in_project:   { owner: 'PM', prev: 'MARKETING' },
  pengadaan:    { owner: 'PROCUREMENT', prev: 'PM' },
  delivery:     { owner: 'PM', prev: 'PROCUREMENT' },
};

class AuthorizationEngine {
  /**
   * Check if a user has a specific permission.
   * Optionally provide context (departmentId, projectId) for scoped checks.
   */
  hasPermission(
    userId: string,
    permissionCode: string,
    context?: { departmentId?: string; projectId?: string }
  ): boolean {
    const store = useRbacStore.getState();

    // Step 1: Global/base permissions apply to everyone
    if (GLOBAL_PERMISSIONS.has(permissionCode)) return true;

    // Step 2: Director bypass
    if (this.checkDirectorBypass(userId, permissionCode)) return true;

    // Step 3: Get all active user roles
    const userRoles = store.userRoles.filter((ur) => {
      if (ur.userId !== userId) return false;
      if (ur.expiresAt && new Date(ur.expiresAt) <= new Date()) return false;
      return true;
    });

    if (userRoles.length === 0) return false;

    // Step 4: Check each role — additive (any match = permitted)
    for (const ur of userRoles) {
      const rolePerms = store.rolePermissions.filter((rp) => rp.roleId === ur.roleId);
      for (const rp of rolePerms) {
        const perm = store.permissions.find((p) => p.id === rp.permissionId);
        if (!perm || perm.code !== permissionCode) continue;

        // Check scope match
        if (rp.scopeType === 'global') return true;
        if (rp.scopeType === 'department') {
          // Match either context.departmentId or the user-role's scopeId
          const deptId = context?.departmentId || ur.scopeId;
          if (rp.scopeId === deptId || !rp.scopeId) return true;
        }
        if (rp.scopeType === 'project') {
          if (rp.scopeId === context?.projectId || !rp.scopeId) return true;
        }
        // Null scopeType = applies to any scope
        if (!rp.scopeType) return true;
      }
    }

    return false;
  }

  /**
   * Get stage-based access level for a user on a record.
   */
  getStageAccess(
    userId: string,
    currentStageCode: string,
    recordDepartmentId: string
  ): StageAccessLevel {
    const store = useRbacStore.getState();
    const rule = STAGE_RULES[currentStageCode];
    if (!rule) return 'none';

    // Get user's department from authStore (activeDepartmentId)
    const { useAuthStore } = require('@/stores/authStore') as typeof import('@/stores/authStore');
    const authUser = useAuthStore.getState().user;
    const activeDeptId = useAuthStore.getState().activeDepartmentId || authUser?.departmentId;
    if (!activeDeptId) return 'none';

    const userDept = store.departments.find((d) => d.id === activeDeptId);
    if (!userDept) return 'none';

    // Owner department → write access
    if (userDept.code === rule.owner) return 'write';

    // Previous department → read access
    if (rule.prev && userDept.code === rule.prev) return 'read';

    return 'none';
  }

  /**
   * Check if user has director bypass for a specific permission.
   */
  checkDirectorBypass(userId: string, permissionCode: string): boolean {
    const store = useRbacStore.getState();

    // Find director role
    const directorRole = store.roles.find((r) => r.name === 'director');
    if (!directorRole) return false;

    // Check if user has director role with global scope
    const hasDirectorRole = store.userRoles.some(
      (ur) => ur.userId === userId && ur.roleId === directorRole.id && ur.scopeType === 'global'
    );
    if (!hasDirectorRole) return false;

    // Check if director role has this permission mapped
    const directorPerms = store.rolePermissions.filter(
      (rp) => rp.roleId === directorRole.id
    );

    for (const rp of directorPerms) {
      const perm = store.permissions.find((p) => p.id === rp.permissionId);
      if (perm && perm.code === permissionCode) return true;
    }

    return false;
  }

  /**
   * Build a list of department IDs that the user can access.
   * Includes their role-based departments and project-member departments.
   */
  buildDepartmentFilter(
    userId: string,
    options?: { includeProjectAccess?: boolean; activeDepartmentId?: string }
  ): string[] {
    const store = useRbacStore.getState();
    const deptIds = new Set<string>();

    // From user roles (department scope)
    store.userRoles
      .filter((ur) => ur.userId === userId && ur.scopeType === 'department' && ur.scopeId)
      .forEach((ur) => deptIds.add(ur.scopeId!));

    // From project membership
    if (options?.includeProjectAccess) {
      store.projectMembers
        .filter((pm) => pm.userId === userId)
        .forEach((pm) => deptIds.add(pm.departmentId));
    }

    // If active department specified and user has access, filter to just that
    if (options?.activeDepartmentId && deptIds.has(options.activeDepartmentId)) {
      return [options.activeDepartmentId];
    }

    return [...deptIds];
  }

  /**
   * Get departments accessible by the user.
   */
  getAccessibleDepartments(userId: string): RbacDepartment[] {
    const store = useRbacStore.getState();
    const deptIds = this.buildDepartmentFilter(userId, { includeProjectAccess: true });
    return store.departments.filter((d) => deptIds.includes(d.id) && d.is_active);
  }
}

export const authz = new AuthorizationEngine();
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/authz.ts
git commit -m "feat(rbac): add AuthorizationEngine service

Synchronous authz engine with hasPermission, getStageAccess,
checkDirectorBypass, buildDepartmentFilter, getAccessibleDepartments.
Reads from RbacStore via getState(). No async - frontend-only.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: AuthStore Update

**Files:**
- Modify: `frontend/src/stores/authStore.ts`

**Interfaces:**
- Consumes: None directly (but adds fields consumed by authz)
- Produces: Extended AuthUser with RBAC fields + activeDepartmentId state

- [ ] **Step 1: Update AuthUser interface**

Replace the `export interface AuthUser` block with:

```typescript
export interface AuthUser {
  id?: string;
  name?: string;
  fullName?: string;
  roleName?: string;
  email?: string;
  avatarUrl?: string;
  branchName?: string;
  branchId?: string;
  // RBAC fields
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  roleId?: string;
  scopeType?: string;
  scopeId?: string;
}
```

- [ ] **Step 2: Add activeDepartmentId state and new actions**

Replace the `interface AuthState` block with:

```typescript
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  activeDepartmentId: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setActiveDepartment: (deptId: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  getAccessLevel: (stageCode: string, recordDeptId: string) => 'none' | 'read' | 'write';
}
```

- [ ] **Step 3: Update store implementation**

Replace the `create` block with:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      activeDepartmentId: null,

      login: (token, user) => set({ token, user, isAuthenticated: true }),

      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        activeDepartmentId: null,
      }),

      setActiveDepartment: (deptId) => set({ activeDepartmentId: deptId }),

      hasPermission: (permissionCode) => {
        const user = get().user;
        if (!user?.id) return false;
        const { authz } = require('@/services/authz');
        return authz.hasPermission(user.id, permissionCode, {
          departmentId: get().activeDepartmentId || user.departmentId,
        });
      },

      getAccessLevel: (stageCode, recordDeptId) => {
        const user = get().user;
        if (!user?.id) return 'none';
        const { authz } = require('@/services/authz');
        return authz.getStageAccess(user.id, stageCode, recordDeptId);
      },
    }),
    {
      name: 'kinetic-auth',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0) {
          return { user: null, token: null, isAuthenticated: false, activeDepartmentId: null };
        }
        if (version === 1) {
          return { ...current, activeDepartmentId: current.activeDepartmentId ?? null };
        }
        return current;
      },
    },
  ),
);
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/stores/authStore.ts
git commit -m "feat(rbac): extend authStore with RBAC fields

Add activeDepartmentId, setActiveDepartment, hasPermission, and
getAccessLevel to authStore. Bump persist version with migration.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: useAuthz Hook

**Files:**
- Create: `frontend/src/hooks/useAuthz.ts`

**Interfaces:**
- Consumes: AuthStore + authz engine
- Produces: `useAuthz` hook returning `{ can, stageAccess, isDirector, accessibleDepartments }`

- [ ] **Step 1: Write the hook**

```typescript
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { authz } from '@/services/authz';

export function useAuthz() {
  const user = useAuthStore((s) => s.user);
  const activeDepartmentId = useAuthStore((s) => s.activeDepartmentId);
  const departments = useRbacStore((s) => s.departments);
  const userRoles = useRbacStore((s) => s.userRoles);
  const rolePermissions = useRbacStore((s) => s.rolePermissions);
  const permissions = useRbacStore((s) => s.permissions);
  const roles = useRbacStore((s) => s.roles);

  return useMemo(() => {
    const userId = user?.id;
    return {
      can: (permission: string): boolean => {
        if (!userId) return false;
        return authz.hasPermission(userId, permission, {
          departmentId: activeDepartmentId || user?.departmentId,
        });
      },

      stageAccess: (stageCode: string, recordDeptId: string): 'none' | 'read' | 'write' => {
        if (!userId) return 'none';
        return authz.getStageAccess(userId, stageCode, recordDeptId);
      },

      isDirector: (): boolean => {
        if (!userId) return false;
        const directorRole = roles.find((r) => r.name === 'director');
        if (!directorRole) return false;
        return userRoles.some(
          (ur) => ur.userId === userId && ur.roleId === directorRole.id && ur.scopeType === 'global'
        );
      },

      accessibleDepartments: () => {
        if (!userId) return [];
        return authz.getAccessibleDepartments(userId);
      },
    };
  }, [userId, activeDepartmentId, user?.departmentId, userRoles, rolePermissions, permissions, roles, departments]);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useAuthz.ts
git commit -m "feat(rbac): add useAuthz hook

Convenience hook wrapping AuthorizationEngine for React components.
Returns can(), stageAccess(), isDirector(), accessibleDepartments().

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Project Store Update

**Files:**
- Modify: `frontend/src/stores/projectStore.ts`

**Interfaces:**
- Consumes: Project type (already imported)
- Produces: New actions for scope management and stage updates

- [ ] **Step 1: Add scope and stage actions to the store interface**

Find the `interface ProjectState {` block and add these action signatures after the existing ones (before the closing `}`):

```typescript
  // RBAC: scope & stage management
  updateProjectScope: (id: string, scopeDepartments: string[]) => void;
  updateProjectStage: (id: string, stageId: string) => void;
```

- [ ] **Step 2: Add implementations inside the store creator**

Add these implementations after the `updateProjectDocuments` handler (before the closing `}),`):

```typescript
      updateProjectScope: (id, scopeDepartments) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, scopeDepartments } : p)),
        })),
      updateProjectStage: (id, stageId) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)),
        })),
```

- [ ] **Step 3: Bump persist version**

Find `version: 3` and change it to `version: 4`. Add a new migration case:

```typescript
        if (version < 4) {
          // v4: Add scopeDepartments and currentStageId fields (optional, backward compatible)
          return { ...current, projects: (current.projects || []).map((p: any) => ({ ...p })) };
        }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/stores/projectStore.ts
git commit -m "feat(rbac): add scope and stage actions to projectStore

Add updateProjectScope and updateProjectStage. Bump persist to v4.
Backward compatible — all new fields are optional.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Prospect Store Update

**Files:**
- Modify: `frontend/src/stores/prospectStore.ts`

**Interfaces:**
- Consumes: Prospect type (already imported)
- Produces: updateProspectStage action

- [ ] **Step 1: Add stage action to ProspectState interface**

Find `interface ProspectState {` and add after `getProspectById`:

```typescript
  updateProspectStage: (id: string, stageId: string) => void;
```

- [ ] **Step 2: Add implementation**

Add inside the store creator after `getProspectById` handler:

```typescript
      updateProspectStage: (id, stageId) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)),
        })),
```

- [ ] **Step 3: Bump version**

Change `version: 2` to `version: 3`. Add migration:

```typescript
        if (version < 3) {
          return { ...current, prospects: (current.prospects || []).map((p: any) => ({ ...p })) };
        }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/stores/prospectStore.ts
git commit -m "feat(rbac): add updateProspectStage to prospectStore

Bump persist to v3. Backward compatible.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Mock Data Update

**Files:**
- Modify: `frontend/src/services/mock-data.ts`

**Interfaces:**
- Consumes: Project, Prospect types (already imported)
- Produces: Updated mock data with RBAC fields

- [ ] **Step 1: Update INITIAL_PROSPECTS**

Find each prospect entry. The first prospect (id: '1') should get departmentId and currentStageId. Keep createdByUserId as-is (it's already the ownerUserId). Update:

For prospect `id: '1'` (Ahmad's prospect, Marketing):
Add after `createdByUserId: '1'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-prospecting', ownerUserId: '1'`

For prospect `id: '2'` (Siti's prospect, Marketing):
Add after `createdByUserId: '5'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-prospecting', ownerUserId: '5'`

For prospect `id: '3'` (Bambang's, in Waiting PM → already in PM):
Add after `createdByUserId: '2'`:
`departmentId: 'dept-pm', currentStageId: 'stage-waiting-pm', ownerUserId: '2'`

For prospect `id: '4'` (Rina's, Procurement):
Add after `createdByUserId: '3'`:
`departmentId: 'dept-procurement', currentStageId: 'stage-prospecting', ownerUserId: '3'`

For prospect `id: '5'` (Ahmad's):
Add after `createdByUserId: '1'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-prospecting', ownerUserId: '1'`

For prospect `id: '6'` (Bambang's):
Add after `createdByUserId: '2'`:
`departmentId: 'dept-pm', currentStageId: 'stage-in-project', ownerUserId: '2'`

For prospect `id: '7'` (Rina's):
Add after `createdByUserId: '3'`:
`departmentId: 'dept-procurement', currentStageId: 'stage-prospecting', ownerUserId: '3'`

For prospect `id: '8'` (Siti's):
Add after `createdByUserId: '5'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-prospecting', ownerUserId: '5'`

- [ ] **Step 2: Update INITIAL_PROJECTS**

For project `PR-2025-001` (Bambang's PM project):
Add after `createdByUserId: '2'`:
`departmentId: 'dept-pm', currentStageId: 'stage-in-project', scopeDepartments: ['dept-it', 'dept-finance', 'dept-procurement']`

For project `PR-2025-002` (Ahmad's, Marketing):
Add after `createdByUserId: '1'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-in-project', scopeDepartments: ['dept-it', 'dept-finance']`

For project `PR-2025-003` (Doni's, IT):
Add after `createdByUserId: '4'`:
`departmentId: 'dept-it', currentStageId: 'stage-delivery', scopeDepartments: ['dept-pm', 'dept-procurement']`

For project `PR-2025-004` (Siti's, Marketing):
Add after `createdByUserId: '5'`:
`departmentId: 'dept-marketing', currentStageId: 'stage-in-project', scopeDepartments: []`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/mock-data.ts
git commit -m "feat(rbac): update mock data with RBAC fields

Add departmentId, currentStageId, ownerUserId to prospects and
projects. Add scopeDepartments to projects.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: LoginPage — Department Selector

**Files:**
- Modify: `frontend/src/features/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: `authz.getAccessibleDepartments(userId)`, `authStore.setActiveDepartment()`, `rbacStore.getUserRoles()`
- Produces: Login flow with department selection after credential validation

- [ ] **Step 1: Add imports and state**

Add to existing imports at top:

```typescript
import { useRbacStore } from '@/stores/rbacStore';
import { useAuthz } from '@/hooks/useAuthz';
import { authz } from '@/services/authz';
```

Add state inside the component (after existing state):

```typescript
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const accessDepartments = useRbacStore((s) => s.departments);
```

- [ ] **Step 2: Modify handleSubmit to show department picker**

Replace the success block inside `handleSubmit` (the `if (matched && password === username)` section) with:

```typescript
      if (matched && password === username) {
        const userId = matched.id;
        const depts = authz.getAccessibleDepartments(userId);

        if (depts.length === 1) {
          // Single department — auto-select and login
          const dept = depts[0];
          const userRoles = useRbacStore.getState().userRoles.filter((ur) => ur.userId === userId);
          const activeRole = userRoles.find((ur) => ur.scopeId === dept.id || ur.scopeType === 'global');
          const roleName = activeRole
            ? useRbacStore.getState().roles.find((r) => r.id === activeRole.roleId)?.name || matched.role
            : matched.role;

          login('mock-token', {
            ...getUserAuthPayload(matched),
            departmentId: dept.id,
            departmentCode: dept.code,
            departmentName: dept.name,
            roleId: activeRole?.roleId,
            scopeType: activeRole?.scopeType,
            scopeId: activeRole?.scopeId,
          });
          useAuthStore.getState().setActiveDepartment(dept.id);
          navigate('/dashboard');
          toast.success(`Selamat datang, ${matched.name}!`);
        } else {
          // Multiple departments — show picker
          setPendingUserId(userId);
          // Store matched account info temporarily
          setShowDepartmentPicker(true);
          // Use token+partial login to keep state, then redirect
          login('mock-token', getUserAuthPayload(matched));
        }
      }
```

- [ ] **Step 3: Add department picker UI**

Add after the form's closing `</form>` tag and before the demo accounts section's `<div className="mt-6 ...">`:

```tsx
          {/* Department Picker Modal */}
          {showDepartmentPicker && pendingUserId && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm p-6 animate-in zoom-in-95 fade-in">
                <h3 className="font-heading-section text-base text-on-surface mb-1">Pilih Department</h3>
                <p className="text-sm text-secondary mb-4">Pilih department yang akan diakses:</p>
                <div className="space-y-2">
                  {authz.getAccessibleDepartments(pendingUserId).map((dept) => {
                    const userRoles = useRbacStore.getState().userRoles.filter(
                      (ur) => ur.userId === pendingUserId && ur.scopeType === 'department' && ur.scopeId === dept.id
                    );
                    const roleName = userRoles.length > 0
                      ? useRbacStore.getState().roles.find((r) => r.id === userRoles[0].roleId)?.name
                      : 'staff';
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          const matched = demoAccounts.find((a) => a.id === pendingUserId);
                          if (!matched) return;
                          const activeRole = userRoles[0];
                          const deptRole = activeRole
                            ? useRbacStore.getState().roles.find((r) => r.id === activeRole.roleId)
                            : undefined;
                          login('mock-token', {
                            ...getUserAuthPayload(matched),
                            departmentId: dept.id,
                            departmentCode: dept.code,
                            departmentName: dept.name,
                            roleId: activeRole?.roleId,
                            scopeType: activeRole?.scopeType,
                            scopeId: activeRole?.scopeId,
                          });
                          useAuthStore.getState().setActiveDepartment(dept.id);
                          setShowDepartmentPicker(false);
                          navigate('/dashboard');
                          toast.success(`Selamat datang, ${matched.name} (${dept.name})`);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-surface-container hover:border-primary/30 hover:bg-surface-container-lowest transition-all cursor-pointer text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">business</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-on-surface truncate">{dept.name}</p>
                          <p className="text-[10px] text-secondary uppercase tracking-wider">{dept.code} · {roleName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentPicker(false);
                    setPendingUserId(null);
                    logout();
                  }}
                  className="mt-4 w-full py-2 text-center text-sm text-secondary hover:text-on-surface transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
```

Note: `logout` needs to be accessible in this scope — it's already destructured from `useAuthStore()` at the top level of the component. Check if it is; if not, add it.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/auth/LoginPage.tsx
git commit -m "feat(rbac): add department selector to login flow

After credential validation, if user has access to multiple
departments, show a department picker modal. Single-department
users auto-login. Sets activeDepartmentId on selection.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Guards & Navigation Update

**Files:**
- Modify: `frontend/src/routes/guards.tsx`
- Modify: `frontend/src/routes/nav-items.ts`

**Interfaces:**
- Consumes: `authz.hasPermission()`, `useAuthStore.activeDepartmentId`
- Produces: Updated guards using RBAC permission checks, updated nav-item permissions

- [ ] **Step 1: Update PermissionRoute in guards.tsx**

Replace the entire `PermissionRoute` function with:

```typescript
export function PermissionRoute({ children, permissions }: { children: React.ReactNode; permissions: string[] }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permissions.length === 0) return <>{children}</>;

  const userId = (user as { id?: string })?.id;
  if (!userId) return <Navigate to="/403" replace />;

  // Use RBAC authz engine
  const { authz } = require('@/services/authz') as typeof import('@/services/authz');
  const activeDeptId = useAuthStore.getState().activeDepartmentId || (user as any)?.departmentId;

  const hasAccess = permissions.some((p) =>
    authz.hasPermission(userId, p, { departmentId: activeDeptId })
  );

  if (!hasAccess) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 2: Add DepartmentRoute to guards.tsx**

Add after `PermissionRoute`:

```typescript
export function DepartmentRoute({ children, departmentId }: { children: React.ReactNode; departmentId: string }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // User can access this department if it's their active department
  // or if they have director bypass or project access
  const userId = (user as { id?: string })?.id;
  if (!userId) return <Navigate to="/403" replace />;

  const { authz } = require('@/services/authz') as typeof import('@/services/authz');
  const accessible = authz.buildDepartmentFilter(userId, { includeProjectAccess: true });

  if (!accessible.includes(departmentId) && !authz.checkDirectorBypass(userId, 'dashboard:view')) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Update nav-items.ts permission codes**

Replace the navItems array with updated permission codes that match the new RBAC schema:

```typescript
export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', permissions: ['dashboard:view'] },
  { label: 'Prospek', path: '/prospects', icon: 'person', permissions: ['prospect:read'] },
  { label: 'Proyek', path: '/projects', icon: 'work', permissions: ['project:read'] },
  { label: 'Proses Pengadaan', path: '/procurement', icon: 'inventory_2', permissions: ['pengadaan:read'] },
  { label: 'Persetujuan', path: '/approvals', icon: 'how_to_reg', permissions: ['prospect:approve:transition'] },
  { label: 'Laporan', path: '/reports', icon: 'pie_chart', permissions: ['report:view:department'] },
  { label: 'Kalender', path: '/reports/calendar', icon: 'calendar_today', permissions: ['report:view:department'] },
  { label: 'Master Data', path: '/master-data', icon: 'layers', permissions: ['profile:manage'] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', permissions: ['notification:read'] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', permissions: ['profile:manage'] },
];
```

Also update the `configNavItems` similarly if needed.

Note: We're keeping `filterNavItems` as-is but the permissions array now uses the new RBAC permission codes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/guards.tsx frontend/src/routes/nav-items.ts
git commit -m "feat(rbac): update guards and nav-items with RBAC

PermissionRoute now uses authz engine for permission checks.
Added DepartmentRoute. Updated nav-item permissions to RBAC codes.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Sidebar — Department Badge & Switcher

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: `useAuthz().accessibleDepartments()`, `useAuthStore.activeDepartmentId`, `setActiveDepartment`
- Produces: Sidebar with department badge and switch dropdown

- [ ] **Step 1: Update Sidebar component**

At the top, after the existing imports, add:

```typescript
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { authz } from '@/services/authz';
```

Add a new section in the sidebar between the Brand Header and Navigation list (after the closing `</div>` of the brand header and before the `<nav>` element):

```tsx
        {/* Active Department Badge */}
        {(!collapsed || mobile) && (
          <div className="px-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-container/20 rounded-xl border border-primary/10">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">business</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-primary truncate">
                  {deptName}
                </p>
                <p className="text-[9px] text-outline uppercase tracking-wider">{deptCode}</p>
              </div>
            </div>
          </div>
        )}
```

Where `deptName` and `deptCode` are derived from:

```typescript
  // Inside the component body, before the return statement
  const user = useAuthStore((s) => s.user);
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  const rbacDepartments = useRbacStore((s) => s.departments);
  const activeDept = rbacDepartments.find((d) => d.id === activeDeptId);
  const deptName = activeDept?.name || (user as any)?.departmentName || 'Semua Department';
  const deptCode = activeDept?.code || (user as any)?.departmentCode || '';
```

- [ ] **Step 2: Add department switcher dropdown**

After the department badge section above, add a collapsible list of other departments the user can switch to:

```tsx
        {/* Department Switcher (if user has multiple depts) */}
        {(!collapsed || mobile) && (() => {
          const userId = (user as { id?: string })?.id;
          if (!userId) return null;
          const allDepts = authz.getAccessibleDepartments(userId);
          if (allDepts.length <= 1) return null;
          const otherDepts = allDepts.filter((d) => d.id !== activeDeptId);
          return (
            <div className="px-3 mb-3">
              <button
                onClick={() => setShowDeptSwitch(!showDeptSwitch)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-outline hover:text-on-surface transition-colors"
              >
                <span>Ganti Department</span>
                <span className="material-symbols-outlined text-[14px]">
                  {showDeptSwitch ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showDeptSwitch && (
                <div className="mt-1 space-y-1">
                  {otherDepts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        useAuthStore.getState().setActiveDepartment(dept.id);
                        setShowDeptSwitch(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      <div className="w-5 h-5 rounded bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px]">business</span>
                      </div>
                      <span className="truncate">{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
```

Add the missing `showDeptSwitch` state:

```typescript
  // Add near the top with other hooks
  const [showDeptSwitch, setShowDeptSwitch] = React.useState(false);
```

- [ ] **Step 3: Update AppLayout to pass RBAC data to Sidebar**

In `AppLayout.tsx`, the userPermissions logic currently reads from masterDataStore roles. Since the new RBAC has its own permission system, pass the activeDepartmentId through as a new prop to Sidebar.

Actually, since Sidebar is now using useAuthStore and useRbacStore directly, no changes needed to AppLayout for RBAC data. The Sidebar reads directly from stores.

But we need to ensure the Topbar also shows the active department. Let's skip Topbar for now to keep scope manageable.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/components/layout/AppLayout.tsx
git commit -m "feat(rbac): add department badge and switcher to sidebar

Show active department name. Add dropdown to switch between
accessible departments for multi-department users.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: ScopeTimTab Component

**Files:**
- Create: `frontend/src/features/projects/tabs/ScopeTimTab.tsx`

**Interfaces:**
- Consumes: `useRbacStore` (projectDepartments, projectMembers, departments), `useAuthStore` (user)
- Produces: Tab UI for managing project scope (departments + members)

- [ ] **Step 1: Write the ScopeTimTab component**

```typescript
import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore, type RbacDepartment } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { Modal, Button } from '@/components/ui';
import { authz } from '@/services/authz';
import type { ProjectMemberRecord } from '@/stores/rbacStore';

interface ScopeTimTabProps {
  projectId: string;
}

export default function ScopeTimTab({ projectId }: ScopeTimTabProps) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const departments = useRbacStore((s) => s.departments);
  const projectDepartments = useRbacStore((s) => s.projectDepartments);
  const projectMembers = useRbacStore((s) => s.projectMembers);
  const addProjectDept = useRbacStore((s) => s.addProjectDepartment);
  const removeProjectDept = useRbacStore((s) => s.removeProjectDepartment);
  const addProjMember = useRbacStore((s) => s.addProjectMember);
  const removeProjMember = useRbacStore((s) => s.removeProjectMember);
  const getProjectDeptIds = useRbacStore((s) => s.getProjectDeptIds);

  const roles = useRbacStore((s) => s.roles);
  const masterUsers = useMasterDataStore((s) => s.users);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedDeptForMember, setSelectedDeptForMember] = useState<string | null>(null);

  // Derived data
  const myDeptIds = useMemo(() => {
    if (!userId) return [];
    return authz.buildDepartmentFilter(userId);
  }, [userId]);

  const involvedDeptIds = useMemo(() => {
    return projectDepartments
      .filter((pd) => pd.projectId === projectId)
      .map((pd) => pd.departmentId);
  }, [projectDepartments, projectId]);

  const involvedDepts = useMemo(() => {
    return departments.filter((d) => involvedDeptIds.includes(d.id));
  }, [departments, involvedDeptIds]);

  const members = useMemo(() => {
    return projectMembers.filter((pm) => pm.projectId === projectId);
  }, [projectMembers, projectId]);

  const membersByDept = useMemo(() => {
    const map = new Map<string, ProjectMemberRecord[]>();
    for (const m of members) {
      const list = map.get(m.departmentId) || [];
      list.push(m);
      map.set(m.departmentId, list);
    }
    return map;
  }, [members]);

  const availableDepts = useMemo(() => {
    return departments.filter((d) => !involvedDeptIds.includes(d.id) && d.is_active);
  }, [departments, involvedDeptIds]);

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;
  const getUserName = (uid: string) => masterUsers.find((u) => u.id === uid)?.name || uid;

  const canManage = userId
    ? authz.hasPermission(userId, 'project:manage:scope', { projectId })
    : false;

  if (!canManage) {
    return (
      <div className="space-y-6">
        {/* Read-only view for non-PM */}
        <SectionCard title="Departemen Terlibat">
          {involvedDepts.length === 0 ? (
            <p className="text-sm text-secondary">Belum ada departemen yang ditambahkan.</p>
          ) : (
            <div className="space-y-2">
              {involvedDepts.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">business</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                    <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <InfoSummary deptCount={involvedDepts.length} memberCount={members.length} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Departemen Terlibat */}
      <SectionCard
        title="Departemen Terlibat"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowAddDeptModal(true)}>
            + Tambah Departemen
          </Button>
        }
      >
        {involvedDepts.length === 0 ? (
          <p className="text-sm text-secondary py-4 text-center">Belum ada departemen. Tambah departemen yang terlibat dalam proyek ini.</p>
        ) : (
          <div className="space-y-2">
            {involvedDepts.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">business</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                    <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeProjectDept(projectId, d.id)}
                  className="p-1.5 text-outline hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  title="Hapus departemen"
                >
                  <span className="material-symbols-outlined text-lg">remove_circle</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Section 2: Member per Department */}
      {involvedDepts.map((dept) => {
        const deptMembers = membersByDept.get(dept.id) || [];
        return (
          <SectionCard
            key={dept.id}
            title={`Anggota — ${dept.name}`}
            action={
              <Button variant="secondary" size="sm" onClick={() => { setSelectedDeptForMember(dept.id); setShowAddMemberModal(true); }}>
                + Tambah Member
              </Button>
            }
          >
            {deptMembers.length === 0 ? (
              <p className="text-sm text-secondary py-2">Belum ada anggota.</p>
            ) : (
              <div className="space-y-2">
                {deptMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {getUserName(m.userId).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{getUserName(m.userId)}</p>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold uppercase">
                          {getRoleName(m.roleId).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeProjMember(projectId, m.userId)}
                      className="p-1 text-outline hover:text-danger rounded-lg transition-colors"
                      title="Hapus anggota"
                    >
                      <span className="material-symbols-outlined text-lg">person_remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        );
      })}

      {/* Section 3: Info */}
      <InfoSummary deptCount={involvedDepts.length} memberCount={members.length} />

      {/* ── Add Department Modal ── */}
      <Modal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        title="Tambah Departemen"
        size="sm"
      >
        <div className="space-y-2">
          {availableDepts.length === 0 ? (
            <p className="text-sm text-secondary text-center py-4">Semua departemen sudah ditambahkan.</p>
          ) : (
            availableDepts.map((d) => (
              <button
                key={d.id}
                onClick={() => { addProjectDept(projectId, d.id); setShowAddDeptModal(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-surface-container-lowest transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">business</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{d.name}</p>
                  <p className="text-[10px] text-secondary uppercase">{d.code}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* ── Add Member Modal ── */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Tambah Anggota"
        size="sm"
      >
        {selectedDeptForMember && <AddMemberForm
          projectId={projectId}
          departmentId={selectedDeptForMember}
          assignedBy={userId || ''}
          onAdded={() => setShowAddMemberModal(false)}
        />}
      </Modal>
    </div>
  );
}

// ── Helper Components ──

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 p-4 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading-section text-sm sm:text-base text-on-surface font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoSummary({ deptCount, memberCount }: { deptCount: number; memberCount: number }) {
  const isComplete = deptCount > 0;
  return (
    <SectionCard title="Informasi Scope">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-surface-container rounded-xl text-center">
          <p className="text-2xl font-bold text-primary">{deptCount}</p>
          <p className="text-[10px] text-secondary uppercase">Departemen</p>
        </div>
        <div className="p-3 bg-surface-container rounded-xl text-center">
          <p className="text-2xl font-bold text-primary">{memberCount}</p>
          <p className="text-[10px] text-secondary uppercase">Anggota</p>
        </div>
        <div className="p-3 bg-surface-container rounded-xl text-center">
          {isComplete ? (
            <span className="material-symbols-outlined text-2xl text-success">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-2xl text-outline">hourglass_empty</span>
          )}
          <p className="text-[10px] text-secondary uppercase mt-1">{isComplete ? 'Lengkap' : 'Belum Lengkap'}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function AddMemberForm({ projectId, departmentId, assignedBy, onAdded }: {
  projectId: string;
  departmentId: string;
  assignedBy: string;
  onAdded: () => void;
}) {
  const addProjMember = useRbacStore((s) => s.addProjectMember);
  const masterUsers = useMasterDataStore((s) => s.users);
  const roles = useRbacStore((s) => s.roles);
  const projectMembers = useRbacStore((s) => s.projectMembers);
  const departments = useRbacStore((s) => s.departments);

  const dept = departments.find((d) => d.id === departmentId);
  const deptCode = dept?.code || '';

  // Filter users in this department (based on userRoles)
  const deptUserIds = useRbacStore((s) => s.userRoles)
    .filter((ur) => ur.scopeType === 'department' && ur.scopeId === departmentId)
    .map((ur) => ur.userId);

  const existingMemberIds = projectMembers
    .filter((pm) => pm.projectId === projectId)
    .map((pm) => pm.userId);

  const availableUsers = masterUsers.filter(
    (u) => deptUserIds.includes(u.id) && !existingMemberIds.includes(u.id)
  );

  const projectRoles = roles.filter(
    (r) => ['project_viewer', 'project_contributor', 'project_manager'].includes(r.name)
  );

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState(projectRoles[0]?.id || '');

  const handleAdd = () => {
    if (!selectedUser || !selectedRole) return;
    addProjMember(projectId, selectedUser, selectedRole, departmentId, assignedBy);
    onAdded();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">Pilih User</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm"
        >
          <option value="">— Pilih User —</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.branch})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-caption-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">Role</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm"
        >
          {projectRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="md" onClick={onAdded}>Batal</Button>
        <Button variant="primary" size="md" onClick={handleAdd} disabled={!selectedUser || !selectedRole}>
          Tambah
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/projects/tabs/ScopeTimTab.tsx
git commit -m "feat(rbac): add ScopeTimTab component for project scope management

PM can manage departments and members for a project. Read-only view
for non-PM users. Includes add/remove department and member modals.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: ProjectDetailPage — Add Scope & Tim Tab

**Files:**
- Modify: `frontend/src/features/projects/ProjectDetailPage.tsx`

**Interfaces:**
- Consumes: ScopeTimTab component, `authz.hasPermission()`
- Produces: Updated project detail with new "Scope & Tim" tab

- [ ] **Step 1: Import the new tab**

Add at the top with other tab imports:

```typescript
import ScopeTimTab from './tabs/ScopeTimTab';
```

- [ ] **Step 2: Add the tab to the tabs list**

Inside the `tabs` useMemo, find the items array. Add the "Scope & Tim" tab. It should be visible for tender-type projects (after Pemenang or before Timeline). Add it before the Timeline tab:

```typescript
      { label: 'Scope & Tim', path: 'scope-tim' },
```

Add it right before `{ label: 'Timeline', path: 'timeline' }` in the items array.

- [ ] **Step 3: Add the ScopeTimTab render**

In the tab panel content section, add after the other tab renders (before `</div>` closing of the non-locked wrapper):

```tsx
          {/* TAB: SCOPE & TIM */}
          {activeTab === 'Scope & Tim' && projectId && (
            <ScopeTimTab projectId={projectId} />
          )}
```

- [ ] **Step 4: Update unlock rules**

The Scope & Tim tab should be accessible whenever the user has `project:manage:scope` permission on the project. Add it to the `isTabLocked` check. The simplest approach is to treat it as always unlocked (like Timeline/Dokumen/Diskusi).

In the `isTabLocked` function, add:

```typescript
      // Scope & Tim: always unlocked for users with manage:scope permission
      if (tab.label === 'Scope & Tim') return false;
```

Add near the Timeline/Dokumen/Diskusi always-unlocked check.

Similarly, update the stepper's `isStepUnlocked` prop to always unlock this tab.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/projects/ProjectDetailPage.tsx
git commit -m "feat(rbac): add Scope & Tim tab to project detail

New tab for managing project scope. Visible for PM/manager users.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: AppLayout — Wire RBAC Permissions to Sidebar

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: authz engine
- Produces: Up-to-date permissions array for sidebar filtering

- [ ] **Step 1: Compute userPermissions from RBAC instead of old role system**

In AppLayout.tsx, replace the `roleConfig` and `userPermissions` derivation with:

```typescript
  // RBAC-based permissions for sidebar filtering
  const userId = (user as { id?: string })?.id;
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  const userPermissions = userId
    ? allPermissionsList.filter((p) => {
        const { authz: authzEngine } = require('@/services/authz');
        return authzEngine.hasPermission(userId, p, { departmentId: activeDeptId });
      })
    : [];
```

Where `allPermissionsList` is all known permission codes:

```typescript
const allPermissionsList = [
  'dashboard:view',
  'notification:read',
  'profile:manage',
  'prospect:read',
  'prospect:write:prospecting',
  'prospect:approve:transition',
  'project:read',
  'project:create',
  'project:write',
  'project:manage:members',
  'project:manage:scope',
  'pengadaan:read',
  'pengadaan:create',
  'pengadaan:write',
  'report:view:department',
  'report:view:crossdept',
];
```

Put this constant at module scope (outside the component).

Alternatively, to avoid excessive computation, a simpler approach is to keep the existing `userPermissions` derived from masterData roles for now, since the sidebar uses `filterNavItems` which checks permissions. The new RBAC nav-items use the new permission codes, so this will work correctly. We can optimize in a follow-up.

Let's keep the simpler approach — `userPermissions` stays as-is from masterData. The nav-items now use the new permission codes, and `PermissionRoute` handles actual gate checks.

Actually, to make this work correctly without breaking existing functionality, let's take a pragmatic approach:

In AppLayout.tsx, compute combined permissions from both old and new systems:

```typescript
  // Combine old and new permissions for backward-compatible filtering
  const oldRoleConfig = useMasterDataStore((s) => s.roles).find((r) => r.name === userRole);
  const oldPermissions = oldRoleConfig?.permissions || [];
  const newPermissions = userId
    ? (() => {
        const { authz: authzEngine } = require('@/services/authz');
        const activeDeptId = useAuthStore.getState().activeDepartmentId || (user as any)?.departmentId;
        return [
          'dashboard:view', 'notification:read', 'profile:manage',
          'prospect:read', 'prospect:write:prospecting', 'prospect:approve:transition',
          'project:read', 'project:create', 'project:write', 'project:manage:members',
          'pengadaan:read', 'pengadaan:create', 'pengadaan:write',
          'report:view:department', 'report:view:crossdept',
        ].filter((p) => authzEngine.hasPermission(userId, p, { departmentId: activeDeptId }));
      })()
    : [];
  const userPermissions = [...new Set([...oldPermissions, ...newPermissions])];
```

This is a bit verbose but ensures backward compatibility. Let's simplify — since the nav-items now use RBAC permission codes, let's compute from the authz engine only:

- [ ] **Step 2: Simplified AppLayout update**

Replace the roleConfig and userPermissions lines (lines 37-38) with:

```typescript
  const roleConfig = useMasterDataStore((s) => s.roles).find((r) => r.name === userRole);
  const oldPermissions = roleConfig?.permissions || [];
  const userId = (user as { id?: string })?.id;
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  // Combine old + new permissions for backward-compatible sidebar filtering
  const newRbacPerms = userId
    ? ['dashboard:view', 'notification:read', 'profile:manage', 'prospect:read', 'prospect:write:prospecting',
       'prospect:approve:transition', 'project:read', 'project:create', 'project:write', 'project:manage:members',
       'pengadaan:read', 'pengadaan:create', 'pengadaan:write',
       'report:view:department', 'report:view:crossdept'].filter((p) => {
         const { authz: authzEngine } = require('@/services/authz');
         return authzEngine.hasPermission(userId, p, { departmentId: activeDeptId });
       })
    : [];
  const userPermissions = [...new Set([...oldPermissions, ...newRbacPerms])];
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx
git commit -m "feat(rbac): wire RBAC permissions to AppLayout sidebar

Combine old and new permission systems for backward-compatible
sidebar menu filtering.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 15: Update router.tsx — Permission Routes

**Files:**
- Modify: `frontend/src/routes/router.tsx`

**Interfaces:**
- Consumes: Updated PermissionRoute (already uses authz from guards.tsx)
- Produces: Updated route permissions using new RBAC codes

- [ ] **Step 1: Update route permission codes**

The route definitions already use PermissionRoute with permission strings. Update them to use the new RBAC codes:

```typescript
// Dashboard
const DashboardPage = LazyLoadPermission(lazy(() => import('@/features/dashboard/DashboardPage')), ['dashboard:view']);

// Prospects
const ProspectsPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectsPage')), ['prospect:read']);
const ProspectFormPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectFormPage')), ['prospect:read']);
const ProspectDetailPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectDetailPage')), ['prospect:read']);

// Projects
const ProjectListPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectListPage')), ['project:read']);
const ProjectFormPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectFormPage')), ['project:create']);
const ProjectDetailPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectDetailPage')), ['project:read']);

// Procurement
const ProcurementListPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementListPage')), ['pengadaan:read']);
const ProcurementFormPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementFormPage')), ['pengadaan:create']);
const ProcurementDetailPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementDetailPage')), ['pengadaan:read']);

// Approvals
const ApprovalInboxPage = LazyLoadPermission(lazy(() => import('@/features/approvals/ApprovalInboxPage')), ['prospect:approve:transition']);

// Reports
const KPIDashboardPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIDashboardPage')), ['report:view:department']);
const KPIProgressPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIProgressPage')), ['report:view:department']);
const KPITargetsPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPITargetsPage')), ['report:view:department']);
const WinLossReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/WinLossReportPage')), ['report:view:department']);
const PipelineReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/PipelineReportPage')), ['report:view:department']);
const ReportsIndexPage = LazyLoadPermission(lazy(() => import('@/features/reports/ReportsIndexPage')), ['report:view:department']);
const CalendarPage = LazyLoadPermission(lazy(() => import('@/features/reports/CalendarPage')), ['report:view:department']);

// Notifications
const NotificationsPage = LazyLoad(lazy(() => import('@/features/notifications/NotificationsPage')));

// Profile
const ProfilePage = LazyLoad(lazy(() => import('@/features/profile/ProfilePage')));
```

Note: The old permission codes like `'prospek_view'`, `'proyek_view'`, `'laporan_view'` are replaced with the new RBAC codes like `'prospect:read'`, `'project:read'`, `'report:view:department'`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/routes/router.tsx
git commit -m "feat(rbac): update router.tsx with new RBAC permission codes

Replace old permission codes with new RBAC codes in all route
definitions.

Co-Authored-By: Claude <noreply@anthropic.com>"
```
