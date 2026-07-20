import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import type { UserRole } from '@/types/domain/users';
import { usePermission } from '@/hooks/usePermission';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';


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
  const { can } = usePermission();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const users = useUserStore((s) => s.users);

  const filtered = useMemo(() => users.filter((u) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, debouncedSearch, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
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
          {can('users:manage') && (
            <button onClick={() => navigate('/users/new')} className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-card hover:bg-primary-light transition-all" aria-label="Tambah Pengguna Baru">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add User
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="bg-surface p-5 rounded-2xl border border-border/60 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary outline-none focus:ring-1" placeholder="Cari nama atau email..." type="text" aria-label="Cari pengguna" />
            </div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'all'); setCurrentPage(1); }} className="border border-border rounded-lg px-4 py-2 text-sm bg-surface-container-lowest outline-none focus:ring-1 focus:ring-primary" aria-label="Filter role">
              <option value="all">Semua Role</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-2xl border border-border/60 shadow-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto scrollbar-none table-mobile-compact">
            <table className="w-full text-left text-sm table-auto" aria-label="Daftar Pengguna">
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
                    <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{u.fullName}</p>
                            <p className="text-[10px] text-outline">@{u.username}</p>
                          </div>
                        </Link>
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
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-surface border border-border/60 text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman sebelumnya">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-surface border border-border/60 text-secondary hover:bg-surface-container'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-surface border border-border/60 text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman selanjutnya">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
