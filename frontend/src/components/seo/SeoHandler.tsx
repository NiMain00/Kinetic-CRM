import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const PAGE_META: Record<string, { title: string; description?: string }> = {
  '/login': {
    title: 'Login',
    description:
      'Login ke platform Kinetic CRM untuk mengelola proyek, pengadaan, dan operasi perusahaan dalam satu sistem terintegrasi.',
  },
  '/forgot-password': {
    title: 'Lupa Password',
    description:
      'Reset password akun Kinetic CRM Anda. Masukkan email terdaftar untuk menerima tautan reset password.',
  },
  '/reset-password/:token': {
    title: 'Reset Password',
    description: 'Buat password baru untuk akun Kinetic CRM Anda.',
  },
  '/dashboard': {
    title: 'Dashboard',
    description:
      'Ringkasan proyek, prospek, dan KPI terbaru di platform Kinetic CRM.',
  },
  '/prospects': {
    title: 'Prospek',
    description: 'Kelola data prospek, pipeline, dan kualifikasi prospek di Kinetic CRM.',
  },
  '/prospects/pipeline': {
    title: 'Pipeline Prospek',
  },
  '/prospects/qualification': {
    title: 'Kualifikasi Prospek',
  },
  '/prospects/new': {
    title: 'Prospek Baru',
  },
  '/prospects/:id': {
    title: 'Detail Prospek',
  },
  '/prospects/:id/edit': {
    title: 'Edit Prospek',
  },
  '/projects': {
    title: 'Proyek',
    description: 'Daftar dan kelola proyek perusahaan di Kinetic CRM.',
  },
  '/projects/new': {
    title: 'Proyek Baru',
  },
  '/projects/:id': {
    title: 'Detail Proyek',
  },
  '/projects/:projectId/:tab': {
    title: 'Detail Proyek',
  },
  '/project/:id': {
    title: 'Detail Proyek',
  },
  '/project/:projectId/:tab': {
    title: 'Detail Proyek',
  },
  '/procurement': {
    title: 'Pengadaan',
    description: 'Kelola pengadaan barang dan jasa perusahaan di Kinetic CRM.',
  },
  '/procurement/new': {
    title: 'Pengadaan Baru',
  },
  '/procurement/:id': {
    title: 'Detail Pengadaan',
  },
  '/procurement/:procurementId/:tab': {
    title: 'Detail Pengadaan',
  },
  '/approvals': {
    title: 'Persetujuan',
    description: 'Review dan setujui permintaan yang membutuhkan persetujuan Anda.',
  },
  '/reports': {
    title: 'Laporan',
    description: 'Laporan KPI, win/loss, pipeline, dan kinerja proyek di Kinetic CRM.',
  },
  '/reports/win-loss': {
    title: 'Laporan Win/Loss',
  },
  '/reports/pipeline': {
    title: 'Laporan Pipeline',
  },
  '/reports/calendar': {
    title: 'Kalender',
  },
  '/reports/kpi': {
    title: 'KPI Dashboard',
  },
  '/reports/kpi/progress': {
    title: 'Progress KPI',
  },
  '/reports/kpi/targets': {
    title: 'Target KPI',
  },
  '/master-data': {
    title: 'Master Data',
    description: 'Kelola data master pelanggan, kompetitor, kategori, dan lainnya.',
  },
  '/master-data/customers': {
    title: 'Data Pelanggan',
  },
  '/master-data/competitors': {
    title: 'Data Kompetitor',
  },
  '/master-data/categories': {
    title: 'Kategori',
  },
  '/master-data/document-types': {
    title: 'Tipe Dokumen',
  },
  '/master-data/questions': {
    title: 'Master Pertanyaan',
  },
  '/master-data/holidays': {
    title: 'Hari Libur',
  },
  '/master-data/loss-reasons': {
    title: 'Alasan Kegagalan',
  },
  '/master-data/periods': {
    title: 'Periode',
  },
  '/notifications': {
    title: 'Notifikasi',
  },
  '/config': {
    title: 'Konfigurasi',
    description: 'Pengaturan organisasi, status, SLA, roles, dan konfigurasi sistem.',
  },
  '/config/org': {
    title: 'Organisasi',
  },
  '/config/status': {
    title: 'Status Workflow',
  },
  '/config/notifications': {
    title: 'Template Notifikasi',
  },
  '/config/sla': {
    title: 'SLA',
  },
  '/config/access-control': {
    title: 'Kontrol Akses',
  },
  '/config/targets': {
    title: 'Target',
  },
  '/config/workflow': {
    title: 'Workflow',
  },
  '/config/integration': {
    title: 'Integrasi',
  },
  '/config/upload': {
    title: 'Upload',
  },
  '/config/period': {
    title: 'Periode Konfigurasi',
  },
  '/config/question-types': {
    title: 'Tipe Pertanyaan',
  },
  '/config/input-options': {
    title: 'Opsi Input',
  },
  '/config/stage-rules': {
    title: 'Aturan Tahapan',
  },
  '/profile': {
    title: 'Profil',
  },
  '/follow-up': {
    title: 'Follow Up',
  },
  '/master-data/:entity': {
    title: 'Master Data',
  },
  '/audit': {
    title: 'Audit',
  },
  '/audit/log': {
    title: 'Log Audit',
  },
  '/403': {
    title: 'Akses Ditolak',
  },
  '/404': {
    title: 'Halaman Tidak Ditemukan',
  },
  '/500': {
    title: 'Kesalahan Server',
  },
};

const BASE_URL = 'https://kinetic-crm-app.vercel.app';
const DEFAULT_DESCRIPTION =
  'Kinetic CRM — platform enterprise untuk mengelola proyek, pengadaan, dan operasi perusahaan dalam satu sistem terintegrasi.';

function matchRoute(pathname: string): string {
  if (PAGE_META[pathname]) return pathname;

  const segments = pathname.split('/').filter(Boolean);
  for (const pattern of Object.keys(PAGE_META)) {
    const patternSegs = pattern.split('/').filter(Boolean);
    if (patternSegs.length !== segments.length) continue;
    const match = patternSegs.every(
      (seg, i) => seg.startsWith(':') || seg === segments[i],
    );
    if (match) return pattern;
  }
  return '/404';
}

export default function SeoHandler() {
  const { pathname } = useLocation();

  const route = useMemo(() => matchRoute(pathname), [pathname]);
  const meta = PAGE_META[route] || PAGE_META['/404']!;
  const fullTitle = `${meta.title} — Kinetic CRM`;
  const description = meta.description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${BASE_URL}${pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://kinetic-crm-app.vercel.app/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
