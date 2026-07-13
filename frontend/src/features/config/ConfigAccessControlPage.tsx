import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';
import { useRbacStore } from '@/stores/rbacStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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

const MODULE_ORDER = [
  'dashboard', 'notification', 'profile', 'user', 'prospect', 'project',
  'customer', 'pengadaan', 'report', 'config', 'master', 'rbac', 'rks', 'lphs', 'settings',
];

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  notification: 'Notification',
  profile: 'Profile',
  user: 'User',
  prospect: 'Prospek',
  project: 'Proyek',
  customer: 'Customer',
  pengadaan: 'Pengadaan',
  report: 'Report',
  config: 'Config',
  master: 'Master Data',
  rbac: 'RBAC',
  rks: 'RKS',
  lphs: 'LPHS',
  settings: 'Settings',
};

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
  super_admin: 'bg-danger/10 text-danger',
  staff: 'bg-surface-container-high text-on-surface-variant',
  supervisor: 'bg-warning/10 text-warning',
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

  const fetchRoles = useRbacStore((s) => s.fetchRoles);
  const fetchPermissions = useRbacStore((s) => s.fetchPermissions);
  const fetchDepartments = useRbacStore((s) => s.fetchDepartments);
  const fetchStages = useRbacStore((s) => s.fetchStages);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchDepartments();
    fetchStages();
  }, [fetchRoles, fetchPermissions, fetchDepartments, fetchStages]);

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

  const handleSave = async () => {
    if (!formName || !formCode) { toast.error('Nama dan kode wajib diisi'); return; }
    try {
      if (editingId) {
        await updateDepartment(editingId, { name: formName, code: formCode.toUpperCase(), description: formDesc, is_active: formActive });
        toast.success('Departemen diupdate');
      } else {
        await addDepartment({ name: formName, code: formCode.toUpperCase(), description: formDesc, is_active: formActive });
        toast.success('Departemen ditambahkan');
      }
      setShowModal(false);
    } catch {
      toast.error('Gagal menyimpan departemen');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id);
      toast.success('Departemen dihapus');
    } catch {
      toast.error('Gagal menghapus departemen');
    }
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

  const handleSave = async () => {
    if (!formName) { toast.error('Nama role wajib diisi'); return; }
    const slug = formName.toLowerCase().replace(/\s+/g, '_');
    try {
      if (editingId) {
        await updateRole(editingId, { name: slug, description: formDesc });
        toast.success('Role diupdate');
      } else {
        await addRole({ name: slug, description: formDesc, is_system: false });
        toast.success('Role ditambahkan');
      }
      setShowModal(false);
    } catch {
      toast.error('Gagal menyimpan role');
    }
  };

  const handleDelete = async (id: string) => {
    if (roleUsage.assigned.has(id)) {
      toast.error('Tidak bisa hapus — masih ada user yang menggunakan role ini');
      return;
    }
    try {
      await deleteRole(id);
      toast.success('Role dihapus');
    } catch {
      toast.error('Gagal menghapus role');
    }
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

  const nonProjectRoles = roles.filter(r => !['role-pm-viewer', 'role-pm-contrib', 'role-pm-manager'].includes(r.id));

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
    return groups.sort((a, b) => (a.user.name || '').localeCompare(b.user.name || ''));
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
                {user.name?.charAt(0) || '?'}
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
//  TAB: Role Permissions (improved: search, collapse, stats, scope)
// ════════════════════════════════════════════════════════════════

function RolePermissionsTab() {
  const permissions = useRbacStore((s) => s.permissions);
  const roles = useRbacStore((s) => s.roles);
  const rolePermissions = useRbacStore((s) => s.rolePermissions);
  const departments = useRbacStore((s) => s.departments);
  const applyRolePermissions = useRbacStore((s) => s.applyRolePermissions);
  const fetchPermissions = useRbacStore((s) => s.fetchPermissions);

  // Derive the matrix columns directly from the permissions loaded from the DB,
  // so every permission becomes a column regardless of any hardcoded codes.
  const moduleGroups = useMemo(() => {
    const byModule: Record<string, RbacPermission[]> = {};
    for (const p of permissions) {
      (byModule[p.module] = byModule[p.module] || []).push(p);
    }
    const ordered: { name: string; module: string; perms: { code: string; label: string }[] }[] = [];
    for (const m of MODULE_ORDER) {
      if (byModule[m]) {
        ordered.push({
          name: MODULE_LABELS[m] || m,
          module: m,
          perms: byModule[m].map(p => ({ code: p.code, label: p.name })),
        });
      }
    }
    for (const m of Object.keys(byModule)) {
      if (!MODULE_ORDER.includes(m)) {
        ordered.push({
          name: MODULE_LABELS[m] || m,
          module: m,
          perms: byModule[m].map(p => ({ code: p.code, label: p.name })),
        });
      }
    }
    return ordered;
  }, [permissions]);

  const ALL_PERM_CODES = useMemo(
    () => moduleGroups.flatMap(g => g.perms.map(p => p.code)),
    [moduleGroups],
  );

  const permDescription = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of permissions) {
      map[p.code] = p.description || p.name;
    }
    return map;
  }, [permissions]);

  // Only show non-project roles for this grid
  const deptRoles = roles.filter(r => !['role-pm-viewer', 'role-pm-contrib', 'role-pm-manager'].includes(r.id));

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

  // Collapsible module groups
  const [collapsedMods, setCollapsedMods] = useState<Record<string, boolean>>({});
  const toggleModule = (name: string) =>
    setCollapsedMods(prev => ({ ...prev, [name]: !prev[name] }));

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Scope type preference for newly added permissions
  const [defaultScope, setDefaultScope] = useState<'department' | 'global'>('department');

  // Filtered groups & flattened perm list
  const filteredGroups = useMemo(() => {
    if (!debouncedSearch.trim()) return moduleGroups;
    const q = debouncedSearch.toLowerCase();
    return moduleGroups.map(mg => ({
      ...mg,
      perms: mg.perms.filter(p =>
        p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q) || mg.name.toLowerCase().includes(q)
      ),
    })).filter(mg => mg.perms.length > 0);
  }, [debouncedSearch]);

  // Stats per role (assigned / total)
  const roleStats = useMemo(() => {
    const stats: Record<string, { assigned: number; total: number }> = {};
    for (const role of deptRoles) {
      const total = ALL_PERM_CODES.length;
      const assigned = ALL_PERM_CODES.filter(code => {
        const perm = permissions.find(p => p.code === code);
        return perm && !!permMap[role.id]?.[perm.id];
      }).length;
      stats[role.id] = { assigned, total };
    }
    return stats;
  }, [deptRoles, permissions, permMap]);

  // Stats per permission (how many roles have it assigned)
  const permStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const code of ALL_PERM_CODES) {
      const perm = permissions.find(p => p.code === code);
      if (!perm) continue;
      let count = 0;
      for (const role of deptRoles) {
        if (permMap[role.id]?.[perm.id]) count++;
      }
      stats[code] = count;
    }
    return stats;
  }, [deptRoles, permissions, permMap]);

  // Draft summary counts
  const draftSummary = useMemo(() => {
    let adds = 0, removes = 0;
    for (const [, action] of Object.entries(draftChanges)) {
      if (action === 'add') adds++;
      else if (action === 'remove') removes++;
    }
    return { adds, removes };
  }, [draftChanges]);

  /** Get effective checked state (store + draft combined) */
  const getEffectiveChecked = (roleId: string, permId: string): boolean => {
    const key = `${roleId}:${permId}`;
    const draft = draftChanges[key];
    if (draft === 'add') return true;
    if (draft === 'remove') return false;
    return !!permMap[roleId]?.[permId];
  };

  /** Get scope badge info for an assigned permission */
  const getScopeBadge = (roleId: string, permId: string): { label: string; color: string } | null => {
    const rp = permMap[roleId]?.[permId];
    if (!rp) return null;
    if (rp.scopeType === 'global') return { label: 'G', color: 'bg-status-purple/10 text-status-purple border-status-purple/20' };
    if (rp.scopeId) {
      const dept = departments.find(d => d.id === rp.scopeId);
      if (dept) return { label: dept.code.slice(0, 2), color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: 'D', color: 'bg-primary/10 text-primary border-primary/20' };
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
        if (!originalAssigned) next[key] = null;
        else next[key] = 'remove';
      } else {
        if (originalAssigned) next[key] = null;
        else next[key] = 'add';
      }
      return next;
    });
  };

  /** Toggle all permissions in a module for a single role */
  const handleToggleModule = (roleId: string, mg: typeof moduleGroups[0], checked: boolean) => {
    setDraftChanges(prev => {
      const next = { ...prev };
      for (const pDef of mg.perms) {
        const perm = permissions.find(pm => pm.code === pDef.code);
        if (!perm) continue;
        const key = `${roleId}:${perm.id}`;
        const originalAssigned = !!permMap[roleId]?.[perm.id];
        if (checked && !originalAssigned) next[key] = 'add';
        else if (!checked && originalAssigned) next[key] = 'remove';
        else if (next[key] !== undefined) next[key] = null;
      }
      return next;
    });
  };

  const handleApply = async () => {
    try {
      await applyRolePermissions(draftChanges, defaultScope);
      setDraftChanges({});
      toast.success('Permission berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan permission');
    }
  };

  const handleCancel = () => {
    setDraftChanges({});
    toast('Perubahan dibatalkan', { icon: 'ℹ️' });
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Permission Matrix</h3>
          <p className="text-[11px] text-outline">
            Atur permission untuk setiap role &bull; {deptRoles.length} role, {ALL_PERM_CODES.length} permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Scope type selector */}
          <div className="flex items-center gap-1.5 bg-surface-container border border-border rounded-lg px-2.5 py-1.5">
            <span className="text-[9px] text-outline font-semibold uppercase">Scope:</span>
            <select
              value={defaultScope}
              onChange={e => setDefaultScope(e.target.value as 'department' | 'global')}
              className="text-[10px] bg-transparent border-none outline-none font-semibold text-on-surface cursor-pointer"
            >
              <option value="department">Department</option>
              <option value="global">Global</option>
            </select>
          </div>
          {hasDraft && (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel}>Batal</Button>
              <Button variant="primary" size="sm" onClick={handleApply}>
                Terapkan ({draftSummary.adds + draftSummary.removes})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Draft Summary Bar ── */}
      {hasDraft && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs">
          <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">edit_note</span>
          <span className="text-amber-800 dark:text-amber-300 font-semibold">Perubahan Tertunda:</span>
          {draftSummary.adds > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
              +{draftSummary.adds} tambah
            </span>
          )}
          {draftSummary.removes > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold">
              -{draftSummary.removes} hapus
            </span>
          )}
          <span className="text-outline ml-auto text-[9px]">Scope: {defaultScope}</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {permissions.length === 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-warning/30 bg-warning/5 text-xs text-on-surface-variant">
          <span>
            Data permission belum dimuat. Pastikan seeding sudah dijalankan (<code>npx prisma db seed</code>) dan login ulang.
          </span>
          <button
            onClick={() => fetchPermissions()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold"
          >
            Muat ulang
          </button>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari permission berdasarkan nama atau kode…"
          className="w-full pl-8 pr-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* ── Role Coverage Stats ── */}
      <div className="flex flex-wrap gap-2">
        {deptRoles.map(role => {
          const st = roleStats[role.id];
          if (!st) return null;
          const pct = st.total > 0 ? Math.round((st.assigned / st.total) * 100) : 0;
          return (
            <div key={role.id} className="flex items-center gap-1.5 bg-surface-container-lowest border border-border rounded-lg px-2.5 py-1.5 text-[10px]">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${ROLE_BADGES[role.name] || ''}`}>
                {role.name.replace(/_/g, ' ')}
              </span>
              <span className="text-outline">
                <span className="font-bold text-on-surface-variant">{st.assigned}</span>/{st.total}
              </span>
              <div className="w-10 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Permission Matrix Table ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-xs table-auto border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-border">
              <th className="px-3 py-2.5 sticky left-0 bg-surface-container-low z-20 border-r border-border text-[10px] uppercase font-mono tracking-wider text-secondary text-left min-w-[130px]">
                Role
              </th>
              {filteredGroups.map(mg => (
                <th
                  key={mg.name}
                  colSpan={mg.perms.length}
                  className="px-1 py-0 border-r border-border last:border-r-0 relative align-top"
                >
                  {/* Collapse toggle button */}
                  <button
                    onClick={() => toggleModule(mg.name)}
                    className="w-full flex items-center justify-center gap-1 px-1.5 py-2 text-[9px] uppercase font-mono tracking-wider text-secondary hover:text-on-surface transition-colors cursor-pointer"
                    title={collapsedMods[mg.name] ? 'Perluas modul' : 'Ciutkan modul'}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {collapsedMods[mg.name] ? 'expand_more' : 'expand_less'}
                    </span>
                    {mg.name}
                    {mg.perms.length > 1 && (
                      <span className="text-[7px] text-outline ml-0.5">({mg.perms.length})</span>
                    )}
                  </button>

                  {/* Sub-header: permission labels */}
                  {!collapsedMods[mg.name] && (
                    <div className="flex border-t border-border/50">
                      {mg.perms.map(pDef => (
                        <div
                          key={pDef.code}
                          className="flex-1 px-1 py-1 text-center text-[7px] text-outline font-semibold truncate border-r border-border/30 last:border-r-0"
                          title={`${pDef.code} — ${pDef.label}`}
                        >
                          {pDef.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: adoption count per permission */}
                  {!collapsedMods[mg.name] && (
                    <div className="flex border-t border-border/50 bg-surface-container-low/60">
                      {mg.perms.map(pDef => {
                        const cnt = permStats[pDef.code] || 0;
                        return (
                          <div
                            key={pDef.code}
                            className="flex-1 px-1 py-1 text-center text-[6px] text-outline border-r border-border/30 last:border-r-0"
                          >
                            {cnt}/{deptRoles.length}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deptRoles.map((r, idx) => {
              const rowBg = idx % 2 === 1 ? 'bg-surface-container-low/40' : 'bg-surface-container-lowest';
              const st = roleStats[r.id];
              return (
                <tr key={r.id} className={`${rowBg} hover:bg-surface-container/60 transition-colors`}>
                  <td className={`px-3 py-1.5 sticky left-0 z-10 border-r border-border ${rowBg}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_BADGES[r.name] || 'bg-surface-container text-on-surface-variant'}`}>
                        {r.name.replace(/_/g, ' ')}
                      </span>
                      {r.is_system && <span className="text-[7px] text-outline bg-surface-container px-1 rounded">SYS</span>}
                      {st && (
                        <span className="text-[7px] text-outline ml-auto">
                          {st.assigned}/{st.total}
                        </span>
                      )}
                    </div>
                  </td>
                  {filteredGroups.map(mg => {
                    if (collapsedMods[mg.name]) {
                      // Collapsed: show summary cell with expand button
                      const assigned = mg.perms.filter(pDef => {
                        const perm = permissions.find(pm => pm.code === pDef.code);
                        return perm && getEffectiveChecked(r.id, perm.id);
                      }).length;
                      return (
                        <td
                          key={mg.name}
                          colSpan={mg.perms.length}
                          className="px-2 py-1.5 text-center border-r border-border last:border-r-0 align-middle"
                        >
                          <button
                            onClick={() => toggleModule(mg.name)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-[9px] text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">expand_more</span>
                            {assigned}/{mg.perms.length} aktif
                          </button>
                        </td>
                      );
                    }
                    // Expanded: show individual permission cells
                    return mg.perms.map(pDef => {
                      const perm = permissions.find(pm => pm.code === pDef.code);
                      if (!perm) return <td key={pDef.code} className="px-1 py-1.5 text-center border-r border-border last:border-r-0" />;

                      const checked = getEffectiveChecked(r.id, perm.id);
                      const key = `${r.id}:${perm.id}`;
                      const isAdd = draftChanges[key] === 'add';
                      const isRemove = draftChanges[key] === 'remove';
                      const isDrafted = isAdd || isRemove;
                      const scopeBadge = getScopeBadge(r.id, perm.id);

                      return (
                        <td
                          key={pDef.code}
                          className="px-1 py-1.5 text-center border-r border-border last:border-r-0 align-middle"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="relative inline-flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggle(r.id, pDef.code)}
                                className={`w-4 h-4 rounded focus:ring-primary cursor-pointer ${
                                  isAdd
                                    ? 'border-amber-400 text-amber-500 accent-amber-500'
                                    : isRemove
                                    ? 'border-red-400 text-red-500 accent-red-500'
                                    : 'text-primary border-border accent-primary'
                                }`}
                                title={`${r.name.replace(/_/g, ' ')} — ${pDef.label}\n${pDef.code}\n${permDescription[pDef.code] || ''}`}
                              />
                              {/* Draft indicator dot */}
                              {isDrafted && (
                                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-amber-400 border border-white dark:border-surface" />
                              )}
                            </div>
                            {/* Scope badge */}
                            {scopeBadge && (
                              <span className={`px-1 py-[1px] rounded text-[6px] font-bold border leading-tight ${scopeBadge.color}`}>
                                {scopeBadge.label}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    });
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="bg-surface-container-low border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-xs text-on-surface">Keterangan Permission</h4>
          <div className="flex items-center gap-3 text-[9px] text-outline">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-status-purple/30 border border-status-purple/50" />
              Global
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-primary/30 border border-primary/50" />
              Dept (all)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-300 border border-amber-500" />
              Dept specific
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {moduleGroups.map(mg => (
            <div key={mg.name} className="space-y-0.5">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider px-1 pt-1">{mg.name}</p>
              {mg.perms.map(pDef => (
                <div
                  key={pDef.code}
                  className="group relative flex items-center gap-1.5 text-[9px] text-outline bg-surface-container-lowest px-2 py-1 rounded border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                  <span className="font-semibold text-on-surface-variant shrink-0">{pDef.code}</span>
                  <span className="text-border/60">—</span>
                  <span className="truncate">{pDef.label}</span>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30">
                    <div className="bg-surface-container-high text-on-surface text-[9px] px-2 py-1 rounded-lg shadow-lg border border-border whitespace-nowrap">
                      {permDescription[pDef.code] || pDef.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

  const handleSave = async () => {
    if (!formCode || !formName || !formOwner) { toast.error('Kode, nama, dan owner wajib diisi'); return; }
    try {
      if (editingId) {
        await updateStage(editingId, {
          code: formCode, name: formName, module: formModule, sequence: formSeq,
          ownerDepartmentCode: formOwner, prevDepartmentCode: formPrev || null,
        });
        toast.success('Stage diupdate');
      } else {
        await addStage({
          code: formCode, name: formName, module: formModule, sequence: formSeq,
          ownerDepartmentCode: formOwner, prevDepartmentCode: formPrev || null,
        });
        toast.success('Stage ditambahkan');
      }
      setShowModal(false);
    } catch {
      toast.error('Gagal menyimpan stage');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStage(id);
      toast.success('Stage dihapus');
    } catch {
      toast.error('Gagal menghapus stage');
    }
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
