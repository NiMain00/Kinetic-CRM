import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';
import { useMasterDataStore, type MasterRole } from '@/stores/masterDataStore';
import { masterDataService } from '@/services/master-data';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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
    perms: [{ key: 'dashboard:view', label: 'Lihat Dashboard', shortLabel: 'Lihat' }],
  },
  {
    name: 'Prospek',
    perms: [
      { key: 'prospect:read', label: 'Lihat Prospek', shortLabel: 'Lihat' },
      { key: 'prospect:create', label: 'Buat Prospek', shortLabel: 'Buat' },
      { key: 'prospect:edit', label: 'Edit Prospek', shortLabel: 'Sunting' },
      { key: 'prospect:delete', label: 'Hapus Prospek', shortLabel: 'Hapus' },
    ],
  },
  {
    name: 'Proyek',
    perms: [
      { key: 'project:read', label: 'Lihat Proyek', shortLabel: 'Lihat' },
      { key: 'project:create', label: 'Buat Proyek', shortLabel: 'Buat' },
      { key: 'project:edit', label: 'Edit Proyek', shortLabel: 'Sunting' },
      { key: 'project:delete', label: 'Hapus Proyek', shortLabel: 'Hapus' },
    ],
  },
  {
    name: 'Pengadaan',
    perms: [
      { key: 'pengadaan:read', label: 'Lihat Pengadaan', shortLabel: 'Lihat' },
      { key: 'pengadaan:create', label: 'Buat Pengadaan', shortLabel: 'Buat' },
      { key: 'pengadaan:write', label: 'Edit Pengadaan', shortLabel: 'Sunting' },
      { key: 'pengadaan:delete', label: 'Hapus Pengadaan', shortLabel: 'Hapus' },
    ],
  },
  {
    name: 'Persetujuan',
    perms: [
      { key: 'prospect:approve:transition', label: 'Proses Persetujuan', shortLabel: 'Proses' },
      { key: 'approval:view', label: 'Lihat Persetujuan', shortLabel: 'Lihat' },
    ],
  },
  {
    name: 'KPI',
    perms: [
      { key: 'kpi:view', label: 'Lihat KPI', shortLabel: 'Lihat' },
      { key: 'kpi:manage', label: 'Kelola KPI', shortLabel: 'Kelola' },
    ],
  },
  {
    name: 'Laporan',
    perms: [      { key: 'report:view:department', label: 'Lihat Laporan', shortLabel: 'Lihat' }],
  },
  {
    name: 'Data Master',
    perms: [      { key: 'config:access', label: 'Akses Data Master', shortLabel: 'Akses' }],
  },
  {
    name: 'Pengguna',
    perms: [      { key: 'users:manage', label: 'Kelola Pengguna', shortLabel: 'Kelola' }],
  },
  {
    name: 'Konfigurasi',
    perms: [      { key: 'config:access', label: 'Akses Konfigurasi', shortLabel: 'Akses' }],
  },
  {
    name: 'Audit',
    perms: [      { key: 'audit:view', label: 'Lihat Audit', shortLabel: 'Lihat' }],
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
  const deleteData = useMasterDataStore((s) => s.deleteData);

  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const filteredRoles = useMemo(() => {
    if (!debouncedSearch.trim()) return roles;
    const q = debouncedSearch.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
  }, [roles, debouncedSearch]);

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

  /** Get current permissions for a role, checking draft first */
  const getRolePerms = (roleId: string): string[] => {
    if (roleId in draftPermissions) return draftPermissions[roleId];
    return roles.find(r => r.id === roleId)?.permissions ?? [];
  };

  const hasDraftChanges = Object.keys(draftPermissions).length > 0;
  const draftCount = Object.keys(draftPermissions).length;

  const handleTogglePermission = (roleId: string, permKey: string) => {
    const currentPerms = getRolePerms(roleId);
    const hasPerm = currentPerms.includes(permKey);
    const newPerms = hasPerm
      ? currentPerms.filter(p => p !== permKey)
      : [...currentPerms, permKey];

    // Compare with original to decide if we need a draft entry
    const original = roles.find(r => r.id === roleId)?.permissions ?? [];
    const isSame = original.length === newPerms.length && original.every(p => newPerms.includes(p));

    setDraftPermissions(prev => {
      const next = { ...prev };
      if (isSame) {
        delete next[roleId];
      } else {
        next[roleId] = newPerms;
      }
      return next;
    });
  };

  const handleSelectAll = (roleId: string) => {
    const original = roles.find(r => r.id === roleId)?.permissions ?? [];
    const isSame = ALL_PERM_KEYS.length === original.length && original.every(p => ALL_PERM_KEYS.includes(p));

    setDraftPermissions(prev => {
      const next = { ...prev };
      if (isSame) {
        delete next[roleId];
      } else {
        next[roleId] = [...ALL_PERM_KEYS];
      }
      return next;
    });
  };

  const handleClearAll = (roleId: string) => {
    const original = roles.find(r => r.id === roleId)?.permissions ?? [];
    setDraftPermissions(prev => {
      const next = { ...prev };
      if (original.length === 0) {
        delete next[roleId];
      } else {
        next[roleId] = [];
      }
      return next;
    });
  };

  const handleApplyChanges = async () => {
    setSaving(true);
    const entries = Object.entries(draftPermissions);

    try {
      // Update store state
      const currentRoles = useMasterDataStore.getState().roles;
      const updatedRoles = currentRoles.map(role => {
        if (role.id in draftPermissions) {
          return { ...role, permissions: draftPermissions[role.id] };
        }
        return role;
      });

      useMasterDataStore.setState({ roles: updatedRoles });

      // Simpan setiap perubahan role ke database melalui API
      for (const [roleId, perms] of entries) {
        await masterDataService.update('roles', roleId, { permissions: perms });
      }

      // Refresh data dari API untuk memastikan konsistensi
      await useMasterDataStore.getState().fetchEntity('roles');

      setDraftPermissions({});
      setSaving(false);
      toast.success(`${entries.length} role berhasil diperbarui.`);
    } catch (e) {
      console.error('Gagal menyimpan ke database:', e);
      setSaving(false);
      toast.error('Gagal menyimpan perubahan. Silakan coba lagi.');
    }
  };

  const handleCancelChanges = () => {
    setDraftPermissions({});
    toast('Perubahan dibatalkan.', { icon: 'ℹ️' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">Manajemen Role & Izin</h2>
          <p className="text-[11px] text-outline mt-0.5">Atur hak akses setiap peran pengguna dalam sistem.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={() => setModalOpen(true)}>
          Tambah Role
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search */}
          <div className="relative max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari role..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Peran</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{roles.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Modul</p>
              <p className="text-xl font-extrabold text-primary mt-1">{MODULE_GROUPS.length}</p>
            </div>
          </div>

          {/* Update/Cancel Bar */}
          {hasDraftChanges && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-sm">edit_note</span>
                <span className="text-xs font-semibold text-amber-800">
                  {draftCount} role dengan perubahan yang belum disimpan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCancelChanges} disabled={saving}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyChanges} disabled={saving} leftIcon={saving ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-xs text-left table-auto border-collapse">
                <thead>
                  {/* Row 1: Module group headers */}
                  <tr className="bg-surface-container-low border-b border-border">
                    <th className="px-3 py-2.5 sticky left-0 bg-surface-container-low z-10 border-r border-border text-[10px] uppercase font-mono tracking-wider text-slate-450" rowSpan={2}>Peran</th>
                    {MODULE_GROUPS.map(mg => (
                      <th key={mg.name} colSpan={mg.perms.length} className="px-1 py-2.5 text-center text-[10px] uppercase font-mono tracking-wider text-slate-450 border-r border-border last:border-r-0">{mg.name}</th>
                    ))}
                    <th className="px-3 py-2.5 text-right text-[10px] uppercase font-mono tracking-wider text-slate-450" rowSpan={2}>Aksi</th>
                  </tr>
                  {/* Row 2: Permission sub-headers */}
                  <tr className="bg-surface-container-low/50 border-b border-border">
                    {MODULE_GROUPS.flatMap(mg => mg.perms).map(p => (
                      <th key={p.key} className="px-1 py-2 text-center text-[9px] font-mono text-outline border-r border-border last:border-r-0 whitespace-nowrap" title={p.label}>{p.shortLabel}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoles.map((r, idx) => {
                    const rowBg = idx % 2 === 1 ? 'bg-surface-container-low/40' : 'bg-surface-container-lowest';
                    return (
                      <tr key={r.id} className={`${rowBg} hover:bg-surface-container/60 transition-colors`}>
                        <td className={`px-3 py-2.5 sticky left-0 z-10 border-r border-border ${rowBg}`}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${ROLE_COLORS[r.name] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{r.name}</span>
                              {r.id in draftPermissions && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">Tertunda</span>
                              )}
                            </div>
                            <span className="text-[9px] text-outline mt-0.5">{r.description}</span>
                          </div>
                        </td>
                        {MODULE_GROUPS.flatMap(mg => mg.perms).map(p => (
                          <td key={p.key} className="px-1 py-2.5 text-center border-r border-border last:border-r-0">
                            <input
                              type="checkbox"
                              checked={getRolePerms(r.id).includes(p.key)}
                              onChange={() => handleTogglePermission(r.id, p.key)}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                              aria-label={`${r.name} - ${p.label}`}
                              title={`${r.name}: ${p.label}`}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[9px] text-outline font-mono" title="Jumlah izin aktif">{getRolePerms(r.id).length}/{ALL_PERM_KEYS.length}</span>
                            <button onClick={() => handleSelectAll(r.id)} className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold hover:bg-primary/20 transition-colors cursor-pointer" title="Pilih semua izin">Semua</button>
                            <button onClick={() => handleClearAll(r.id)} className="px-2 py-1 bg-danger/10 text-danger rounded text-[9px] font-bold hover:bg-danger/20 transition-colors cursor-pointer" title="Hapus semua izin">Tidak Ada</button>
                            <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus Role">
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
              <div className="p-8 text-center text-xs text-outline">
                {searchQuery ? `Tidak ada peran yang cocok dengan "${searchQuery}".` : 'Belum ada peran. Klik "Tambah Role" untuk membuat peran baru.'}
              </div>
            )}
          </div>

          <div className="bg-surface-container-low border border-border rounded-xl p-5">
            <h4 className="font-bold text-xs text-on-surface mb-3">Keterangan Modul</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {MODULE_GROUPS.map(mg => (
                <div key={mg.name} className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant">{mg.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mg.perms.map(p => (
                      <span key={p.key} className="text-[9px] text-outline bg-surface-container-lowest px-1.5 py-0.5 rounded border border-border">{p.shortLabel}</span>
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
                <label className="font-semibold text-on-surface block">Nama Peran *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Finance Manager" required />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Deskripsi</label>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-on-surface mb-2">Hapus Role?</h3>
            <p className="text-xs text-secondary mb-4">Role yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
