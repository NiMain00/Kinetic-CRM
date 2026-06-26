import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/ui';
import { useMasterDataStore, type MasterRole } from '@/stores/masterDataStore';

interface Permission {
  key: string;
  label: string;
}

const ALL_PERMISSIONS: Permission[] = [
  { key: 'dashboard_view', label: 'Dashboard' },
  { key: 'prospek_view', label: 'Prospek - Lihat' },
  { key: 'prospek_create', label: 'Prospek - Buat' },
  { key: 'prospek_edit', label: 'Prospek - Edit' },
  { key: 'prospek_delete', label: 'Prospek - Hapus' },
  { key: 'proyek_view', label: 'Proyek - Lihat' },
  { key: 'proyek_create', label: 'Proyek - Buat' },
  { key: 'proyek_edit', label: 'Proyek - Edit' },
  { key: 'proyek_delete', label: 'Proyek - Hapus' },
  { key: 'approval_process', label: 'Approval - Proses' },
  { key: 'approval_view', label: 'Approval - Lihat' },
  { key: 'kpi_view', label: 'KPI - Lihat' },
  { key: 'kpi_manage', label: 'KPI - Kelola' },
  { key: 'laporan_view', label: 'Laporan - Lihat' },
  { key: 'master_data', label: 'Master Data' },
  { key: 'users_manage', label: 'Pengguna - Kelola' },
  { key: 'config_access', label: 'Konfigurasi - Akses' },
  { key: 'audit_view', label: 'Audit - Lihat' },
];

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
    updateData<MasterRole>('roles', roleId, { permissions: ALL_PERMISSIONS.map(p => p.key) });
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Role</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{roles.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Modul</p>
              <p className="text-xl font-extrabold text-primary mt-1">{ALL_PERMISSIONS.length}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-4 py-3.5 sticky left-0 bg-slate-50 z-10">Role</th>
                    {ALL_PERMISSIONS.map(p => (
                      <th key={p.key} className="px-2 py-3.5 text-center text-[9px] whitespace-nowrap" title={p.label}>{p.label.split(' - ')[0]}</th>
                    ))}
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roles.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <div className="flex flex-col">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit badge-compact ${ROLE_COLORS[r.name] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{r.name}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{r.description}</span>
                        </div>
                      </td>
                      {ALL_PERMISSIONS.map(p => (
                        <td key={p.key} className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={r.permissions.includes(p.key)}
                            onChange={() => handleTogglePermission(r.id, p.key)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                            aria-label={`${r.name} - ${p.label}`}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleSelectAll(r.id)} className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold hover:bg-primary/20 transition-colors cursor-pointer btn-compact">All</button>
                          <button onClick={() => handleClearAll(r.id)} className="px-2 py-1 bg-danger/10 text-danger rounded text-[9px] font-bold hover:bg-danger/20 transition-colors cursor-pointer btn-compact">None</button>
                          <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer btn-compact" title="Hapus Role">
                            <span className="material-symbols-outlined text-[16px] icon-compact">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface-container-low border border-border rounded-xl p-5">
            <h4 className="font-bold text-xs text-slate-700 mb-3">Keterangan Modul</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <div key={p.key} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {p.label}
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
