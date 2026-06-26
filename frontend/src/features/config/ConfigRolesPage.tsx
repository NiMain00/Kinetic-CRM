import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';
import { useMasterDataStore, type MasterRole } from '@/stores/masterDataStore';

interface ModulePerm {
  key: string;
  label: string;
  shortLabel: string;
}

interface ModuleGroup {
  name: string;
  perms: ModulePerm[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    name: 'Dashboard',
    perms: [{ key: 'dashboard_view', label: 'Lihat Dashboard', shortLabel: 'View' }],
  },
  {
    name: 'Prospek',
    perms: [
      { key: 'prospek_view', label: 'Lihat Prospek', shortLabel: 'View' },
      { key: 'prospek_create', label: 'Buat Prospek', shortLabel: 'Create' },
      { key: 'prospek_edit', label: 'Edit Prospek', shortLabel: 'Edit' },
      { key: 'prospek_delete', label: 'Hapus Prospek', shortLabel: 'Delete' },
    ],
  },
  {
    name: 'Proyek',
    perms: [
      { key: 'proyek_view', label: 'Lihat Proyek', shortLabel: 'View' },
      { key: 'proyek_create', label: 'Buat Proyek', shortLabel: 'Create' },
      { key: 'proyek_edit', label: 'Edit Proyek', shortLabel: 'Edit' },
      { key: 'proyek_delete', label: 'Hapus Proyek', shortLabel: 'Delete' },
    ],
  },
  {
    name: 'Approval',
    perms: [
      { key: 'approval_process', label: 'Proses Approval', shortLabel: 'Process' },
      { key: 'approval_view', label: 'Lihat Approval', shortLabel: 'View' },
    ],
  },
  {
    name: 'KPI',
    perms: [
      { key: 'kpi_view', label: 'Lihat KPI', shortLabel: 'View' },
      { key: 'kpi_manage', label: 'Kelola KPI', shortLabel: 'Manage' },
    ],
  },
  {
    name: 'Laporan',
    perms: [{ key: 'laporan_view', label: 'Lihat Laporan', shortLabel: 'View' }],
  },
  {
    name: 'Master Data',
    perms: [{ key: 'master_data', label: 'Akses Master Data', shortLabel: 'Access' }],
  },
  {
    name: 'Pengguna',
    perms: [{ key: 'users_manage', label: 'Kelola Pengguna', shortLabel: 'Manage' }],
  },
  {
    name: 'Konfigurasi',
    perms: [{ key: 'config_access', label: 'Akses Konfigurasi', shortLabel: 'Access' }],
  },
  {
    name: 'Audit',
    perms: [{ key: 'audit_view', label: 'Lihat Audit', shortLabel: 'View' }],
  },
];

const ALL_PERM_KEYS = MODULE_GROUPS.flatMap(m => m.perms.map(p => p.key));

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-danger/10 text-danger',
  Admin: 'bg-status-purple/10 text-status-purple',
  PM: 'bg-primary/10 text-primary',
  'Branch Manager': 'bg-status-teal/10 text-status-teal',
  'Dept Head': 'bg-status-indigo/10 text-status-indigo',
  Management: 'bg-amber-100 text-amber-700',
  Reviewer: 'bg-warning/10 text-warning',
  Staff: 'bg-secondary-container/50 text-on-secondary-container',
};

export default function ConfigRolesPage() {
  const roles = useMasterDataStore((s) => s.roles);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);

  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
  }, [roles, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Nama role wajib diisi.');
      return;
    }
    const newRole: MasterRole = {
      id: `R-${String(roles.length + 1).padStart(2, '0')}`,
      name: formName,
      description: formDescription || formName,
      permissions: [],
    };
    addData('roles', newRole);
    toast.success(`Role ${formName} berhasil ditambahkan.`);
    setModalOpen(false);
    setFormName('');
    setFormDescription('');
  };

  const handleDelete = (id: string) => {
    const target = roles.find((r) => r.id === id);
    if (!target) return;
    deleteData('roles', id);
    toast.success(`Role ${target.name} berhasil dihapus.`);
    setDeleteConfirm(null);
  };

  const handleTogglePermission = (roleId: string, permKey: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    const hasPerm = role.permissions.includes(permKey);
    const newPerms = hasPerm
      ? role.permissions.filter(p => p !== permKey)
      : [...role.permissions, permKey];
    updateData<MasterRole>('roles', roleId, { permissions: newPerms });
  };

  const handleSelectAll = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    updateData<MasterRole>('roles', roleId, { permissions: ALL_PERM_KEYS });
    toast.success(`Semua izin diberikan untuk ${role.name}`);
  };

  const handleClearAll = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    updateData<MasterRole>('roles', roleId, { permissions: [] });
    toast.success(`Semua izin dihapus dari ${role.name}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
            <span className="font-semibold uppercase tracking-wider">Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Role & Permission</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">Manajemen Role & Permission</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Atur hak akses setiap peran pengguna dalam sistem.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={() => setModalOpen(true)}>
          Tambah Role
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search */}
          <div className="relative max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari role..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Role</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{roles.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Modul</p>
              <p className="text-xl font-extrabold text-primary mt-1">{MODULE_GROUPS.length}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left table-auto border-collapse">
                <thead>
                  {/* Row 1: Module group headers */}
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="px-3 py-2.5 sticky left-0 bg-slate-50 z-10 border-r border-border text-[10px] uppercase font-mono tracking-wider text-slate-450" rowSpan={2}>Role</th>
                    {MODULE_GROUPS.map(mg => (
                      <th key={mg.name} colSpan={mg.perms.length} className="px-1 py-2.5 text-center text-[10px] uppercase font-mono tracking-wider text-slate-450 border-r border-border last:border-r-0">{mg.name}</th>
                    ))}
                    <th className="px-3 py-2.5 text-right text-[10px] uppercase font-mono tracking-wider text-slate-450" rowSpan={2}>Aksi</th>
                  </tr>
                  {/* Row 2: Permission sub-headers */}
                  <tr className="bg-slate-50/50 border-b border-border">
                    {MODULE_GROUPS.flatMap(mg => mg.perms).map(p => (
                      <th key={p.key} className="px-1 py-2 text-center text-[9px] font-mono text-slate-400 border-r border-border last:border-r-0 whitespace-nowrap" title={p.label}>{p.shortLabel}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoles.map((r, idx) => {
                    const rowBg = idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white';
                    return (
                      <tr key={r.id} className={`${rowBg} hover:bg-slate-100/60 transition-colors`}>
                        <td className={`px-3 py-2.5 sticky left-0 z-10 border-r border-border ${rowBg}`}>
                          <div className="flex flex-col">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${ROLE_COLORS[r.name] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{r.name}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">{r.description}</span>
                          </div>
                        </td>
                        {MODULE_GROUPS.flatMap(mg => mg.perms).map(p => (
                          <td key={p.key} className="px-1 py-2.5 text-center border-r border-border last:border-r-0">
                            <input
                              type="checkbox"
                              checked={r.permissions.includes(p.key)}
                              onChange={() => handleTogglePermission(r.id, p.key)}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                              aria-label={`${r.name} - ${p.label}`}
                              title={`${r.name}: ${p.label}`}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[9px] text-slate-400 font-mono" title="Jumlah izin aktif">{r.permissions.length}/{ALL_PERM_KEYS.length}</span>
                            <button onClick={() => handleSelectAll(r.id)} className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold hover:bg-primary/20 transition-colors cursor-pointer" title="Pilih semua izin">All</button>
                            <button onClick={() => handleClearAll(r.id)} className="px-2 py-1 bg-danger/10 text-danger rounded text-[9px] font-bold hover:bg-danger/20 transition-colors cursor-pointer" title="Hapus semua izin">None</button>
                            <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer" title="Hapus Role">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredRoles.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                {searchQuery ? `Tidak ada role yang cocok dengan "${searchQuery}".` : 'Belum ada role. Klik "Tambah Role" untuk membuat role baru.'}
              </div>
            )}
          </div>

          <div className="bg-surface-container-low border border-border rounded-xl p-5">
            <h4 className="font-bold text-xs text-slate-700 mb-3">Keterangan Modul</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {MODULE_GROUPS.map(mg => (
                <div key={mg.name} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-600">{mg.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mg.perms.map(p => (
                      <span key={p.key} className="text-[9px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-border">{p.shortLabel}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Role Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-5 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Nama Role *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Finance Manager" required />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Deskripsi</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" rows={3} placeholder="Deskripsi role" />
          </div>
        </form>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleCreate}>Buat Role</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-2">Hapus Role?</h3>
            <p className="text-xs text-slate-500 mb-4">Role yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
