import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';
import { useRbacStore } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';
import type { RbacDepartment, RbacRole, RbacUserRole, RbacRolePermission, RbacPermission, WorkflowStage } from '@/stores/rbacStore';

// ── Constants ──

const SCOPE_LABELS: Record<string, string> = {
  global: 'Global',
  department: 'Department',
  project: 'Project',
};

const ACCESS_LABELS: Record<string, string> = {
  read: 'Read',
  write: 'Write',
};

const MODULE_GROUPS: { name: string; perms: { code: string; label: string }[] }[] = [
  { name: 'Dashboard', perms: [{ code: 'dashboard:view', label: 'View' }] },
  { name: 'Notification', perms: [{ code: 'notification:read', label: 'Read' }] },
  { name: 'Profile', perms: [{ code: 'profile:manage', label: 'Manage' }] },
  { name: 'Prospek', perms: [
    { code: 'prospect:read', label: 'Read' },
    { code: 'prospect:write:prospecting', label: 'Write (Prospecting)' },
    { code: 'prospect:approve:transition', label: 'Approve Transition' },
  ]},
  { name: 'Proyek', perms: [
    { code: 'project:read', label: 'Read' },
    { code: 'project:create', label: 'Create' },
    { code: 'project:write', label: 'Write' },
    { code: 'project:manage:members', label: 'Manage Members' },
    { code: 'project:manage:scope', label: 'Manage Scope' },
  ]},
  { name: 'Pengadaan', perms: [
    { code: 'pengadaan:read', label: 'Read' },
    { code: 'pengadaan:create', label: 'Create' },
    { code: 'pengadaan:write', label: 'Write' },
  ]},
  { name: 'Report', perms: [
    { code: 'report:view:department', label: 'View Dept' },
    { code: 'report:view:crossdept', label: 'View Cross Dept' },
  ]},
  { name: 'Config', perms: [{ code: 'config:access', label: 'Access' }] },
];

const ALL_PERM_CODES = MODULE_GROUPS.flatMap(m => m.perms.map(p => p.code));

type TabId = 'departments' | 'roles' | 'assignments' | 'permissions' | 'stages';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'departments', label: 'Departemen', icon: 'account_tree' },
  { id: 'roles', label: 'Roles', icon: 'badge' },
  { id: 'assignments', label: 'User Assignments', icon: 'assignment_ind' },
  { id: 'permissions', label: 'Role Permissions', icon: 'shield' },
  { id: 'stages', label: 'Stage Rules', icon: 'alt_route' },
];

// ── Helpers ──

const DEPT_COLORS: Record<string, string> = {
  IT: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
  HC: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300',
  FINANCE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300',
  PROCUREMENT: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300',
  MARKETING: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300',
  PM: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300',
};

const ROLE_BADGES: Record<string, string> = {
  staff: 'bg-surface-container-high text-on-surface-variant',
  manager: 'bg-primary/10 text-primary',
  admin: 'bg-status-purple/10 text-status-purple',
  director: 'bg-status-maroon/10 text-status-maroon',
  project_viewer: 'bg-blue-50 text-blue-700',
  project_contributor: 'bg-teal-50 text-teal-700',
  project_manager: 'bg-amber-50 text-amber-700',
};

// ── Component ──

export default function ConfigAccessControlPage() {
  const [activeTab, setActiveTab] = useState<TabId>('departments');

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display-title text-base font-extrabold text-on-surface">Access Control</h2>
            <p className="text-[11px] text-outline mt-0.5">Konfigurasi RBAC — departemen, role, user, permission, dan stage workflow</p>
          </div>
        </div>

        {/* Tab Nav */}
        <nav className="flex gap-1 mt-4 border-b border-border -mb-[1.25rem] px-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-outline hover:text-on-surface-variant hover:border-border'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'departments' && <DepartmentsTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'assignments' && <UserAssignmentsTab />}
          {activeTab === 'permissions' && <RolePermissionsTab />}
          {activeTab === 'stages' && <StageRulesTab />}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: Departments
// ════════════════════════════════════════════════════════════════

function DepartmentsTab() {
  const departments = useRbacStore((s) => s.departments);
  const addDepartment = useRbacStore((s) => s.addDepartment);
  const updateDepartment = useRbacStore((s) => s.updateDepartment);
  const deleteDepartment = useRbacStore((s) => s.deleteDepartment);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openCreate = () => {
    setEditingId(null);
    setFormName(''); setFormCode(''); setFormDesc(''); setFormActive(true);
    setShowModal(true);
  };

  const openEdit = (d: RbacDepartment) => {
    setEditingId(d.id);
    setFormName(d.name); setFormCode(d.code); setFormDesc(d.description || ''); setFormActive(d.is_active);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName || !formCode) { toast.error('Nama dan kode wajib diisi'); return; }
    if (editingId) {
      updateDepartment(editingId, { name: formName, code: formCode.toUpperCase(), description: formDesc, is_active: formActive });
      toast.success('Departemen diupdate');
    } else {
      addDepartment({ name: formName, code: formCode.toUpperCase(), description: formDesc, is_active: formActive });
      toast.success('Departemen ditambahkan');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteDepartment(id);
    toast.success('Departemen dihapus');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Daftar Departemen</h3>
          <p className="text-[11px] text-outline">{departments.length} departemen terdaftar</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={openCreate}>
          Tambah Departemen
        </Button>
      </div>

      <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-container-low border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-secondary">Kode</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Nama</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Deskripsi</th>
              <th className="text-center px-4 py-3 font-semibold text-secondary">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-secondary">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {departments.map((d) => (
              <tr key={d.id} className="hover:bg-surface-container/40 transition-colors">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${DEPT_COLORS[d.code] || 'bg-surface-container text-on-surface-variant'}`}>
                    {d.code}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-on-surface">{d.name}</td>
                <td className="px-4 py-3 text-outline">{d.description || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${d.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {d.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => { if (confirm(`Hapus ${d.name}?`)) handleDelete(d.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-danger transition-colors cursor-pointer" title="Hapus">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-outline text-xs">Belum ada departemen</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Departemen' : 'Tambah Departemen'} size="sm">
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold">Kode *</label>
            <input value={formCode} onChange={e => setFormCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase" placeholder="CONTOH" />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Nama *</label>
            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nama departemen" />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Deskripsi</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-xs" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" id="dept-active" />
            <label htmlFor="dept-active" className="font-semibold">Aktif</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: Roles
// ════════════════════════════════════════════════════════════════

function RolesTab() {
  const roles = useRbacStore((s) => s.roles);
  const addRole = useRbacStore((s) => s.addRole);
  const updateRole = useRbacStore((s) => s.updateRole);
  const deleteRole = useRbacStore((s) => s.deleteRole);

  const userRoles = useRbacStore((s) => s.userRoles);
  const rolePermissions = useRbacStore((s) => s.rolePermissions);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const roleUsage = useMemo(() => {
    const assigned = new Set(userRoles.map(ur => ur.roleId));
    const permCount: Record<string, number> = {};
    rolePermissions.forEach(rp => {
      permCount[rp.roleId] = (permCount[rp.roleId] || 0) + 1;
    });
    return { assigned, permCount };
  }, [userRoles, rolePermissions]);

  const openCreate = () => {
    setEditingId(null); setFormName(''); setFormDesc(''); setShowModal(true);
  };

  const openEdit = (r: RbacRole) => {
    setEditingId(r.id); setFormName(r.name); setFormDesc(r.description || ''); setShowModal(true);
  };

  const handleSave = () => {
    if (!formName) { toast.error('Nama role wajib diisi'); return; }
    const slug = formName.toLowerCase().replace(/\s+/g, '_');
    if (editingId) {
      updateRole(editingId, { name: slug, description: formDesc });
      toast.success('Role diupdate');
    } else {
      addRole({ name: slug, description: formDesc, is_system: false });
      toast.success('Role ditambahkan');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (roleUsage.assigned.has(id)) {
      toast.error('Tidak bisa hapus — masih ada user yang menggunakan role ini');
      return;
    }
    deleteRole(id);
    toast.success('Role dihapus');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Daftar Role</h3>
          <p className="text-[11px] text-outline">{roles.length} role terdaftar</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={openCreate}>
          Tambah Role
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((r) => {
          const isSystem = r.is_system;
          return (
            <div key={r.id} className="bg-surface-container-lowest border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_BADGES[r.name] || 'bg-surface-container text-on-surface-variant'}`}>
                    {r.name.replace(/_/g, ' ')}
                  </span>
                  {isSystem && <span className="text-[9px] text-outline bg-surface-container px-1.5 py-0.5 rounded">System</span>}
                </div>
                <div className="flex gap-1">
                  {!isSystem && (
                    <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary cursor-pointer" title="Edit">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  )}
                  {!isSystem && (
                    <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-danger cursor-pointer" title="Hapus">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-outline mb-3">{r.description || '-'}</p>
              <div className="flex items-center gap-3 text-[10px] text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  {userRoles.filter(ur => ur.roleId === r.id).length} user
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  {roleUsage.permCount[r.id] || 0} permissions
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Role' : 'Tambah Role'} size="sm">
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold">Nama *</label>
            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="contoh: manager" />
            <p className="text-[9px] text-outline">Akan disimpan sebagai slug: {formName.toLowerCase().replace(/\s+/g, '_')}</p>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Deskripsi</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-xs" rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: User Assignments
// ════════════════════════════════════════════════════════════════

function UserAssignmentsTab() {
  const masterUsers = useMasterDataStore((s) => s.users);
  const departments = useRbacStore((s) => s.departments);
  const roles = useRbacStore((s) => s.roles);
  const userRoles = useRbacStore((s) => s.userRoles);
  const assignUserRole = useRbacStore((s) => s.assignUserRole);
  const removeUserRole = useRbacStore((s) => s.removeUserRole);

  const [showModal, setShowModal] = useState(false);
  const [selUserId, setSelUserId] = useState('');
  const [selRoleId, setSelRoleId] = useState('');
  const [selScopeType, setSelScopeType] = useState<RbacUserRole['scopeType']>('department');
  const [selScopeId, setSelScopeId] = useState('');

  const nonProjectRoles = roles.filter(r => !['project_viewer', 'project_contributor', 'project_manager'].includes(r.name));

  const handleAssign = () => {
    if (!selUserId || !selRoleId) { toast.error('Pilih user dan role'); return; }
    assignUserRole(selUserId, selRoleId, selScopeType, selScopeType === 'global' ? undefined : selScopeId);
    toast.success('Role berhasil diassign');
    setShowModal(false);
    setSelUserId(''); setSelRoleId(''); setSelScopeType('department'); setSelScopeId('');
  };

  const handleRemove = (urId: string) => {
    removeUserRole(urId);
    toast.success('Assignment dihapus');
  };

  // Group assignments by user
  const groupedAssignments = useMemo(() => {
    const groups: { user: typeof masterUsers[0]; userRoles: RbacUserRole[] }[] = [];
    for (const mu of masterUsers) {
      const urs = userRoles.filter(ur => ur.userId === mu.id);
      if (urs.length > 0) {
        groups.push({ user: mu, userRoles: urs });
      }
    }
    // Also include any assigned user not in masterUsers
    const assignedIds = new Set(userRoles.map(ur => ur.userId));
    const masterIds = new Set(masterUsers.map(u => u.id));
    for (const uid of assignedIds) {
      if (!masterIds.has(uid)) {
        groups.push({
          user: { id: uid, name: uid, role: '-', branch: '-', username: uid, email: '', active: true } as any,
          userRoles: userRoles.filter(ur => ur.userId === uid),
        });
      }
    }
    return groups.sort((a, b) => a.user.name.localeCompare(b.user.name));
  }, [masterUsers, userRoles]);

  const getUserName = (uid: string) => masterUsers.find(u => u.id === uid)?.name || uid;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">User → Role Assignments</h3>
          <p className="text-[11px] text-outline">{groupedAssignments.length} user memiliki role assignment</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={() => {
          setSelUserId(''); setSelRoleId(''); setSelScopeType('department'); setSelScopeId('');
          setShowModal(true);
        }}>
          Assign Role
        </Button>
      </div>

      <div className="space-y-3">
        {groupedAssignments.map(({ user, userRoles: urs }) => (
          <div key={user.id} className="bg-surface-container-lowest border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                <p className="text-[10px] text-outline">@{user.username} • {user.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {urs.map(ur => {
                const role = roles.find(r => r.id === ur.roleId);
                const dept = departments.find(d => d.id === ur.scopeId);
                return (
                  <div key={ur.id} className="flex items-center gap-1.5 bg-surface-container rounded-lg px-2.5 py-1.5 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ROLE_BADGES[role?.name || ''] || 'bg-surface-container-high text-on-surface-variant'}`}>
                      {role?.name.replace(/_/g, ' ') || ur.roleId}
                    </span>
                    <span className="text-outline px-1">/</span>
                    <span className={`text-[9px] font-semibold ${SCOPE_LABELS[ur.scopeType] === 'Global' ? 'text-status-purple' : 'text-secondary'}`}>
                      {SCOPE_LABELS[ur.scopeType] || ur.scopeType}
                    </span>
                    {ur.scopeId && dept && (
                      <>
                        <span className="text-outline">•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${DEPT_COLORS[dept.code] || ''}`}>
                          {dept.code}
                        </span>
                      </>
                    )}
                    <button onClick={() => handleRemove(ur.id)} className="ml-1 p-0.5 rounded hover:bg-red-50 text-secondary hover:text-danger cursor-pointer" title="Remove">
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groupedAssignments.length === 0 && (
          <div className="text-center py-10 text-outline text-xs">Belum ada assignment</div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Role ke User" size="sm">
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold">User *</label>
            <select value={selUserId} onChange={e => setSelUserId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
              <option value="">Pilih user...</option>
              {masterUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Role *</label>
            <select value={selRoleId} onChange={e => setSelRoleId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
              <option value="">Pilih role...</option>
              {nonProjectRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')} {r.is_system ? '(System)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Scope Type *</label>
            <select value={selScopeType} onChange={e => setSelScopeType(e.target.value as RbacUserRole['scopeType'])} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
              <option value="global">Global</option>
              <option value="department">Department</option>
            </select>
          </div>
          {selScopeType === 'department' && (
            <div className="space-y-1.5">
              <label className="font-semibold">Department *</label>
              <select value={selScopeId} onChange={e => setSelScopeId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
                <option value="">Pilih department...</option>
                {departments.filter(d => d.is_active).map(d => (
                  <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleAssign}>Assign</Button>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: Role Permissions
// ════════════════════════════════════════════════════════════════

function RolePermissionsTab() {
  const permissions = useRbacStore((s) => s.permissions);
  const roles = useRbacStore((s) => s.roles);
  const rolePermissions = useRbacStore((s) => s.rolePermissions);
  const addRolePermission = useRbacStore((s) => s.addRolePermission);
  const removeRolePermission = useRbacStore((s) => s.removeRolePermission);

  // Only show non-project roles for this grid
  const deptRoles = roles.filter(r => !['project_viewer', 'project_contributor', 'project_manager'].includes(r.name));

  // Build a lookup: roleId → permissionId → RbacRolePermission
  const permMap = useMemo(() => {
    const map: Record<string, Record<string, RbacRolePermission>> = {};
    for (const rp of rolePermissions) {
      if (!map[rp.roleId]) map[rp.roleId] = {};
      map[rp.roleId][rp.permissionId] = rp;
    }
    return map;
  }, [rolePermissions]);

  /** Draft state: per key {roleId}:{permissionId} → 'add' | 'remove' | null (no draft) */
  const [draftChanges, setDraftChanges] = useState<Record<string, 'add' | 'remove' | null>>({});

  const hasDraft = Object.values(draftChanges).some(v => v !== null);

  const getPermStatus = (roleId: string, permCode: string): { assigned: boolean; rp?: RbacRolePermission } => {
    const perm = permissions.find(p => p.code === permCode);
    if (!perm) return { assigned: false };
    const rp = permMap[roleId]?.[perm.id];
    return { assigned: !!rp, rp };
  };

  /** Get effective checked state (store + draft combined) */
  const getEffectiveChecked = (roleId: string, permId: string): boolean => {
    const key = `${roleId}:${permId}`;
    const draft = draftChanges[key];
    if (draft === 'add') return true;
    if (draft === 'remove') return false;
    // No draft → use original store state
    return !!permMap[roleId]?.[permId];
  };

  const handleToggle = (roleId: string, permCode: string) => {
    const perm = permissions.find(p => p.code === permCode);
    if (!perm) return;
    const key = `${roleId}:${perm.id}`;
    const originalAssigned = !!permMap[roleId]?.[perm.id];
    const isCurrentlyChecked = getEffectiveChecked(roleId, perm.id);

    setDraftChanges(prev => {
      const next = { ...prev };
      if (isCurrentlyChecked) {
        // Want to uncheck
        if (!originalAssigned) {
          // Original is already unchecked → clear draft (revert to original)
          next[key] = null;
        } else {
          next[key] = 'remove';
        }
      } else {
        // Want to check
        if (originalAssigned) {
          // Original is already checked → clear draft (revert to original)
          next[key] = null;
        } else {
          next[key] = 'add';
        }
      }
      return next;
    });
  };

  const handleApply = () => {
    let count = 0;
    for (const [key, action] of Object.entries(draftChanges)) {
      if (!action) continue;
      const [, permissionId] = key.split(':');
      const roleId = key.split(':')[0];
      if (action === 'add') {
        addRolePermission(roleId, permissionId, 'department', undefined);
        count++;
      } else {
        const rp = permMap[roleId]?.[permissionId];
        if (rp) { removeRolePermission(rp.id); count++; }
      }
    }
    setDraftChanges({});
    toast.success(`${count} perubahan diterapkan`);
  };

  const handleCancel = () => {
    setDraftChanges({});
    toast('Perubahan dibatalkan', { icon: 'ℹ️' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Permission Matrix</h3>
          <p className="text-[11px] text-outline">Atur permission untuk setiap role</p>
        </div>
        {hasDraft && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancel}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleApply}>Terapkan Perubahan</Button>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-xs table-auto border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-border">
              <th className="px-3 py-2.5 sticky left-0 bg-surface-container-low z-10 border-r border-border text-[10px] uppercase font-mono tracking-wider text-secondary text-left">Role</th>
              {MODULE_GROUPS.map(mg => (
                <th key={mg.name} colSpan={mg.perms.length} className="px-1 py-2.5 text-center text-[9px] uppercase font-mono tracking-wider text-secondary border-r border-border last:border-r-0">
                  {mg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deptRoles.map((r, idx) => {
              const rowBg = idx % 2 === 1 ? 'bg-surface-container-low/40' : 'bg-surface-container-lowest';
              return (
                <tr key={r.id} className={`${rowBg} hover:bg-surface-container/60 transition-colors`}>
                  <td className={`px-3 py-2.5 sticky left-0 z-10 border-r border-border ${rowBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_BADGES[r.name] || 'bg-surface-container text-on-surface-variant'}`}>
                        {r.name.replace(/_/g, ' ')}
                      </span>
                      {r.is_system && <span className="text-[8px] text-outline">S</span>}
                    </div>
                  </td>
                  {MODULE_GROUPS.flatMap(mg => mg.perms).map(p => {
                      const perm = permissions.find(pm => pm.code === p.code);
                      const checked = perm ? getEffectiveChecked(r.id, perm.id) : false;
                      const key = `${r.id}:${perm?.id}`;
                      const isDrafted = draftChanges[key] !== undefined && draftChanges[key] !== null;
                      return (
                        <td key={p.code} className="px-1 py-2.5 text-center border-r border-border last:border-r-0">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggle(r.id, p.code)}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                              title={`${r.name} → ${p.label}`}
                            />
                            {isDrafted && (
                              <span className="ml-1 text-[8px] text-amber-600 font-bold">*</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-surface-container-low border border-border rounded-xl p-4">
        <h4 className="font-bold text-xs text-on-surface mb-2">Keterangan Permission</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {permissions.map(p => (
            <span key={p.id} className="text-[9px] text-outline bg-surface-container-lowest px-2 py-1 rounded border border-border">
              <span className="font-semibold text-on-surface-variant">{p.code}</span> — {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: Stage Rules
// ════════════════════════════════════════════════════════════════

function StageRulesTab() {
  const workflowStages = useRbacStore((s) => s.workflowStages);
  const departments = useRbacStore((s) => s.departments);
  const addStage = useRbacStore((s) => s.addStage);
  const updateStage = useRbacStore((s) => s.updateStage);
  const deleteStage = useRbacStore((s) => s.deleteStage);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formModule, setFormModule] = useState('project');
  const [formSeq, setFormSeq] = useState(1);
  const [formOwner, setFormOwner] = useState('');
  const [formPrev, setFormPrev] = useState('');
  const [showModal, setShowModal] = useState(false);

  const activeDepts = departments.filter(d => d.is_active);

  const stagesSorted = useMemo(() =>
    [...workflowStages].sort((a, b) => a.sequence - b.sequence),
    [workflowStages],
  );

  const openCreate = () => {
    setEditingId(null);
    setFormCode(''); setFormName(''); setFormModule('project');
    setFormSeq(stagesSorted.length + 1);
    setFormOwner(''); setFormPrev('');
    setShowModal(true);
  };

  const openEdit = (s: WorkflowStage) => {
    setEditingId(s.id);
    setFormCode(s.code); setFormName(s.name); setFormModule(s.module);
    setFormSeq(s.sequence); setFormOwner(s.ownerDepartmentCode);
    setFormPrev(s.prevDepartmentCode || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formCode || !formName || !formOwner) { toast.error('Kode, nama, dan owner wajib diisi'); return; }
    if (editingId) {
      updateStage(editingId, {
        code: formCode, name: formName, module: formModule, sequence: formSeq,
        ownerDepartmentCode: formOwner, prevDepartmentCode: formPrev || null,
      });
      toast.success('Stage diupdate');
    } else {
      addStage({
        code: formCode, name: formName, module: formModule, sequence: formSeq,
        ownerDepartmentCode: formOwner, prevDepartmentCode: formPrev || null,
      });
      toast.success('Stage ditambahkan');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteStage(id);
    toast.success('Stage dihapus');
  };

  const getOwnerDeptName = (code: string) => {
    const d = departments.find(dept => dept.code === code);
    return d ? `${d.code} — ${d.name}` : code;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Workflow Stage Rules</h3>
          <p className="text-[11px] text-outline">Tentukan department owner dan prev-read untuk setiap stage</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={openCreate}>
          Tambah Stage
        </Button>
      </div>

      {/* Visual flow diagram */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {stagesSorted.map((s, idx) => {
            const owner = departments.find(d => d.code === s.ownerDepartmentCode);
            const prev = s.prevDepartmentCode ? departments.find(d => d.code === s.prevDepartmentCode) : null;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center min-w-[140px] shrink-0">
                  <div className={`w-full rounded-lg border-2 p-3 text-center ${
                    owner ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface-container'
                  }`}>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      owner ? (DEPT_COLORS[owner.code] || '') : ''
                    }`}>
                      {s.ownerDepartmentCode}
                    </span>
                    <p className="text-xs font-bold text-on-surface mt-1">{s.name}</p>
                    <p className="text-[9px] text-outline font-mono mt-0.5">{s.code}</p>
                    <p className="text-[9px] text-outline mt-0.5">Seq: {s.sequence}</p>
                    {prev && (
                      <p className="text-[8px] text-outline mt-1 border-t border-border/60 pt-1">
                        ← Prev: {prev.code}
                      </p>
                    )}
                    {!prev && (
                      <p className="text-[8px] text-outline mt-1 border-t border-border/60 pt-1 italic">No prev access</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary cursor-pointer" title="Edit">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <button onClick={() => { if (confirm('Hapus stage ini?')) handleDelete(s.id); }} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-danger cursor-pointer" title="Hapus">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
                {idx < stagesSorted.length - 1 && (
                  <div className="flex items-center shrink-0 px-1">
                    <span className="material-symbols-outlined text-outline text-lg">arrow_forward</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Table view */}
      <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-container-low border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-secondary">Sequence</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Nama</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Module</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Owner (Write)</th>
              <th className="text-left px-4 py-3 font-semibold text-secondary">Prev (Read)</th>
              <th className="text-right px-4 py-3 font-semibold text-secondary">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stagesSorted.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container/40 transition-colors">
                <td className="px-4 py-3 font-mono text-secondary">{s.sequence}</td>
                <td className="px-4 py-3 font-mono font-medium text-on-surface">{s.code}</td>
                <td className="px-4 py-3 text-on-surface">{s.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[9px] font-semibold">{s.module}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${DEPT_COLORS[s.ownerDepartmentCode] || 'bg-surface-container text-on-surface-variant'}`}>
                    {getOwnerDeptName(s.ownerDepartmentCode)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.prevDepartmentCode ? (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${DEPT_COLORS[s.prevDepartmentCode] || 'bg-surface-container text-on-surface-variant'}`}>
                      {getOwnerDeptName(s.prevDepartmentCode)}
                    </span>
                  ) : (
                    <span className="text-outline italic">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer" title="Edit">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => { if (confirm(`Hapus stage ${s.name}?`)) handleDelete(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-danger transition-colors cursor-pointer" title="Hapus">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Stage' : 'Tambah Stage'} size="md">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold">Kode *</label>
              <input value={formCode} onChange={e => setFormCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono" placeholder="example_stage" />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold">Sequence *</label>
              <input type="number" value={formSeq} onChange={e => setFormSeq(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" min={1} step={0.5} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Nama *</label>
            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nama stage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold">Module</label>
              <select value={formModule} onChange={e => setFormModule(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
                <option value="prospect">Prospect</option>
                <option value="project">Project</option>
                <option value="pengadaan">Pengadaan</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold">Owner Department *</label>
              <select value={formOwner} onChange={e => setFormOwner(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
                <option value="">Pilih...</option>
                {activeDepts.map(d => (
                  <option key={d.id} value={d.code}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold">Previous Department (Read Only)</label>
            <select value={formPrev} onChange={e => setFormPrev(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest">
              <option value="">— Tidak ada —</option>
              {activeDepts.map(d => (
                <option key={d.id} value={d.code}>{d.code} — {d.name}</option>
              ))}
            </select>
            <p className="text-[9px] text-outline">Department sebelumnya akan mendapat akses read-only di stage ini</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}
