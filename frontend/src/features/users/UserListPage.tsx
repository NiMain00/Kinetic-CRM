import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, UserRole } from '@/types/domain/users';

const ALL_USERS: User[] = [
  { id: 'USR-001', username: 'asulistyo', fullName: 'Ahmad Sulistyo', email: 'ahmad.s@kinetic.co.id', role: 'Branch Manager', branch: 'Jakarta Pusat', department: 'Operations', phone: '0812-3456-7890', status: 'active', lastLogin: '2026-06-22 08:30:00', createdAt: '2024-01-15' },
  { id: 'USR-002', username: 'bambang.pm', fullName: 'Bambang Permadi', email: 'b.permadi@kinetic.co.id', role: 'PM', branch: 'Project Management', department: 'Project Management Office', phone: '0812-3456-7891', status: 'active', lastLogin: '2026-06-21 14:20:00', createdAt: '2024-02-10' },
  { id: 'USR-003', username: 'rina.ops', fullName: 'Rina Marlina', email: 'rina.marlina@kinetic.co.id', role: 'Dept Head', branch: 'Surabaya', department: 'Operations', phone: '0812-3456-7892', status: 'inactive', lastLogin: '2026-05-30 09:15:00', createdAt: '2024-03-05' },
  { id: 'USR-004', username: 'doni.admin', fullName: 'Doni Wahyudi', email: 'doni.w@kinetic.co.id', role: 'Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7893', status: 'active', lastLogin: '2026-06-22 07:45:00', createdAt: '2024-01-20' },
  { id: 'USR-005', username: 'siti.am', fullName: 'Siti Aminah', email: 'siti.aminah@kinetic.co.id', role: 'Reviewer', branch: 'Jakarta Selatan', department: 'Quality Assurance', phone: '0812-3456-7894', status: 'active', lastLogin: '2026-06-21 16:00:00', createdAt: '2024-04-12' },
  { id: 'USR-006', username: 'andi.w', fullName: 'Andi Wijaya', email: 'andi.w@kinetic.co.id', role: 'Staff', branch: 'Bandung', department: 'Field Operations', phone: '0812-3456-7895', status: 'active', lastLogin: '2026-06-20 11:30:00', createdAt: '2024-05-01' },
  { id: 'USR-007', username: 'dewi.s', fullName: 'Dewi Sartika', email: 'dewi.s@kinetic.co.id', role: 'Branch Manager', branch: 'Medan', department: 'Operations', phone: '0812-3456-7896', status: 'active', lastLogin: '2026-06-22 06:50:00', createdAt: '2024-01-25' },
  { id: 'USR-008', username: 'eko.p', fullName: 'Eko Prasetyo', email: 'eko.p@kinetic.co.id', role: 'Super Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7897', status: 'active', lastLogin: '2026-06-22 08:00:00', createdAt: '2023-11-01' },
];

const ALL_ROLES: UserRole[] = ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Reviewer', 'Staff'];

const roleBadge: Record<string, string> = {
  'Super Admin': 'bg-danger/10 text-danger',
  Admin: 'bg-status-purple/10 text-status-purple',
  PM: 'bg-primary/10 text-primary',
  'Branch Manager': 'bg-status-teal/10 text-status-teal',
  'Dept Head': 'bg-status-indigo/10 text-status-indigo',
  Reviewer: 'bg-warning/10 text-warning',
  Staff: 'bg-secondary-container/50 text-on-secondary-container',
};

const PAGE_SIZE = 5;

export default function UserListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = ALL_USERS.filter((u) => {
    const matchSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-outline font-label-sm mb-1">
              <button onClick={() => navigate('/dashboard')} className="hover:text-primary">Dashboard</button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">Daftar Pengguna</span>
            </nav>
            <h1 className="text-xl font-extrabold text-on-surface">User Management</h1>
          </div>
          <button onClick={() => navigate('/users/new')} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm hover:brightness-110 transition-all" aria-label="Tambah Pengguna Baru">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add User
          </button>
        </div>

        {/* Filter */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary outline-none focus:ring-1" placeholder="Cari nama atau email..." type="text" aria-label="Cari pengguna" />
            </div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'all'); setCurrentPage(1); }} className="border border-border rounded-lg px-4 py-2 text-sm bg-white outline-none focus:ring-1 focus:ring-primary" aria-label="Filter role">
              <option value="all">Semua Role</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Daftar Pengguna">
              <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Cabang</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Terakhir Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                      <p>Tidak ada pengguna ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => (
                    <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{u.fullName}</p>
                            <p className="text-[10px] text-outline">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge[u.role] || ''}`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-secondary">{u.branch}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {u.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-outline font-mono">{u.lastLogin || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-container-low text-xs">
            <span className="text-secondary">
              Menampilkan <span className="font-bold text-on-surface">{(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> dari <span className="font-bold text-on-surface">{filtered.length}</span> hasil
            </span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman sebelumnya">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border border-border text-secondary hover:bg-surface-container-low'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman selanjutnya">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
