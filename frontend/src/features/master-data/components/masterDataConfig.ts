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
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
    isFrequent: true,
  },
  {
    id: 'industries',
    name: 'Industri',
    description: 'Segmen industri untuk klasifikasi customer.',
    icon: 'category',
    storeKey: 'industries',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
  },
  {
    id: 'competitors',
    name: 'Kompetitor',
    description: 'Entitas kompetitor ternormalisasi untuk analisis win rate.',
    icon: 'factory',
    path: '/master-data/competitors',
    storeKey: 'competitors',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
  },
  {
    id: 'periods',
    name: 'Periode',
    description: 'Periode untuk laporan, target, dan SLA.',
    icon: 'calendar_month',
    path: '/master-data/periods',
    storeKey: 'periods',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
  },
  {
    id: 'holidays',
    name: 'Hari Libur',
    description: 'Kalender hari libur untuk kalkulasi SLA.',
    icon: 'celebration',
    path: '/master-data/holidays',
    storeKey: 'holidays',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
  },
  {
    id: 'loss-reasons',
    name: 'Alasan Kekalahan',
    description: 'Alasan kekalahan tender terstandar untuk analisis.',
    icon: 'sentiment_dissatisfied',
    path: '/master-data/loss-reasons',
    storeKey: 'lossReasons',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Operasional',
    categoryColor: '#374151',
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
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Dokumen & Proyek',
    categoryColor: '#374151',
  },
  {
    id: 'project-statuses',
    name: 'Status Proyek',
    description: 'Status proyek dinamis yang dapat dikonfigurasi.',
    icon: 'flag',
    storeKey: 'projectStatuses',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Dokumen & Proyek',
    categoryColor: '#374151',
  },
  {
    id: 'document-types',
    name: 'Tipe Dokumen',
    description: 'Klasifikasi dokumen untuk upload dan validasi.',
    icon: 'description',
    path: '/master-data/document-types',
    storeKey: 'documentTypes',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Dokumen & Proyek',
    categoryColor: '#374151',
  },
  {
    id: 'notif-templates',
    name: 'Template Notifikasi',
    description: 'Template pesan notifikasi sistem otomatis.',
    icon: 'notifications_active',
    storeKey: 'notifTemplates',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Dokumen & Proyek',
    categoryColor: '#374151',
  },
];

const MASTER_ORGANISASI: MasterDataEntry[] = [
  {
    id: 'departments',
    name: 'Departemen',
    description: 'Struktur departemen organisasi perusahaan.',
    icon: 'domain',
    storeKey: 'departments',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Organisasi',
    categoryColor: '#374151',
    isFrequent: true,
  },
  {
    id: 'users',
    name: 'Pengguna',
    description: 'Manajemen pengguna dan hak akses sistem.',
    icon: 'manage_accounts',
    storeKey: 'users',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Organisasi',
    categoryColor: '#374151',
    isFrequent: true,
  },
  {
    id: 'approval-levels',
    name: 'Level Approval',
    description: 'Konfigurasi level persetujuan berjenjang.',
    icon: 'account_tree',
    storeKey: 'approvalLevels',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Organisasi',
    categoryColor: '#374151',
  },
  {
    id: 'audit-logs',
    name: 'Log Audit',
    description: 'Jejak audit sistem dan perubahan data.',
    icon: 'security',
    storeKey: 'auditLogs',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Organisasi',
    categoryColor: '#374151',
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
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Form & Survey',
    categoryColor: '#374151',
    isFrequent: true,
  },
  {
    id: 'question-types',
    name: 'Tipe Pertanyaan',
    description: 'Tipe jawaban untuk pertanyaan review.',
    icon: 'rule',
    storeKey: 'questionTypes',
    color: '#374151',
    bgColor: 'rgba(55, 65, 81, 0.08)',
    category: 'Form & Survey',
    categoryColor: '#374151',
  },
];

export const masterDataConfig: MasterDataEntry[] = [
  ...MASTER_OPERASIONAL,
  ...MASTER_DOKUMEN,
  ...MASTER_ORGANISASI,
  ...MASTER_SURVEY,
];

export const masterDataCategories = [
  { key: 'Operasional', label: 'Operasional', color: '#374151', entries: MASTER_OPERASIONAL },
  { key: 'Dokumen & Proyek', label: 'Dokumen & Proyek', color: '#374151', entries: MASTER_DOKUMEN },
  { key: 'Organisasi', label: 'Organisasi', color: '#374151', entries: MASTER_ORGANISASI },
  { key: 'Form & Survey', label: 'Form & Survey', color: '#374151', entries: MASTER_SURVEY },
];

export const frequentMasterData = masterDataConfig.filter((e) => e.isFrequent);
