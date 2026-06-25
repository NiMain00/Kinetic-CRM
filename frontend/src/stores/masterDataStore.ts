import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Generic master data store — handles all master data entities
 * in a single store keyed by entity type.
 */

export interface MasterCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  requires_lphs: boolean;
  requires_rks: boolean;
  default_workflow_type: 'tender' | 'prospecting';
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

export interface MasterCompetitor {
  id: string;
  name: string;
  min_price: number;
  max_price: number;
  advantages: string;
  notes: string;
}

export interface MasterDocType {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  is_active: boolean;
}

export interface MasterQuestion {
  id: string;
  question_text: string;
  type: 'text' | 'select' | 'boolean';
  category: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface MasterHoliday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'regional';
  year: number;
}

export interface MasterLossReason {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface MasterPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface MasterCustomer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  city: string;
  is_active: boolean;
}

// Initial data
const INITIAL_CATEGORIES: MasterCategory[] = [
  { id: 'CAT-01', name: 'Konstruksi & Sipil', code: 'KONSTRUKSI', description: 'Pekerjaan konstruksi bangunan dan sipil', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#2563EB', sort_order: 1, is_active: true },
  { id: 'CAT-02', name: 'IT & Sistem Informasi', code: 'IT_SISTEM', description: 'Pengembangan perangkat lunak dan sistem informasi', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#7C3AED', sort_order: 2, is_active: true },
  { id: 'CAT-03', name: 'Jasa Konsultansi', code: 'KONSULTANSI', description: 'Jasa konsultansi manajemen dan teknis', requires_lphs: false, requires_rks: true, default_workflow_type: 'tender', color_hex: '#0D9488', sort_order: 3, is_active: true },
  { id: 'CAT-04', name: 'Pengadaan Barang', code: 'PENGADAAN', description: 'Pengadaan barang dan perlengkapan', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#D97706', sort_order: 4, is_active: true },
  { id: 'CAT-05', name: 'Jasa Umum', code: 'JASA_UMUM', description: 'Penyediaan jasa umum dan outsourcing', requires_lphs: false, requires_rks: true, default_workflow_type: 'prospecting', color_hex: '#0284C7', sort_order: 5, is_active: true },
  { id: 'CAT-06', name: 'Lainnya', code: 'LAINNYA', description: 'Kategori proyek lainnya', requires_lphs: false, requires_rks: false, default_workflow_type: 'prospecting', color_hex: '#6B7280', sort_order: 6, is_active: true },
];

const INITIAL_COMPETITORS: MasterCompetitor[] = [
  { id: 'CP-001', name: 'PT Astra Modern Ltd', min_price: 500000000, max_price: 1500000000, advantages: 'Pengalaman luas di konstruksi, jaringan kuat', notes: 'Kompetitor utama di tender infrastruktur' },
  { id: 'CP-002', name: 'Global Enterprise Solutions', min_price: 300000000, max_price: 800000000, advantages: 'Tim IT berpengalaman, sertifikasi internasional', notes: 'Pesaing kuat di tender IT' },
  { id: 'CP-003', name: 'PT Nippon Power Corp', min_price: 750000000, max_price: 2000000000, advantages: 'Teknologi mutakhir, dukungan purna jual', notes: '' },
  { id: 'CP-004', name: 'PT Tekno Konstruksi Indonesia', min_price: 400000000, max_price: 1200000000, advantages: 'Harga kompetitif, proyek tepat waktu', notes: 'Kompetitor terkuat di sektor konstruksi sipil' },
];

const INITIAL_DOC_TYPES: MasterDocType[] = [
  { id: 'DT-01', name: 'Dokumen Tender / RKS', code: 'RKS', description: 'Dokumen tender dan RKS', category: 'Tender', is_active: true },
  { id: 'DT-02', name: 'Draft LPHS', code: 'LPHS', description: 'Daftar Harga Perkiraan Sendiri', category: 'Tender', is_active: true },
  { id: 'DT-03', name: 'Surat Perintah Kerja', code: 'SPK', description: 'SPK atau kontrak proyek', category: 'Both', is_active: true },
  { id: 'DT-04', name: 'Surat Kekalahan', code: 'SURAT_KALAH', description: 'Surat pernyataan kekalahan', category: 'Both', is_active: true },
  { id: 'DT-05', name: 'Dokumen Harga Penawaran', code: 'HARGA', description: 'Dokumen harga penawaran', category: 'Both', is_active: true },
  { id: 'DT-06', name: 'Invoice / Tagihan', code: 'INVOICE', description: 'Invoice dan tagihan', category: 'Both', is_active: false },
];

const INITIAL_QUESTIONS: MasterQuestion[] = [
  { id: 'Q-001', question_text: 'Nama Lengkap Sesuai KTP', type: 'text', category: 'Data Pribadi', is_required: true, sort_order: 1, is_active: true },
  { id: 'Q-002', question_text: 'Apakah domisili sesuai dengan domisili usaha?', type: 'boolean', category: 'Lokasi', is_required: true, sort_order: 2, is_active: true },
  { id: 'Q-003', question_text: 'Jenis badan usaha', type: 'select', category: 'Legalitas', is_required: true, sort_order: 3, is_active: true },
  { id: 'Q-004', question_text: 'Estimasi omzet bulanan', type: 'text', category: 'Keuangan', is_required: false, sort_order: 4, is_active: true },
  { id: 'Q-005', question_text: 'Upload foto tempat usaha', type: 'boolean', category: 'Verifikasi Fisik', is_required: true, sort_order: 5, is_active: false },
];

const INITIAL_HOLIDAYS: MasterHoliday[] = [
  { id: 'HOL-01', name: 'Tahun Baru Masehi', date: '2025-01-01', type: 'national', year: 2025 },
  { id: 'HOL-02', name: 'Hari Raya Idul Fitri', date: '2025-05-12', type: 'national', year: 2025 },
  { id: 'HOL-03', name: 'Hari Kemerdekaan RI', date: '2025-08-17', type: 'national', year: 2025 },
  { id: 'HOL-04', name: 'Hari Raya Natal', date: '2025-12-25', type: 'national', year: 2025 },
  { id: 'HOL-05', name: 'Hari Jadi Jakarta', date: '2025-06-22', type: 'regional', year: 2025 },
  { id: 'HOL-06', name: 'Tahun Baru 2026', date: '2026-01-01', type: 'national', year: 2026 },
];

const INITIAL_LOSS_REASONS: MasterLossReason[] = [
  { id: 'LR-01', name: 'Harga Terlalu Tinggi', code: 'HARGA', description: 'Harga penawaran melebihi budget owner', is_active: true },
  { id: 'LR-02', name: 'Skor Teknis Kurang', code: 'TEKNIS', description: 'Skor teknis di bawah ambang batas', is_active: true },
  { id: 'LR-03', name: 'Administrasi Tidak Lengkap', code: 'ADMIN', description: 'Kelengkapan dokumen administrasi', is_active: true },
  { id: 'LR-04', name: 'Kompetitor Lebih Unggul', code: 'PESAING', description: 'Kompetitor memiliki pengalaman spesifik', is_active: true },
  { id: 'LR-05', name: 'Pembatalan Tender oleh Owner', code: 'BATAL', description: 'Tender dibatalkan oleh pemberi kerja', is_active: true },
];

const INITIAL_PERIODS: MasterPeriod[] = [
  { id: 'PER-01', name: '2025 Q1', start_date: '2025-01-01', end_date: '2025-03-31', is_active: false },
  { id: 'PER-02', name: '2025 Q2', start_date: '2025-04-01', end_date: '2025-06-30', is_active: true },
  { id: 'PER-03', name: '2025 Q3', start_date: '2025-07-01', end_date: '2025-09-30', is_active: true },
  { id: 'PER-04', name: '2025 FY', start_date: '2025-01-01', end_date: '2025-12-31', is_active: false },
  { id: 'PER-05', name: '2026 Q1', start_date: '2026-01-01', end_date: '2026-03-31', is_active: true },
];

const INITIAL_MASTER_CUSTOMERS: MasterCustomer[] = [
  { id: 'C-001', name: 'PT Astra International Tbk', code: 'ASTRA', type: 'swasta', pic_name: 'Budi Santoso', pic_email: 'budi@astra.co.id', pic_phone: '021-12345678', city: 'Jakarta Utara', is_active: true },
  { id: 'C-002', name: 'Bank Rakyat Indonesia', code: 'BRI', type: 'bumn', pic_name: 'Siti Aminah', pic_email: 'siti@bri.co.id', pic_phone: '021-87654321', city: 'Jakarta Pusat', is_active: true },
  { id: 'C-003', name: 'Dinas Kesehatan Prov DKI', code: 'DINKES', type: 'pemerintah', pic_name: 'Herry Setiawan', pic_email: 'herry@dinkes.go.id', pic_phone: '021-56789012', city: 'Jakarta Pusat', is_active: false },
  { id: 'C-004', name: 'Siemens Indonesia', code: 'SIEMENS', type: 'asing', pic_name: 'John Doe', pic_email: 'john@siemens.co.id', pic_phone: '021-23456789', city: 'Jakarta Selatan', is_active: true },
];

type EntityType = 'categories' | 'competitors' | 'docTypes' | 'questions' | 'holidays' | 'lossReasons' | 'periods' | 'customers';

const INITIAL_DATA: Record<EntityType, any[]> = {
  categories: INITIAL_CATEGORIES,
  competitors: INITIAL_COMPETITORS,
  docTypes: INITIAL_DOC_TYPES,
  questions: INITIAL_QUESTIONS,
  holidays: INITIAL_HOLIDAYS,
  lossReasons: INITIAL_LOSS_REASONS,
  periods: INITIAL_PERIODS,
  customers: INITIAL_MASTER_CUSTOMERS,
};

interface MasterDataState {
  categories: MasterCategory[];
  competitors: MasterCompetitor[];
  docTypes: MasterDocType[];
  questions: MasterQuestion[];
  holidays: MasterHoliday[];
  lossReasons: MasterLossReason[];
  periods: MasterPeriod[];
  customers: MasterCustomer[];
  getData: <T>(entity: EntityType) => T[];
  addData: <T>(entity: EntityType, item: T) => void;
  updateData: <T extends { id: string }>(entity: EntityType, id: string, data: Partial<T>) => void;
  deleteData: (entity: EntityType, id: string) => void;
}

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      categories: INITIAL_CATEGORIES,
      competitors: INITIAL_COMPETITORS,
      docTypes: INITIAL_DOC_TYPES,
      questions: INITIAL_QUESTIONS,
      holidays: INITIAL_HOLIDAYS,
      lossReasons: INITIAL_LOSS_REASONS,
      periods: INITIAL_PERIODS,
      customers: INITIAL_MASTER_CUSTOMERS,

      getData: <T>(entity: EntityType) => get()[entity] as unknown as T[],
      addData: <T>(entity: EntityType, item: T) =>
        set((s) => ({ [entity]: [...(s[entity] as any[]), item] } as any)),
      updateData: <T extends { id: string }>(entity: EntityType, id: string, data: Partial<T>) =>
        set((s) => ({
          [entity]: (s[entity] as any[]).map((item: any) =>
            item.id === id ? { ...item, ...data } : item
          ),
        } as any)),
      deleteData: (entity: EntityType, id: string) =>
        set((s) => ({
          [entity]: (s[entity] as any[]).filter((item: any) => item.id !== id),
        } as any)),
    }),
    { name: 'kinetic-master-data' },
  ),
);
