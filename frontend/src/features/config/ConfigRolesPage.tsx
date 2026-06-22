import React, { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import toast from 'react-hot-toast';

interface Permission {
  key: string;
  label: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
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

const INITIAL_ROLES: Role[] = [
  { id: 'R-01', name: 'Super Admin', description: 'Akses penuh ke seluruh sistem', permissions: ALL_PERMISSIONS.map(p => p.key) },
  { id: 'R-02', name: 'Admin', description: 'Kelola master data, pengguna, dan konfigurasi', permissions: ['dashboard_view', 'prospek_view', 'prospek_create', 'prospek_edit', 'prospek_delete', 'proyek_view', 'proyek_create', 'proyek_edit', 'proyek_delete', 'approval_process', 'approval_view', 'kpi_view', 'kpi_manage', 'laporan_view', 'master_data', 'users_manage', 'config_access', 'audit_view'] },
  { id: 'R-03', name: 'PM', description: 'Kelola proyek dan prospek', permissions: ['dashboard_view', 'prospek_view', 'prospek_create', 'prospek_edit', 'proyek_view', 'proyek_create', 'proyek_edit', 'approval_process', 'approval_view', 'kpi_view', 'laporan_view'] },
  { id: 'R-04', name: 'Branch Manager', description: 'Kelola cabang dan approval', permissions: ['dashboard_view', 'prospek_view', 'prospek_create', 'proyek_view', 'approval_process', 'approval_view', 'kpi_view', 'laporan_view'] },
  { id: 'R-05', name: 'Dept Head', description: 'Oversight departemen', permissions: ['dashboard_view', 'prospek_view', 'proyek_view', 'approval_process', 'approval_view', 'kpi_view', 'laporan_view'] },
  { id: 'R-06', name: 'Reviewer', description: 'Review dan validasi', permissions: ['dashboard_view', 'prospek_view', 'proyek_view', 'approval_view', 'laporan_view'] },
  { id: 'R-07', name: 'Staff', description: 'Akses dasar operasional', permissions: ['dashboard_view', 'prospek_view', 'prospek_create', 'proyek_view'] },
];

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-danger/10 text-danger',
  Admin: 'bg-status-purple/10 text-status-purple',
  PM: 'bg-primary/10 text-primary',
  'Branch Manager': 'bg-status-teal/10 text-status-teal',
  'Dept Head': 'bg-status-indigo/10 text-status-indigo',
  Reviewer: 'bg-warning/10 text-warning',
  Staff: 'bg-secondary-container/50 text-on-secondary-container',
};

export default function ConfigRolesPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);

  const handleTogglePermission = (roleId: string, permKey: string) => {
    setRoles(roles.map(r => {
      if (r.id !== roleId) return r;
      const hasPerm = r.permissions.includes(permKey);
      const newPerms = hasPerm ? r.permissions.filter(p => p !== permKey) : [...r.permissions, permKey];
      return { ...r, permissions: newPerms };
    }));
  };

  const handleSelectAll = (roleId: string) => {
    setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: ALL_PERMISSIONS.map(p => p.key) } : r));
    const target = roles.find(r => r.id === roleId);
    toast.success(`Semua izin diberikan untuk ${target?.name}`);
  };

  const handleClearAll = (roleId: string) => {
    setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: [] } : r));
    const target = roles.find(r => r.id === roleId);
    toast.success(`Semua izin dihapus dari ${target?.name}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 shadow-sm z-10">
        <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
          <span className="font-semibold uppercase tracking-wider">Configuration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold uppercase tracking-wider">Role & Permission</span>
        </nav>
        <h2 className="font-display-title text-base font-extrabold text-slate-900">Manajemen Role & Permission</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Atur hak akses setiap peran pengguna dalam sistem.</p>
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${ROLE_COLORS[r.name] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{r.name}</span>
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
                          <button onClick={() => handleSelectAll(r.id)} className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold hover:bg-primary/20 transition-colors cursor-pointer">All</button>
                          <button onClick={() => handleClearAll(r.id)} className="px-2 py-1 bg-danger/10 text-danger rounded text-[9px] font-bold hover:bg-danger/20 transition-colors cursor-pointer">None</button>
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
    </div>
  );
}
