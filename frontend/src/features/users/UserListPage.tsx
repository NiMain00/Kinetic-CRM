import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/queries/useUsers';
import PageSkeleton from '@/components/layout/PageSkeleton';

const roleBadge: Record<string, string> = {
  admin: 'bg-status-purple/10 text-status-purple',
  management: 'bg-danger/10 text-danger',
  pm: 'bg-primary/10 text-primary',
  department: 'bg-status-indigo/10 text-status-indigo',
  cabang: 'bg-status-teal/10 text-status-teal',
};

const PAGE_SIZE = 10;

export default function UserListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: res, isLoading, isError } = useUsers({ page: currentPage, perPage: PAGE_SIZE, search: searchQuery || undefined });

  const users = (res as any)?.data?.data ?? [];
  const pagination = (res as any)?.data?.meta?.pagination;
  const totalPages = pagination?.totalPages || 1;

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="material-symbols-outlined text-5xl text-danger">error</span>
        <p className="text-secondary text-sm">Gagal memuat data pengguna</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Muat Ulang</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary outline-none focus:ring-1" placeholder="Cari nama atau email..." type="text" aria-label="Cari pengguna" />
            </div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="border border-border rounded-lg px-4 py-2 text-sm bg-white outline-none focus:ring-1 focus:ring-primary" aria-label="Filter role">
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="management">Management</option>
              <option value="pm">PM</option>
              <option value="department">Department</option>
              <option value="cabang">Cabang</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-left text-sm table-auto" aria-label="Daftar Pengguna">
              <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Cabang</th>
                  <th className="px-6 py-4 font-semibold">Departemen</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                      <p>Tidak ada pengguna ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {(u.name || u.username || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{u.name}</p>
                            <p className="text-[10px] text-outline">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge[u.role?.code] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{u.role?.name || u.role?.code || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-secondary">{u.branch?.name || '-'}</td>
                      <td className="px-6 py-4 text-secondary">{u.department?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive !== false ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {u.isActive !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-container-low text-xs">
            <span className="text-secondary">
              Menampilkan {pagination ? `${(pagination.page - 1) * pagination.perPage + 1} - ${Math.min(pagination.page * pagination.perPage, pagination.totalItems)} dari ${pagination.totalItems} hasil` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman sebelumnya">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border border-border text-secondary hover:bg-surface-container-low'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-white border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Halaman selanjutnya">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
