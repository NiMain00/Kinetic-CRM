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
  /** Previous department code that gets read-only access (nullable) */
  prevDepartmentCode?: string | null;
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
  { id: 'role-super-admin', name: 'super_admin', description: 'Super Admin — akses penuh ke seluruh sistem', is_system: true },
  { id: 'role-staff', name: 'staff', description: 'Staff department — akses operasional dasar', is_system: true },
  { id: 'role-manager', name: 'manager', description: 'Manager department — approve & monitor', is_system: true },
  { id: 'role-admin', name: 'admin', description: 'Admin department — full control', is_system: true },
  { id: 'role-director', name: 'director', description: 'Bisa lihat semua department', is_system: true },
  { id: 'role-supervisor', name: 'supervisor', description: 'Supervisor department — approve & monitor terbatas', is_system: true },
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
  { id: 'perm-config-access', code: 'config:access', name: 'Access Configuration', module: 'config' },
];

const SEED_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'stage-prospecting', code: 'prospecting', name: 'Prospecting', module: 'prospect', sequence: 1, ownerDepartmentCode: 'MARKETING', prevDepartmentCode: null },
  { id: 'stage-supervisor-review', code: 'supervisor_review', name: 'Supervisor Review', module: 'prospect', sequence: 1.5, ownerDepartmentCode: 'MARKETING', prevDepartmentCode: 'MARKETING' },
  { id: 'stage-waiting-pm', code: 'waiting_pm', name: 'Waiting Supervisor', module: 'prospect', sequence: 2, ownerDepartmentCode: 'PM', prevDepartmentCode: 'MARKETING' },
  { id: 'stage-in-project', code: 'in_project', name: 'In Project', module: 'project', sequence: 3, ownerDepartmentCode: 'PM', prevDepartmentCode: 'MARKETING' },
  { id: 'stage-pengadaan', code: 'pengadaan', name: 'Pengadaan', module: 'pengadaan', sequence: 4, ownerDepartmentCode: 'PROCUREMENT', prevDepartmentCode: 'PM' },
  { id: 'stage-delivery', code: 'delivery', name: 'Delivery', module: 'project', sequence: 5, ownerDepartmentCode: 'PM', prevDepartmentCode: 'PROCUREMENT' },
];

// Role-Permission mappings (roleId → permissionId[])
// Staff: dashboard:view, notification:read, profile:manage (global) + prospect:read, project:read, pengadaan:read (dept)
// Staff Marketing tambah: prospect:write:prospecting (dept)
// Manager tambah: project:create, project:write, project:manage:members, report:view:department (dept)
// Admin inherits all staff + manager through detection logic
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
  // ── Staff Procurement tambahan ──
  { id: 'rp-staff-prc-1', roleId: 'role-staff', permissionId: 'perm-pengadaan-create', scopeType: 'department', scopeId: 'dept-procurement', accessLevel: 'write' },
  { id: 'rp-staff-prc-2', roleId: 'role-staff', permissionId: 'perm-pengadaan-write', scopeType: 'department', scopeId: 'dept-procurement', accessLevel: 'write' },
  // ── Staff Marketing tambahan ──
  { id: 'rp-staff-mkt-1', roleId: 'role-staff', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
  // ── Manager (department) — inherits all staff permissions via individual role-permission ──
  { id: 'rp-mgr-dept-00a', roleId: 'role-manager', permissionId: 'perm-prospect-read', scopeType: 'department', accessLevel: 'read' },
  // Marketing manager also gets prospect write
  { id: 'rp-mgr-mkt-write', roleId: 'role-manager', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
  { id: 'rp-mgr-dept-0b', roleId: 'role-manager', permissionId: 'perm-project-read', scopeType: 'department', accessLevel: 'read' },
  { id: 'rp-mgr-dept-0c', roleId: 'role-manager', permissionId: 'perm-pengadaan-read', scopeType: 'department', accessLevel: 'read' },
  { id: 'rp-mgr-dept-1', roleId: 'role-manager', permissionId: 'perm-project-create', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-2', roleId: 'role-manager', permissionId: 'perm-project-write', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-3', roleId: 'role-manager', permissionId: 'perm-project-manage-members', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-4', roleId: 'role-manager', permissionId: 'perm-project-manage-scope', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-mgr-dept-5', roleId: 'role-manager', permissionId: 'perm-report-view-dept', scopeType: 'department', accessLevel: 'read' },
  { id: 'rp-mgr-dept-6', roleId: 'role-manager', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', accessLevel: 'write' },
  { id: 'rp-staff-mkt-2', roleId: 'role-staff', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
  // ── Admin (all permissions, global scope) — full access ──
  { id: 'rp-admin-global-1', roleId: 'role-admin', permissionId: 'perm-prospect-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-2', roleId: 'role-admin', permissionId: 'perm-prospect-write-prospecting', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-3', roleId: 'role-admin', permissionId: 'perm-prospect-approve-transition', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-4', roleId: 'role-admin', permissionId: 'perm-project-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-5', roleId: 'role-admin', permissionId: 'perm-project-create', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-6', roleId: 'role-admin', permissionId: 'perm-project-write', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-7', roleId: 'role-admin', permissionId: 'perm-project-manage-members', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-8', roleId: 'role-admin', permissionId: 'perm-project-manage-scope', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-9', roleId: 'role-admin', permissionId: 'perm-pengadaan-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-10', roleId: 'role-admin', permissionId: 'perm-pengadaan-create', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-11', roleId: 'role-admin', permissionId: 'perm-pengadaan-write', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-12', roleId: 'role-admin', permissionId: 'perm-report-view-dept', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-13', roleId: 'role-admin', permissionId: 'perm-report-view-crossdept', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-admin-global-14', roleId: 'role-admin', permissionId: 'perm-config-access', scopeType: 'global', accessLevel: 'write' },
  // ── Super Admin (global, all permissions, write) ──
  { id: 'rp-super-admin-1', roleId: 'role-super-admin', permissionId: 'perm-dash-view', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-2', roleId: 'role-super-admin', permissionId: 'perm-notif-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-3', roleId: 'role-super-admin', permissionId: 'perm-profile-manage', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-4', roleId: 'role-super-admin', permissionId: 'perm-prospect-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-5', roleId: 'role-super-admin', permissionId: 'perm-prospect-write-prospecting', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-6', roleId: 'role-super-admin', permissionId: 'perm-prospect-approve-transition', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-7', roleId: 'role-super-admin', permissionId: 'perm-project-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-8', roleId: 'role-super-admin', permissionId: 'perm-project-create', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-9', roleId: 'role-super-admin', permissionId: 'perm-project-write', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-10', roleId: 'role-super-admin', permissionId: 'perm-project-manage-members', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-11', roleId: 'role-super-admin', permissionId: 'perm-project-manage-scope', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-12', roleId: 'role-super-admin', permissionId: 'perm-pengadaan-read', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-13', roleId: 'role-super-admin', permissionId: 'perm-pengadaan-create', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-14', roleId: 'role-super-admin', permissionId: 'perm-pengadaan-write', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-15', roleId: 'role-super-admin', permissionId: 'perm-report-view-dept', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-16', roleId: 'role-super-admin', permissionId: 'perm-report-view-crossdept', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-super-admin-17', roleId: 'role-super-admin', permissionId: 'perm-config-access', scopeType: 'global', accessLevel: 'write' },
  // ── Director (global bypass) ──
  { id: 'rp-dir-global-1', roleId: 'role-director', permissionId: 'perm-prospect-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-2', roleId: 'role-director', permissionId: 'perm-project-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-3', roleId: 'role-director', permissionId: 'perm-pengadaan-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-4', roleId: 'role-director', permissionId: 'perm-report-view-crossdept', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-dir-global-5', roleId: 'role-director', permissionId: 'perm-config-access', scopeType: 'global', accessLevel: 'read' },
  // ── Supervisor (department) — khusus Marketing ──
  { id: 'rp-supervisor-1', roleId: 'role-supervisor', permissionId: 'perm-dash-view', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-supervisor-2', roleId: 'role-supervisor', permissionId: 'perm-notif-read', scopeType: 'global', accessLevel: 'read' },
  { id: 'rp-supervisor-3', roleId: 'role-supervisor', permissionId: 'perm-profile-manage', scopeType: 'global', accessLevel: 'write' },
  { id: 'rp-supervisor-4', roleId: 'role-supervisor', permissionId: 'perm-prospect-read', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'read' },
  { id: 'rp-supervisor-5', roleId: 'role-supervisor', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
  { id: 'rp-supervisor-6', roleId: 'role-supervisor', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
  { id: 'rp-supervisor-7', roleId: 'role-supervisor', permissionId: 'perm-project-read', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'read' },
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
  // Siti (user 5) → supervisor di Marketing
  { id: 'ur-5', userId: '5', roleId: 'role-supervisor', scopeType: 'department', scopeId: 'dept-marketing' },
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
  // Super Admin (usr-admin) → super_admin global (all permissions, all departments)
  { id: 'ur-admin', userId: 'usr-admin', roleId: 'role-super-admin', scopeType: 'global' },
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
      version: 9,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 2) {
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
        if (version < 3) {
          // v3: add prospect:approve:transition to role-manager and role-staff
          const updated = {
            ...current,
            rolePermissions: [
              ...(current.rolePermissions || []),
              { id: 'rp-mgr-dept-6', roleId: 'role-manager', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', accessLevel: 'write' },
              { id: 'rp-staff-mkt-2', roleId: 'role-staff', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
            ],
          };
          return updated;
        }
        if (version < 4) {
          // v4: add supervisor_review stage, fix staff-mkt scopeId, add manager prospect write
          const rolePerms = [...(current.rolePermissions || [])];
          // Fix rp-staff-mkt-1 scopeId to restrict to Marketing dept
          const fixIdx = rolePerms.findIndex((rp: any) => rp.id === 'rp-staff-mkt-1');
          if (fixIdx >= 0) rolePerms[fixIdx] = { ...rolePerms[fixIdx], scopeId: 'dept-marketing' };

          // Add manager prospect write permission (Marketing dept) if missing
          if (!rolePerms.find((rp: any) => rp.id === 'rp-mgr-mkt-write')) {
            rolePerms.push({ id: 'rp-mgr-mkt-write', roleId: 'role-manager', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' });
          }

          return {
            ...current,
            workflowStages: SEED_WORKFLOW_STAGES,
            rolePermissions: rolePerms,
          };
        }
        if (version < 5) {
          // v5: add config:access permission for admin/director
          const rolePerms = [...(current.rolePermissions || [])];
          const permissions = [...(current.permissions || [])];

          // Add config:access permission if missing
          if (!permissions.find((p: any) => p.code === 'config:access')) {
            permissions.push({ id: 'perm-config-access', code: 'config:access', name: 'Access Configuration', module: 'config' });
          }

          // Add role-permissions if missing
          if (!rolePerms.find((rp: any) => rp.id === 'rp-admin-global-14')) {
            rolePerms.push({ id: 'rp-admin-global-14', roleId: 'role-admin', permissionId: 'perm-config-access', scopeType: 'global', accessLevel: 'write' });
          }
          if (!rolePerms.find((rp: any) => rp.id === 'rp-dir-global-5')) {
            rolePerms.push({ id: 'rp-dir-global-5', roleId: 'role-director', permissionId: 'perm-config-access', scopeType: 'global', accessLevel: 'read' });
          }

          return { ...current, permissions, rolePermissions: rolePerms };
        }
        if (version < 6) {
          // v6: add procurement staff permissions, fix staff-mkt-2 scopeId
          const rolePerms = [...(current.rolePermissions || [])];

          // Fix rp-staff-mkt-2: add scopeId 'dept-marketing'
          const mkt2Idx = rolePerms.findIndex((rp: any) => rp.id === 'rp-staff-mkt-2');
          if (mkt2Idx >= 0) {
            rolePerms[mkt2Idx] = { ...rolePerms[mkt2Idx], scopeId: 'dept-marketing' };
          }

          // Add rp-staff-prc-1 if missing (pengadaan:create for procurement staff)
          if (!rolePerms.find((rp: any) => rp.id === 'rp-staff-prc-1')) {
            rolePerms.push(
              { id: 'rp-staff-prc-1', roleId: 'role-staff', permissionId: 'perm-pengadaan-create', scopeType: 'department', scopeId: 'dept-procurement', accessLevel: 'write' },
              { id: 'rp-staff-prc-2', roleId: 'role-staff', permissionId: 'perm-pengadaan-write', scopeType: 'department', scopeId: 'dept-procurement', accessLevel: 'write' },
            );
          }

          return { ...current, rolePermissions: rolePerms };
        }
        if (version < 7) {
          // v7: add super_admin role with all permissions
          const roles = [...(current.roles || [])];
          const rolePermissions = [...(current.rolePermissions || [])];
          const userRoles = [...(current.userRoles || [])];

          // Add super_admin role if not exists
          if (!roles.find((r: any) => r.id === 'role-super-admin')) {
            roles.push({ id: 'role-super-admin', name: 'super_admin', description: 'Super Admin — akses penuh ke seluruh sistem', is_system: true });
          }

          // Add all 17 permissions for super_admin if not exists
          const SUPER_ADMIN_PERMS = [
            { id: 'rp-super-admin-1', permissionId: 'perm-dash-view' },
            { id: 'rp-super-admin-2', permissionId: 'perm-notif-read' },
            { id: 'rp-super-admin-3', permissionId: 'perm-profile-manage' },
            { id: 'rp-super-admin-4', permissionId: 'perm-prospect-read' },
            { id: 'rp-super-admin-5', permissionId: 'perm-prospect-write-prospecting' },
            { id: 'rp-super-admin-6', permissionId: 'perm-prospect-approve-transition' },
            { id: 'rp-super-admin-7', permissionId: 'perm-project-read' },
            { id: 'rp-super-admin-8', permissionId: 'perm-project-create' },
            { id: 'rp-super-admin-9', permissionId: 'perm-project-write' },
            { id: 'rp-super-admin-10', permissionId: 'perm-project-manage-members' },
            { id: 'rp-super-admin-11', permissionId: 'perm-project-manage-scope' },
            { id: 'rp-super-admin-12', permissionId: 'perm-pengadaan-read' },
            { id: 'rp-super-admin-13', permissionId: 'perm-pengadaan-create' },
            { id: 'rp-super-admin-14', permissionId: 'perm-pengadaan-write' },
            { id: 'rp-super-admin-15', permissionId: 'perm-report-view-dept' },
            { id: 'rp-super-admin-16', permissionId: 'perm-report-view-crossdept' },
            { id: 'rp-super-admin-17', permissionId: 'perm-config-access' },
          ];
          for (const p of SUPER_ADMIN_PERMS) {
            if (!rolePermissions.find((rp: any) => rp.id === p.id)) {
              rolePermissions.push({ id: p.id, roleId: 'role-super-admin', permissionId: p.permissionId, scopeType: 'global', accessLevel: 'write' });
            }
          }

          // Update user assignment for usr-admin if still using role-admin
          const adminUrIdx = userRoles.findIndex((ur: any) => ur.userId === 'usr-admin' && ur.roleId === 'role-admin');
          if (adminUrIdx >= 0) {
            userRoles[adminUrIdx] = { ...userRoles[adminUrIdx], roleId: 'role-super-admin' };
          }

          return { ...current, roles, rolePermissions, userRoles };
        }
        if (version < 8) {
          // v8: add supervisor role with prospect approve permission
          const roles = [...(current.roles || [])];
          const rolePermissions = [...(current.rolePermissions || [])];
          const userRoles = [...(current.userRoles || [])];

          // Add supervisor role if not exists
          if (!roles.find((r: any) => r.id === 'role-supervisor')) {
            roles.push({ id: 'role-supervisor', name: 'supervisor', description: 'Supervisor department — approve & monitor terbatas', is_system: true });
          }

          // Add supervisor permissions if not exists
          const SUPERVISOR_PERMS = [
            { id: 'rp-supervisor-1', permissionId: 'perm-dash-view', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-2', permissionId: 'perm-notif-read', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-3', permissionId: 'perm-profile-manage', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-4', permissionId: 'perm-prospect-read', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-5', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-6', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-7', permissionId: 'perm-project-read', scopeType: 'department', scopeId: 'dept-marketing' },
          ];
          for (const p of SUPERVISOR_PERMS) {
            if (!rolePermissions.find((rp: any) => rp.id === p.id)) {
              rolePermissions.push({
                id: p.id,
                roleId: 'role-supervisor',
                permissionId: p.permissionId,
                scopeType: p.scopeType,
                scopeId: p.scopeId,
                accessLevel: p.permissionId === 'perm-notif-read' ? 'read' : 'write',
              });
            }
          }

          // Update Siti (user 5) to supervisor if still staff
          const sitiIdx = userRoles.findIndex((ur: any) => ur.userId === '5' && ur.roleId === 'role-staff');
          if (sitiIdx >= 0) {
            userRoles[sitiIdx] = { ...userRoles[sitiIdx], roleId: 'role-supervisor' };
          }

          return { ...current, roles, rolePermissions, userRoles };
        }
        if (version < 9) {
          // v9: ensure supervisor role exists (fixes case where localStorage had version 8
          // stored before migration v8 was added, skipping the v8 migration)
          const roles = [...(current.roles || [])];
          const rolePermissions = [...(current.rolePermissions || [])];
          const userRoles = [...(current.userRoles || [])];

          // Add supervisor role if not exists
          if (!roles.find((r: any) => r.id === 'role-supervisor')) {
            roles.push({ id: 'role-supervisor', name: 'supervisor', description: 'Supervisor department — approve & monitor terbatas', is_system: true });
          }

          // Add supervisor permissions if not exists
          const SUPERVISOR_PERMS = [
            { id: 'rp-supervisor-1', permissionId: 'perm-dash-view', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-2', permissionId: 'perm-notif-read', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-3', permissionId: 'perm-profile-manage', scopeType: 'global', scopeId: undefined },
            { id: 'rp-supervisor-4', permissionId: 'perm-prospect-read', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-5', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-6', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing' },
            { id: 'rp-supervisor-7', permissionId: 'perm-project-read', scopeType: 'department', scopeId: 'dept-marketing' },
          ];
          for (const p of SUPERVISOR_PERMS) {
            if (!rolePermissions.find((rp: any) => rp.id === p.id)) {
              rolePermissions.push({
                id: p.id,
                roleId: 'role-supervisor',
                permissionId: p.permissionId,
                scopeType: p.scopeType,
                scopeId: p.scopeId,
                accessLevel: p.permissionId === 'perm-notif-read' ? 'read' : 'write',
              });
            }
          }

          // Update Siti (user 5) to supervisor if still staff
          const sitiIdx = userRoles.findIndex((ur: any) => ur.userId === '5' && ur.roleId === 'role-staff');
          if (sitiIdx >= 0) {
            userRoles[sitiIdx] = { ...userRoles[sitiIdx], roleId: 'role-supervisor' };
          }

          return { ...current, roles, rolePermissions, userRoles };
        }
        return current;
      },
    },
  ),
);