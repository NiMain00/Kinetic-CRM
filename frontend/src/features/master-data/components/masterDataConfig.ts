export interface MasterDataEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  path?: string;
  storeKey: string;
  color: string;
  bgColor: string;
  category: string;
  categoryColor: string;
  isFrequent?: boolean;
}

const MASTER_OPERASIONAL: MasterDataEntry[] = [
  {
    id: 'customers',
    name: 'Pelanggan',
    description: 'Referensi customer terpusat untuk prospek dan proyek.',
    icon: 'groups',
    path: '/master-data/customers',
    storeKey: 'customers',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
    isFrequent: true,
  },
  {
    id: 'industries',
    name: 'Industri',
    description: 'Segmen industri untuk klasifikasi customer.',
    icon: 'category',
    storeKey: 'industries',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
  },
  {
    id: 'competitors',
    name: 'Kompetitor',
    description: 'Entitas kompetitor ternormalisasi untuk analisis win rate.',
    icon: 'factory',
    path: '/master-data/competitors',
    storeKey: 'competitors',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
  },
  {
    id: 'periods',
    name: 'Periode',
    description: 'Periode untuk laporan, target, dan SLA.',
    icon: 'calendar_month',
    path: '/master-data/periods',
    storeKey: 'periods',
    color: '#0284C7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
  },
  {
    id: 'holidays',
    name: 'Hari Libur',
    description: 'Kalender hari libur untuk kalkulasi SLA.',
    icon: 'celebration',
    path: '/master-data/holidays',
    storeKey: 'holidays',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
  },
  {
    id: 'loss-reasons',
    name: 'Alasan Kekalahan',
    description: 'Alasan kekalahan tender terstandar untuk analisis.',
    icon: 'sentiment_dissatisfied',
    path: '/master-data/loss-reasons',
    storeKey: 'lossReasons',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    category: 'Operasional',
    categoryColor: '#16A34A',
  },
];

const MASTER_DOKUMEN: MasterDataEntry[] = [
  {
    id: 'categories',
    name: 'Kategori Proyek',
    description: 'Klasifikasi proyek berdasarkan jenis pekerjaan.',
    icon: 'folder',
    path: '/master-data/categories',
    storeKey: 'categories',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    category: 'Dokumen & Proyek',
    categoryColor: '#2563EB',
  },
  {
    id: 'project-statuses',
    name: 'Status Proyek',
    description: 'Status proyek dinamis yang dapat dikonfigurasi.',
    icon: 'flag',
    storeKey: 'projectStatuses',
    color: '#4338CA',
    bgColor: 'rgba(67, 56, 202, 0.1)',
    category: 'Dokumen & Proyek',
    categoryColor: '#2563EB',
  },
  {
    id: 'document-types',
    name: 'Tipe Dokumen',
    description: 'Klasifikasi dokumen untuk upload dan validasi.',
    icon: 'description',
    path: '/master-data/document-types',
    storeKey: 'documentTypes',
    color: '#0D9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    category: 'Dokumen & Proyek',
    categoryColor: '#2563EB',
  },
  {
    id: 'notif-templates',
    name: 'Template Notifikasi',
    description: 'Template pesan notifikasi sistem otomatis.',
    icon: 'notifications_active',
    storeKey: 'notifTemplates',
    color: '#0D9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    category: 'Dokumen & Proyek',
    categoryColor: '#2563EB',
  },
];

const MASTER_ORGANISASI: MasterDataEntry[] = [
  {
    id: 'departments',
    name: 'Departemen',
    description: 'Struktur departemen organisasi perusahaan.',
    icon: 'domain',
    storeKey: 'departments',
    color: '#0891B2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    category: 'Organisasi',
    categoryColor: '#0891B2',
    isFrequent: true,
  },
  {
    id: 'users',
    name: 'Pengguna',
    description: 'Manajemen pengguna dan hak akses sistem.',
    icon: 'manage_accounts',
    storeKey: 'users',
    color: '#1B5E20',
    bgColor: 'rgba(27, 94, 32, 0.1)',
    category: 'Organisasi',
    categoryColor: '#0891B2',
    isFrequent: true,
  },
  {
    id: 'approval-levels',
    name: 'Level Approval',
    description: 'Konfigurasi level persetujuan berjenjang.',
    icon: 'account_tree',
    storeKey: 'approvalLevels',
    color: '#4F46E5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
    category: 'Organisasi',
    categoryColor: '#0891B2',
  },
  {
    id: 'audit-logs',
    name: 'Log Audit',
    description: 'Jejak audit sistem dan perubahan data.',
    icon: 'security',
    storeKey: 'auditLogs',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    category: 'Organisasi',
    categoryColor: '#0891B2',
  },
];

const MASTER_SURVEY: MasterDataEntry[] = [
  {
    id: 'questions',
    name: 'Pertanyaan',
    description: 'Master pertanyaan untuk review prospek dan RKS.',
    icon: 'list_alt',
    path: '/master-data/questions',
    storeKey: 'questions',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    category: 'Form & Survey',
    categoryColor: '#D97706',
    isFrequent: true,
  },
  {
    id: 'question-types',
    name: 'Tipe Pertanyaan',
    description: 'Tipe jawaban untuk pertanyaan review.',
    icon: 'rule',
    storeKey: 'questionTypes',
    color: '#9F1239',
    bgColor: 'rgba(159, 18, 57, 0.1)',
    category: 'Form & Survey',
    categoryColor: '#D97706',
  },
];

export const masterDataConfig: MasterDataEntry[] = [
  ...MASTER_OPERASIONAL,
  ...MASTER_DOKUMEN,
  ...MASTER_ORGANISASI,
  ...MASTER_SURVEY,
];

export const masterDataCategories = [
  { key: 'Operasional', label: 'Operasional', color: '#16A34A', entries: MASTER_OPERASIONAL },
  { key: 'Dokumen & Proyek', label: 'Dokumen & Proyek', color: '#2563EB', entries: MASTER_DOKUMEN },
  { key: 'Organisasi', label: 'Organisasi', color: '#0891B2', entries: MASTER_ORGANISASI },
  { key: 'Form & Survey', label: 'Form & Survey', color: '#D97706', entries: MASTER_SURVEY },
];

export const frequentMasterData = masterDataConfig.filter((e) => e.isFrequent);
