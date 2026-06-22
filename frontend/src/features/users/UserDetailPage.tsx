import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { User, AuditLogEntry } from '@/types/domain/users';

const INITIAL_USERS: User[] = [
  { id: 'USR-001', username: 'asulistyo', fullName: 'Ahmad Sulistyo', email: 'ahmad.s@kinetic.co.id', role: 'Branch Manager', branch: 'Jakarta Pusat', department: 'Operations', phone: '0812-3456-7890', status: 'active', lastLogin: '2026-06-22 08:30:00', createdAt: '2024-01-15' },
  { id: 'USR-002', username: 'bambang.pm', fullName: 'Bambang Permadi', email: 'b.permadi@kinetic.co.id', role: 'PM', branch: 'Project Management', department: 'Project Management Office', phone: '0812-3456-7891', status: 'active', lastLogin: '2026-06-21 14:20:00', createdAt: '2024-02-10' },
  { id: 'USR-003', username: 'rina.ops', fullName: 'Rina Marlina', email: 'rina.marlina@kinetic.co.id', role: 'Dept Head', branch: 'Surabaya', department: 'Operations', phone: '0812-3456-7892', status: 'inactive', lastLogin: '2026-05-30 09:15:00', createdAt: '2024-03-05' },
  { id: 'USR-004', username: 'doni.admin', fullName: 'Doni Wahyudi', email: 'doni.w@kinetic.co.id', role: 'Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7893', status: 'active', lastLogin: '2026-06-22 07:45:00', createdAt: '2024-01-20' },
  { id: 'USR-005', username: 'siti.am', fullName: 'Siti Aminah', email: 'siti.aminah@kinetic.co.id', role: 'Reviewer', branch: 'Jakarta Selatan', department: 'Quality Assurance', phone: '0812-3456-7894', status: 'active', lastLogin: '2026-06-21 16:00:00', createdAt: '2024-04-12' },
  { id: 'USR-006', username: 'andi.w', fullName: 'Andi Wijaya', email: 'andi.w@kinetic.co.id', role: 'Staff', branch: 'Bandung', department: 'Field Operations', phone: '0812-3456-7895', status: 'active', lastLogin: '2026-06-20 11:30:00', createdAt: '2024-05-01' },
  { id: 'USR-007', username: 'dewi.s', fullName: 'Dewi Sartika', email: 'dewi.s@kinetic.co.id', role: 'Branch Manager', branch: 'Medan', department: 'Operations', phone: '0812-3456-7896', status: 'active', lastLogin: '2026-06-22 06:50:00', createdAt: '2024-01-25' },
  { id: 'USR-008', username: 'eko.p', fullName: 'Eko Prasetyo', email: 'eko.p@kinetic.co.id', role: 'Super Admin', branch: 'Head Office', department: 'IT', phone: '0812-3456-7897', status: 'active', lastLogin: '2026-06-22 08:00:00', createdAt: '2023-11-01' },
];

const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'aud-1', timestamp: '2026-06-22 08:30:00', actor: 'System', actorInitials: 'SY', action: 'LOGIN', entityType: 'User', entityId: 'USR-001', entityName: 'Ahmad Sulistyo', summary: 'User login berhasil', impact: 'Low' },
  { id: 'aud-2', timestamp: '2026-06-21 14:20:00', actor: 'System', actorInitials: 'SY', action: 'UPDATE', entityType: 'Prospek', entityId: 'PR-001', entityName: 'Modernization of Data Center', summary: 'Mengupdate status prospek menjadi Approved', impact: 'Medium' },
  { id: 'aud-3', timestamp: '2026-06-20 11:30:00', actor: 'System', actorInitials: 'SY', action: 'CREATE', entityType: 'Prospek', entityId: 'PR-002', entityName: 'Supply of Industrial Cables', summary: 'Membuat prospek baru', impact: 'Medium' },
  { id: 'aud-4', timestamp: '2026-06-19 09:15:00', actor: 'System', actorInitials: 'SY', action: 'APPROVE', entityType: 'Approval', entityId: 'AP-001', entityName: 'RKS Document Approval', summary: 'Menyetujui dokumen RKS', impact: 'High' },
  { id: 'aud-5', timestamp: '2026-06-18 16:00:00', actor: 'System', actorInitials: 'SY', action: 'UPLOAD', entityType: 'Document', entityId: 'DOC-001', entityName: 'LPH Technical Draft', summary: 'Mengunggah dokumen teknis', impact: 'Low' },
];

const actionBadge: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-primary/10 text-primary',
  DELETE: 'bg-danger/10 text-danger',
  APPROVE: 'bg-status-teal/10 text-status-teal',
  REJECT: 'bg-status-orange/10 text-status-orange',
  REVISE: 'bg-warning/10 text-warning',
  UPLOAD: 'bg-info/10 text-info',
  LOGIN: 'bg-secondary-container/50 text-on-secondary-container',
  LOGOUT: 'bg-secondary-container/50 text-on-secondary-container',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = INITIAL_USERS.find((u) => u.id === id);
  const [auditLogs] = useState(INITIAL_AUDIT_LOG);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
          <h2 className="text-xl font-bold text-on-surface">Pengguna Tidak Ditemukan</h2>
          <p className="text-secondary text-sm">Pengguna dengan ID {id} tidak tersedia.</p>
          <button onClick={() => navigate('/users')} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:brightness-110 transition-all">Kembali ke Daftar</button>
        </div>
      </div>
    );
  }

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const roleBadge: Record<string, string> = {
    'Super Admin': 'bg-danger/10 text-danger',
    Admin: 'bg-status-purple/10 text-status-purple',
    PM: 'bg-primary/10 text-primary',
    'Branch Manager': 'bg-status-teal/10 text-status-teal',
    'Dept Head': 'bg-status-indigo/10 text-status-indigo',
    Reviewer: 'bg-warning/10 text-warning',
    Staff: 'bg-secondary-container/50 text-on-secondary-container',
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/users')} className="hover:text-primary transition-colors">Pengguna</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">{user.fullName}</span>
        </nav>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">{initials}</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface">{user.fullName}</h1>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge[user.role] || ''}`}>{user.role}</span>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{user.status === 'active' ? 'Aktif' : 'Non-Aktif'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mt-3">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">mail</span>
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">person</span>
                  @{user.username}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">phone</span>
                  {user.phone || '-'}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">business</span>
                  {user.branch}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">category</span>
                  {user.department}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-outline">calendar_month</span>
                  Bergabung {user.createdAt}
                </div>
              </div>
            </div>
            <button onClick={() => navigate(`/users/${user.id}/edit`)} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:brightness-110 transition-all flex items-center gap-2 shrink-0" aria-label="Edit pengguna">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            Aktivitas Terbaru
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Aktivitas pengguna">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Aksi</th>
                  <th className="px-4 py-3 font-semibold">Entitas</th>
                  <th className="px-4 py-3 font-semibold">Ringkasan</th>
                  <th className="px-4 py-3 font-semibold">Dampak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-mono text-outline">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${actionBadge[log.action] || 'bg-secondary-container/50 text-on-secondary-container'}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-on-surface">{log.entityName}</span>
                      <span className="text-outline ml-1">({log.entityType})</span>
                    </td>
                    <td className="px-4 py-3 text-secondary">{log.summary}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${log.impact === 'High' ? 'text-danger' : log.impact === 'Medium' ? 'text-warning' : 'text-secondary'}`}>{log.impact}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
