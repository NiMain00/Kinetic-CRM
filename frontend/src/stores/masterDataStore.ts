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

// ===== NEW ENTITIES =====

export interface MasterIndustry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface MasterProjectStatus {
  id: string;
  code: string;
  label: string;
  description: string;
  color_hex: string;
  text_color_hex: string;
  sort_order: number;
  is_system: boolean;
  is_terminal: boolean;
  is_active: boolean;
  applicable_to: string;
}

export interface MasterDocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  allowed_extensions: string[];
  max_size_mb: number;
  is_required_at_stage: string[] | null;
  applicable_to: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

export interface MasterQuestionType {
  id: string;
  name: string;
  code: string;
  description: string;
  has_options: boolean;
  validation_config: string;
  is_system: boolean;
  is_active: boolean;
}

export interface MasterDepartment {
  id: string;
  name: string;
  code: string;
  head: string;
  division: string;
  status: boolean;
}

export interface MasterUser {
  id: string;
  name: string;
  branch: string;
  username: string;
  email: string;
  role: string;
  roleColor: string;
  active: boolean;
  avatarColor: string;
}

export interface MasterAuditLog {
  id: string;
  time: string;
  user: string;
  userInitials: string;
  action: string;
  actionColor: string;
  entity: string;
  entityName: string;
  impact: 'Low' | 'Medium' | 'High';
  beforeJson: string;
  afterJson: string;
}

export interface MasterApprovalLevel {
  id: string;
  name: string;
  code: string;
  level_number: number;
  escalates_to_level_id: string | null;
  description: string;
  is_active: boolean;
}

export interface MasterNotifTemplate {
  id: string;
  event_code: string;
  event_name: string;
  template_inapp: string;
  recipient_roles: string[];
  available_variables: string[];
  is_active: boolean;
  is_system: boolean;
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

// ===== NEW INITIAL DATA =====

const INITIAL_INDUSTRIES: MasterIndustry[] = [
  { id: 'IND-01', name: 'Energi & Pertambangan', code: 'ENERGI', is_active: true },
  { id: 'IND-02', name: 'Konstruksi & Infrastruktur', code: 'KONSTRUKSI', is_active: true },
  { id: 'IND-03', name: 'Teknologi Informasi', code: 'TI', is_active: true },
  { id: 'IND-04', name: 'Perbankan & Keuangan', code: 'BANK', is_active: true },
  { id: 'IND-05', name: 'Manufaktur', code: 'MANUFAKTUR', is_active: true },
  { id: 'IND-06', name: 'Pemerintahan', code: 'PEMERINTAH', is_active: true },
  { id: 'IND-07', name: 'Kesehatan', code: 'KESEHATAN', is_active: true },
  { id: 'IND-08', name: 'Pendidikan', code: 'PENDIDIKAN', is_active: true },
  { id: 'IND-09', name: 'Retail & Distribusi', code: 'RETAIL', is_active: true },
  { id: 'IND-10', name: 'Telekomunikasi', code: 'TELKO', is_active: true },
  { id: 'IND-11', name: 'Lainnya', code: 'LAINNYA', is_active: true },
];

const INITIAL_PROJECT_STATUSES: MasterProjectStatus[] = [
  { id: 'PS-01', code: 'created', label: 'Dibuat', description: 'Proyek baru dibuat', color_hex: '#6B7280', text_color_hex: '#FFFFFF', sort_order: 1, is_system: true, is_terminal: false, is_active: true, applicable_to: 'both' },
  { id: 'PS-02', code: 'submit_rks', label: 'RKS Disubmit', description: 'RKS telah disubmit', color_hex: '#2563A8', text_color_hex: '#FFFFFF', sort_order: 2, is_system: true, is_terminal: false, is_active: true, applicable_to: 'tender' },
  { id: 'PS-03', code: 'review_department', label: 'Review Departemen', description: 'Dalam review oleh departemen', color_hex: '#7C3AED', text_color_hex: '#FFFFFF', sort_order: 3, is_system: true, is_terminal: false, is_active: true, applicable_to: 'tender' },
  { id: 'PS-04', code: 'lphs_sios', label: 'LPHS/SIOS', description: 'Proses LPHS dan SIOS', color_hex: '#4338CA', text_color_hex: '#FFFFFF', sort_order: 4, is_system: true, is_terminal: false, is_active: true, applicable_to: 'tender' },
  { id: 'PS-05', code: 'revision', label: 'Revisi', description: 'Proyek dalam revisi', color_hex: '#D97706', text_color_hex: '#FFFFFF', sort_order: 5, is_system: true, is_terminal: false, is_active: true, applicable_to: 'both' },
  { id: 'PS-06', code: 'submit_harga', label: 'Input Harga', description: 'Input harga penawaran', color_hex: '#0D9488', text_color_hex: '#FFFFFF', sort_order: 6, is_system: true, is_terminal: false, is_active: true, applicable_to: 'both' },
  { id: 'PS-07', code: 'pengumuman_pemenang', label: 'Pengumuman Pemenang', description: 'Pengumuman pemenang tender', color_hex: '#EA580C', text_color_hex: '#FFFFFF', sort_order: 7, is_system: true, is_terminal: false, is_active: true, applicable_to: 'both' },
  { id: 'PS-08', code: 'target_delivery', label: 'Target Delivery', description: 'Proyek dalam tahap delivery', color_hex: '#0284C7', text_color_hex: '#FFFFFF', sort_order: 8, is_system: true, is_terminal: false, is_active: true, applicable_to: 'both' },
  { id: 'PS-09', code: 'selesai', label: 'Selesai', description: 'Proyek selesai', color_hex: '#16A34A', text_color_hex: '#FFFFFF', sort_order: 9, is_system: true, is_terminal: true, is_active: true, applicable_to: 'both' },
  { id: 'PS-10', code: 'cancelled', label: 'Dibatalkan', description: 'Proyek dibatalkan', color_hex: '#9F1239', text_color_hex: '#FFFFFF', sort_order: 10, is_system: true, is_terminal: true, is_active: true, applicable_to: 'both' },
];

const INITIAL_DOCUMENT_TYPES: MasterDocumentType[] = [
  { id: 'DT-01', name: 'Dokumen Tender / RKS', code: 'RKS', description: 'Dokumen tender dan RKS', allowed_extensions: ['pdf', 'docx'], max_size_mb: 25, is_required_at_stage: ['submit_rks'], applicable_to: 'tender', sort_order: 1, is_system: true, is_active: true },
  { id: 'DT-02', name: 'Draft LPHS', code: 'LPHS', description: 'Daftar Harga Perkiraan Sendiri', allowed_extensions: ['pdf', 'docx', 'xlsx'], max_size_mb: 50, is_required_at_stage: ['lphs_sios'], applicable_to: 'tender', sort_order: 2, is_system: true, is_active: true },
  { id: 'DT-03', name: 'Draft SIOS', code: 'SIOS', description: 'Surat Ijin Operasional Sementara', allowed_extensions: ['pdf', 'docx'], max_size_mb: 25, is_required_at_stage: null, applicable_to: 'tender', sort_order: 3, is_system: true, is_active: true },
  { id: 'DT-04', name: 'Surat Perintah Kerja / Kontrak', code: 'SPK', description: 'SPK atau kontrak proyek', allowed_extensions: ['pdf'], max_size_mb: 25, is_required_at_stage: null, applicable_to: 'both', sort_order: 4, is_system: true, is_active: true },
  { id: 'DT-05', name: 'Surat Kekalahan', code: 'SURAT_KALAH', description: 'Surat pernyataan kekalahan', allowed_extensions: ['pdf'], max_size_mb: 10, is_required_at_stage: null, applicable_to: 'both', sort_order: 5, is_system: true, is_active: true },
  { id: 'DT-06', name: 'Dokumen Harga Penawaran', code: 'HARGA', description: 'Dokumen harga penawaran', allowed_extensions: ['pdf', 'xlsx'], max_size_mb: 10, is_required_at_stage: ['submit_harga'], applicable_to: 'both', sort_order: 6, is_system: true, is_active: true },
  { id: 'DT-07', name: 'Invoice / Tagihan', code: 'INVOICE', description: 'Invoice dan tagihan', allowed_extensions: ['pdf'], max_size_mb: 10, is_required_at_stage: null, applicable_to: 'both', sort_order: 7, is_system: true, is_active: true },
  { id: 'DT-08', name: 'Dokumen Lainnya', code: 'LAINNYA', description: 'Dokumen pendukung lainnya', allowed_extensions: ['pdf', 'docx', 'xlsx', 'jpg', 'png'], max_size_mb: 25, is_required_at_stage: null, applicable_to: 'both', sort_order: 8, is_system: true, is_active: true },
];

const INITIAL_QUESTION_TYPES: MasterQuestionType[] = [
  { id: 'QT-01', name: 'Teks Singkat', code: 'text', description: 'Input teks satu baris', has_options: false, validation_config: '{"maxLength":500}', is_system: true, is_active: true },
  { id: 'QT-02', name: 'Teks Panjang', code: 'textarea', description: 'Input teks paragraf', has_options: false, validation_config: '{"maxLength":2000}', is_system: true, is_active: true },
  { id: 'QT-03', name: 'Pilihan Tunggal (Radio)', code: 'radio', description: 'Satu pilihan dari beberapa opsi', has_options: true, validation_config: '{}', is_system: true, is_active: true },
  { id: 'QT-04', name: 'Pilihan Banyak (Checkbox)', code: 'checkbox', description: 'Beberapa pilihan dari opsi tersedia', has_options: true, validation_config: '{}', is_system: true, is_active: true },
  { id: 'QT-05', name: 'Dropdown Pilihan', code: 'select', description: 'Dropdown pilihan tunggal', has_options: true, validation_config: '{}', is_system: true, is_active: true },
  { id: 'QT-06', name: 'Angka / Numerik', code: 'number', description: 'Input angka', has_options: false, validation_config: '{"min":0,"max":9999999999}', is_system: true, is_active: true },
  { id: 'QT-07', name: 'Tanggal', code: 'date', description: 'Date picker', has_options: false, validation_config: '{"format":"YYYY-MM-DD"}', is_system: true, is_active: true },
];

const INITIAL_DEPARTMENTS: MasterDepartment[] = [
  { id: '01', name: 'IT Infrastructure', code: 'DEPT-INF-01', head: 'Budi Santoso', division: 'Technology', status: true },
  { id: '02', name: 'Financial Audit', code: 'DEPT-FIN-02', head: 'Siti Aminah', division: 'Finance & Ops', status: true },
  { id: '03', name: 'Brand Expansion', code: 'DEPT-MKT-03', head: 'Rizky Pratama', division: 'Marketing', status: false },
];

const INITIAL_USERS: MasterUser[] = [
  { id: '1', name: 'Ahmad Sulistyo', branch: 'Cabang Jakarta Pusat', username: 'asulistyo_jkp', email: 'ahmad.s@kinetic.co.id', role: 'Cabang', roleColor: 'bg-secondary-container text-on-secondary-container', active: true, avatarColor: 'bg-primary/10 text-primary' },
  { id: '2', name: 'Bambang Permadi', branch: 'Project Management', username: 'bambang.pm', email: 'b.permadi@kinetic.co.id', role: 'PM', roleColor: 'bg-primary-container text-on-primary-container', active: true, avatarColor: 'bg-status-purple/10 text-status-purple' },
  { id: '3', name: 'Rina Marlina', branch: 'Operations Dept', username: 'rina.ops', email: 'rina.marlina@kinetic.co.id', role: 'Dept', roleColor: 'bg-secondary-fixed text-on-secondary-fixed-variant', active: false, avatarColor: 'bg-status-orange/10 text-status-orange' },
  { id: '4', name: 'Doni Wahyudi', branch: 'Head Office', username: 'doni.admin', email: 'doni.w@kinetic.co.id', role: 'Admin', roleColor: 'bg-status-maroon/10 text-status-maroon', active: true, avatarColor: 'bg-status-maroon/10 text-status-maroon' },
];

const INITIAL_AUDIT_LOGS: MasterAuditLog[] = [
  { id: 'AUD-77291102', time: '2026-06-18 14:32:01', user: 'Admin User', userInitials: 'AS', action: 'UPDATE', actionColor: 'bg-status-indigo/10 text-status-indigo', entity: 'PRJ-4022', entityName: 'Infrastructure Dev', impact: 'Medium', beforeJson: '{\n  "id": "PRJ-4022",\n  "status": "PENDING_REVIEW",\n  "budget_cap": 250000.00,\n  "last_modified_by": "PB_INTERNAL"\n}', afterJson: '{\n  "id": "PRJ-4022",\n  "status": "ACTIVE_OPERATIONAL",\n  "budget_cap": 375000.00,\n  "last_modified_by": "PB_INTERNAL",\n  "revision": 14\n}' },
  { id: 'AUD-77291103', time: '2026-06-18 14:15:22', user: 'Pam Beesly', userInitials: 'PB', action: 'APPROVE', actionColor: 'bg-success/10 text-success', entity: 'INV-20993', entityName: 'Invoice Unit 2', impact: 'Low', beforeJson: '{\n  "invoice_id": "INV-20993",\n  "approved": false\n}', afterJson: '{\n  "invoice_id": "INV-20993",\n  "approved": true,\n  "approved_by": "Pam Beesly"\n}' },
  { id: 'AUD-77291104', time: '2026-06-18 13:58:10', user: 'Dwight Schrute', userInitials: 'DS', action: 'DELETE', actionColor: 'bg-danger/10 text-danger', entity: 'TMP_REPORT_01', entityName: 'Temporary Report', impact: 'High', beforeJson: '{\n  "report_name": "TMP_REPORT_01",\n  "owner": "Dwight Schrute"\n}', afterJson: 'null' },
  { id: 'AUD-77291105', time: '2026-06-18 13:42:45', user: 'Michael Scott', userInitials: 'MS', action: 'CREATE', actionColor: 'bg-status-teal/10 text-status-teal', entity: 'LEAD-8812', entityName: 'Prospect Lead X', impact: 'Low', beforeJson: 'null', afterJson: '{\n  "lead_id": "LEAD-8812",\n  "title": "Pondasi Region 3",\n  "created_by": "Michael Scott"\n}' },
];

const INITIAL_APPROVAL_LEVELS: MasterApprovalLevel[] = [
  { id: 'AL-01', name: 'Review PM / Kepala Cabang', code: 'L1', level_number: 1, escalates_to_level_id: 'AL-02', description: 'Level pertama approval oleh Project Manager', is_active: true },
  { id: 'AL-02', name: 'Review Departemen / Kepala Dept', code: 'L2', level_number: 2, escalates_to_level_id: 'AL-03', description: 'Level kedua approval oleh Kepala Departemen', is_active: true },
  { id: 'AL-03', name: 'Persetujuan Management', code: 'L3', level_number: 3, escalates_to_level_id: null, description: 'Level akhir approval oleh Management', is_active: true },
];

const INITIAL_NOTIF_TEMPLATES: MasterNotifTemplate[] = [
  { id: 'NT-01', event_code: 'prospect.submitted', event_name: 'Prospek Disubmit ke PM', template_inapp: 'Prospek {{prospectName}} dari {{branchName}} menunggu review Anda.', recipient_roles: ['pm'], available_variables: ['prospectName', 'branchName'], is_active: true, is_system: true },
  { id: 'NT-02', event_code: 'prospect.revision_sent', event_name: 'Revisi Prospek Dikirim', template_inapp: 'PM meminta revisi untuk prospek {{prospectName}}. Silakan periksa pertanyaan review.', recipient_roles: ['cabang'], available_variables: ['prospectName'], is_active: true, is_system: true },
  { id: 'NT-03', event_code: 'prospect.approved', event_name: 'Prospek Disetujui', template_inapp: 'Prospek {{prospectName}} telah disetujui oleh PM. Anda dapat mengkonversinya menjadi proyek.', recipient_roles: ['cabang'], available_variables: ['prospectName'], is_active: true, is_system: true },
  { id: 'NT-04', event_code: 'project.rks_submitted', event_name: 'RKS Disubmit', template_inapp: 'RKS proyek {{projectName}} menunggu review Anda.', recipient_roles: ['pm'], available_variables: ['projectName'], is_active: true, is_system: true },
  { id: 'NT-05', event_code: 'project.deadline_approaching', event_name: 'Deadline Tender Mendekat', template_inapp: 'Proyek {{projectName}} memiliki deadline tender dalam {{daysRemaining}} hari ({{deadlineDate}}).', recipient_roles: ['cabang', 'pm'], available_variables: ['projectName', 'daysRemaining', 'deadlineDate'], is_active: true, is_system: true },
  { id: 'NT-06', event_code: 'project.cancelled', event_name: 'Proyek Dibatalkan', template_inapp: 'Proyek {{projectName}} telah dibatalkan. Alasan: {{cancelReason}}.', recipient_roles: ['cabang'], available_variables: ['projectName', 'cancelReason'], is_active: true, is_system: true },
];

type EntityType = 'categories' | 'competitors' | 'docTypes' | 'questions' | 'holidays' | 'lossReasons' | 'periods' | 'customers' | 'industries' | 'projectStatuses' | 'documentTypes' | 'questionTypes' | 'departments' | 'users' | 'auditLogs' | 'approvalLevels' | 'notifTemplates';

const INITIAL_DATA: Record<EntityType, any[]> = {
  categories: INITIAL_CATEGORIES,
  competitors: INITIAL_COMPETITORS,
  docTypes: INITIAL_DOC_TYPES,
  questions: INITIAL_QUESTIONS,
  holidays: INITIAL_HOLIDAYS,
  lossReasons: INITIAL_LOSS_REASONS,
  periods: INITIAL_PERIODS,
  customers: INITIAL_MASTER_CUSTOMERS,
  industries: INITIAL_INDUSTRIES,
  projectStatuses: INITIAL_PROJECT_STATUSES,
  documentTypes: INITIAL_DOCUMENT_TYPES,
  questionTypes: INITIAL_QUESTION_TYPES,
  departments: INITIAL_DEPARTMENTS,
  users: INITIAL_USERS,
  auditLogs: INITIAL_AUDIT_LOGS,
  approvalLevels: INITIAL_APPROVAL_LEVELS,
  notifTemplates: INITIAL_NOTIF_TEMPLATES,
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
  industries: MasterIndustry[];
  projectStatuses: MasterProjectStatus[];
  documentTypes: MasterDocumentType[];
  questionTypes: MasterQuestionType[];
  departments: MasterDepartment[];
  users: MasterUser[];
  auditLogs: MasterAuditLog[];
  approvalLevels: MasterApprovalLevel[];
  notifTemplates: MasterNotifTemplate[];
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
      industries: INITIAL_INDUSTRIES,
      projectStatuses: INITIAL_PROJECT_STATUSES,
      documentTypes: INITIAL_DOCUMENT_TYPES,
      questionTypes: INITIAL_QUESTION_TYPES,
      departments: INITIAL_DEPARTMENTS,
      users: INITIAL_USERS,
      auditLogs: INITIAL_AUDIT_LOGS,
      approvalLevels: INITIAL_APPROVAL_LEVELS,
      notifTemplates: INITIAL_NOTIF_TEMPLATES,

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
