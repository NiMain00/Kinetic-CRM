import React, { useState } from 'react';
import type { User, UserRole } from '../../types/domain/users';

interface UsersViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

const INITIAL_USERS: User[] = [
  { id: 'USR-001', username: 'asulistyo', fullName: 'Ahmad Sulistyo', email: 'ahmad.s@kinetic.co.id', role: 'Branch Manager', branch: 'Jakarta Pusat', department: 'Operations', phone: '0812-3456-7890', status: 'active', lastLogin: '2026-06-22 08:30:00', createdAt: '2024-01-15' },
  { id: 'USR-002', username: 'bambang.pm', fullName: 'Bambang Permadi', email: 'b.permadi@kinetic.co.id', role: 'PM', branch: 'Project Management', department: 'Project Management Office', phone: '0812-3456-7891', status: 'active', lastLogin: '2026-06-21 14:20:00', createdAt: '2024-02-10' },
  { id: 'USR-003', username: 'rina.ops', fullName: 'Rina Marlina', email: 'rina.marlina@kinetic.co.id', role: 'Dept Head', branch: 'Surabaya', department: 'Operations', phone: '0812-3456-7892', status: 'inactive', lastLogin: '2026-05-30 09:15:00', createdAt: '2024-03-05' },
  { id: 'USR-004', username: 'doni.admin', fullName: 'Doni Wahyudi', email: 'doni.w@kinetic.co.id', role: 'Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7893', status: 'active', lastLogin: '2026-06-22 07:45:00', createdAt: '2024-01-20' },
  { id: 'USR-005', username: 'siti.am', fullName: 'Siti Aminah', email: 'siti.aminah@kinetic.co.id', role: 'Reviewer', branch: 'Jakarta Selatan', department: 'Quality Assurance', phone: '0812-3456-7894', status: 'active', lastLogin: '2026-06-21 16:00:00', createdAt: '2024-04-12' },
  { id: 'USR-006', username: 'andi.w', fullName: 'Andi Wijaya', email: 'andi.w@kinetic.co.id', role: 'Staff', branch: 'Bandung', department: 'Field Operations', phone: '0812-3456-7895', status: 'active', lastLogin: '2026-06-20 11:30:00', createdAt: '2024-05-01' },
  { id: 'USR-007', username: 'dewi.s', fullName: 'Dewi Sartika', email: 'dewi.s@kinetic.co.id', role: 'Branch Manager', branch: 'Medan', department: 'Operations', phone: '0812-3456-7896', status: 'active', lastLogin: '2026-06-22 06:50:00', createdAt: '2024-01-25' },
  { id: 'USR-008', username: 'eko.p', fullName: 'Eko Prasetyo', email: 'eko.p@kinetic.co.id', role: 'Super Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7897', status: 'active', lastLogin: '2026-06-22 08:00:00', createdAt: '2023-11-01' },
  { id: 'USR-009', username: 'ratna.mgmt', fullName: 'Ratna Dewi', email: 'ratna.dewi@kinetic.co.id', role: 'Management', branch: 'Head Office', department: 'Management', phone: '0812-3456-7898', status: 'active', lastLogin: '2026-06-22 09:00:00', createdAt: '2024-06-01' },
];

const ALL_ROLES: UserRole[] = ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'];
const ALL_BRANCHES = ['Head Office', 'Jakarta Pusat', 'Jakarta Selatan', 'Surabaya', 'Bandung', 'Medan', 'Makassar', 'Balikpapan'];
const ALL_DEPARTMENTS = ['Operations', 'Project Management Office', 'IT', 'Quality Assurance', 'Field Operations', 'Finance', 'Legal', 'Marketing'];

export default function UsersView({ onShowNotification, onNavigatePage }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Staff');
  const [formBranch, setFormBranch] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormFullName('');
    setFormEmail('');
    setFormUsername('');
    setFormRole('Staff');
    setFormBranch('Jakarta Pusat');
    setFormDepartment('Operations');
    setFormPhone('');
    setFormStatus('active');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormFullName(user.fullName);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormBranch(user.branch);
    setFormDepartment(user.department);
    setFormPhone(user.phone);
    setFormStatus(user.status);
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formEmail || !formUsername) {
      onShowNotification('Nama, Email, dan Username wajib diisi.', 'error');
      return;
    }
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, fullName: formFullName, email: formEmail, username: formUsername, role: formRole, branch: formBranch, department: formDepartment, phone: formPhone, status: formStatus } : u));
      onShowNotification(`Pengguna ${formFullName} berhasil diperbarui.`, 'success');
    } else {
      const newUser: User = { id: `USR-${String(users.length + 1).padStart(3, '0')}`, fullName: formFullName, email: formEmail, username: formUsername, role: formRole, branch: formBranch, department: formDepartment, phone: formPhone, status: formStatus, createdAt: new Date().toISOString().split('T')[0] };
      setUsers([newUser, ...users]);
      onShowNotification(`Pengguna ${formFullName} berhasil ditambahkan.`, 'success');
    }
    setDrawerOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    const target = users.find(u => u.id === id);
    onShowNotification(`Status pengguna ${target?.fullName} diubah.`, 'success');
  };

  const handleDelete = (id: string) => {
    const target = users.find(u => u.id === id);
    setUsers(users.filter(u => u.id !== id));
    onShowNotification(`Pengguna ${target?.fullName} berhasil dihapus.`, 'warning');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleBadgeClass = (role: UserRole) => {
    const map: Record<string, string> = { 'Super Admin': 'bg-danger/10 text-danger', 'Admin': 'bg-status-purple/10 text-status-purple', 'PM': 'bg-primary/10 text-primary', 'Branch Manager': 'bg-status-teal/10 text-status-teal', 'Dept Head': 'bg-status-indigo/10 text-status-indigo', 'Management': 'bg-amber-100 text-amber-700', 'Reviewer': 'bg-warning/10 text-warning', 'Staff': 'bg-secondary-container/50 text-on-secondary-container' };
    return map[role] || 'bg-secondary-container/50 text-on-secondary-container';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Administration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">User Management</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            User Management
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{users.length} Users</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola pengguna, peran, dan hak akses sistem.</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold text-xs cursor-pointer shadow-sm">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah Pengguna
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input type="text" placeholder="Cari nama, email, atau username..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')} className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Role</option>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')} className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
              <button onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all'); onShowNotification('Filter direset.', 'success'); }} className="px-3 py-2 border border-border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Reset</button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Pengguna</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Cabang</th>
                    <th className="px-6 py-3.5">Departemen</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5">Terakhir Login</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada pengguna ditemukan.</td></tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs avatar-compact">{u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400">{u.email} • @{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                        <td className="px-6 py-4 text-slate-600">{u.branch}</td>
                        <td className="px-6 py-4 text-slate-600">{u.department}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleToggleStatus(u.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${u.status === 'active' ? 'bg-success' : 'bg-slate-300'}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${u.status === 'active' ? 'translate-x-2' : '-translate-x-2'}`}></span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[10px] font-mono">{u.lastLogin || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleOpenEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer btn-compact" title="Edit"><span className="material-symbols-outlined text-[18px] icon-compact">edit</span></button>
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer btn-compact" title="Hapus"><span className="material-symbols-outlined text-[18px] icon-compact">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center text-[10px] text-slate-400">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <span>Static sandbox environment</span>
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editingUser ? `UID: ${editingUser.id}` : 'Buat akun pengguna baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Nama Lengkap *</label>
                <input type="text" value={formFullName} onChange={e => setFormFullName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Contoh: Ahmad Sulistyo" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Email *</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="email@kinetic.co.id" required />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Username *</label>
                  <input type="text" value={formUsername} onChange={e => setFormUsername(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="username" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Role *</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as UserRole)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs bg-white">
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Cabang</label>
                  <select value={formBranch} onChange={e => setFormBranch(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {ALL_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Departemen</label>
                  <select value={formDepartment} onChange={e => setFormDepartment(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">No. Telepon</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="0812-xxxx-xxxx" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status Akun</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="userStatus" checked={formStatus === 'active'} onChange={() => setFormStatus('active')} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="userStatus" checked={formStatus === 'inactive'} onChange={() => setFormStatus('inactive')} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
