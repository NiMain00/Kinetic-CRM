import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  prospects: 'Prospek',
  projects: 'Proyek',
  approvals: 'Persetujuan',
  kpi: 'KPI Dashboard',
  reports: 'Laporan',
  'master-data': 'Data Master',
  users: 'Pengguna',
  'audit-log': 'Log Audit',
  notifications: 'Notifikasi',
  config: 'Konfigurasi',
  profile: 'Profil',
  new: 'Baru',
  edit: 'Sunting',
  org: 'Struktur Organisasi',
  status: 'Status Proyek',
  sla: 'Konfigurasi SLA',
  roles: 'Manajemen Peran',
  targets: 'Target',
  workflow: 'Alur Kerja',
  integration: 'Integrasi',
  upload: 'Unggah',
  period: 'Periode',
  customers: 'Pelanggan',
  competitors: 'Kompetitor',
  categories: 'Kategori',
  'document-types': 'Tipe Dokumen',
  questions: 'Pertanyaan',
  holidays: 'Hari Libur',
  'loss-reasons': 'Alasan Gagal',
  periods: 'Periode',
  industries: 'Industri',
  'project-statuses': 'Status Proyek',
  'question-types': 'Tipe Pertanyaan',
  departments: 'Departemen',
  'audit-logs': 'Log Audit',
  'approval-levels': 'Level Approval',
  'notif-templates': 'Template Notifikasi',
  list: 'Daftar',
  log: 'Log',
  progress: 'Kemajuan',
  'win-loss': 'Menang/Kalah',
  pipeline: 'Pipeline',
  index: 'Indeks',
  403: 'Akses Ditolak',
  404: 'Halaman Tidak Ditemukan',
  500: 'Kesalahan Server',
};

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="px-4 lg:px-8 py-3 bg-surface border-b border-border/60 flex items-center gap-1 text-xs" aria-label="Navigasi halaman">
      <Link to="/dashboard" className="text-outline hover:text-primary transition-colors" aria-label="Beranda">
        <span className="material-symbols-outlined text-sm" aria-hidden="true">home</span>
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        const isLast = i === segments.length - 1;

        return (
          <React.Fragment key={path}>
            <span className="material-symbols-outlined text-outline text-xs" aria-hidden="true">chevron_right</span>
            {isLast ? (
              <span className="text-on-surface font-semibold truncate max-w-[200px]" aria-current="page">{label}</span>
            ) : (
              <Link to={path} className="text-outline hover:text-primary transition-colors truncate max-w-[200px]">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
