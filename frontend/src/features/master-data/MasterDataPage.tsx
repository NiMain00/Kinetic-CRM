import React, { useMemo, useState } from 'react';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/shared/DataTable';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import { Button, type Column } from '@/components/ui';
import MasterQuestionPage from './MasterQuestionPage';
import UsersView from '@/features/users/UsersPage';


interface MasterDataViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

// 1. Types for high-density mock datasets — aligned to specs 021–026
interface AuditLog {
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

interface MasterUser {
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

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  division: string;
  status: boolean;
}

// --- Doc 021: Customer ---
interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  industry_id: string | null;
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  address: string;
  city: string;
  province: string;
  npwp: string;
  notes: string;
  is_active: boolean;
}

// --- Doc 021: Industry ---
interface Industry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

// --- Doc 021: ProjectCategory ---
interface ProjectCategory {
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

// --- Doc 022: ProjectStatus ---
interface ProjectStatus {
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

// --- Doc 022: DocumentType ---
interface DocumentType {
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

// --- Doc 023: Competitor ---
interface Competitor {
  id: string;
  name: string;
  code: string;
  industry_id: string | null;
  bidang_usaha: string;
  website: string;
  description: string;
  is_active: boolean;
}

// --- Doc 024: QuestionType ---
interface QuestionType {
  id: string;
  name: string;
  code: string;
  description: string;
  has_options: boolean;
  validation_config: string;
  is_system: boolean;
  is_active: boolean;
}

// --- Doc 024: Question ---
interface MasterQuestion {
  id: string;
  question_text: string;
  question_type_id: string;
  context: 'prospect' | 'rks' | 'both';
  category: string;
  is_required: boolean;
  sort_order: number;
  placeholder_text: string;
  help_text: string;
  is_active: boolean;
  options?: string[];
}

// --- Doc 025: ReportingPeriod ---
interface ReportingPeriod {
  id: string;
  name: string;
  code: string;
  type: 'monthly' | 'quarterly' | 'semester' | 'annual';
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_locked: boolean;
  notes: string;
}

// --- Doc 025: PublicHoliday ---
interface PublicHoliday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'company_specific' | 'optional';
  year: number;
  is_active: boolean;
}

// --- Doc 026: LossReason ---
interface LossReason {
  id: string;
  name: string;
  code: string;
  category: 'harga' | 'teknis' | 'relasi' | 'administrasi' | 'waktu' | 'lainnya';
  description: string;
  sort_order: number;
  is_active: boolean;
}

// --- Doc 026: ApprovalLevel ---
interface ApprovalLevel {
  id: string;
  name: string;
  code: string;
  level_number: number;
  escalates_to_level_id: string | null;
  description: string;
  is_active: boolean;
}

// --- Doc 026: NotificationTemplate ---
interface NotificationTemplate {
  id: string;
  event_code: string;
  event_name: string;
  template_inapp: string;
  recipient_roles: string[];
  available_variables: string[];
  is_active: boolean;
  is_system: boolean;
}

// Data is sourced from useMasterDataStore (Zustand persist)

type SuperTab = 'customers' | 'industries' | 'categories' | 'competitors' | 'statuses' | 'doc_types' | 'questions' | 'question_types' | 'periods' | 'holidays' | 'loss_reasons' | 'approval_levels' | 'notif_templates' | 'departments' | 'users' | 'audit_logs';

export default function MasterDataView({ onShowNotification }: MasterDataViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SuperTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Store — all master data sourced from useMasterDataStore (Zustand persist)
  const store = useMasterDataStore();
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);

  const customers = useMasterDataStore((s) => s.customers) as unknown as Customer[];
  const industries = useMasterDataStore((s) => s.industries) as unknown as Industry[];
  const categories = useMasterDataStore((s) => s.categories) as unknown as ProjectCategory[];
  const competitors = useMasterDataStore((s) => s.competitors) as unknown as Competitor[];
  const projectStatuses = useMasterDataStore((s) => s.projectStatuses) as unknown as ProjectStatus[];
  const documentTypes = useMasterDataStore((s) => s.documentTypes) as unknown as DocumentType[];
  const questions = useMasterDataStore((s) => s.questions) as unknown as MasterQuestion[];
  const questionTypes = useMasterDataStore((s) => s.questionTypes) as unknown as QuestionType[];
  const periods = useMasterDataStore((s) => s.periods) as unknown as ReportingPeriod[];
  const holidays = useMasterDataStore((s) => s.holidays) as unknown as PublicHoliday[];
  const lossReasons = useMasterDataStore((s) => s.lossReasons) as unknown as LossReason[];
  const approvalLevels = useMasterDataStore((s) => s.approvalLevels) as unknown as ApprovalLevel[];
  const notifTemplates = useMasterDataStore((s) => s.notifTemplates) as unknown as NotificationTemplate[];
  const departments = useMasterDataStore((s) => s.departments) as unknown as Department[];
  const users = useMasterDataStore((s) => s.users) as unknown as MasterUser[];
  const auditLogs = useMasterDataStore((s) => s.auditLogs) as unknown as AuditLog[];

  // UI-only state (drawers, modals, etc.)
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCust, setNewCust] = useState<Partial<Customer>>({});
  const [industryDrawerOpen, setIndustryDrawerOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [compDrawerOpen, setCompDrawerOpen] = useState(false);
  const [newComp, setNewComp] = useState<Partial<Competitor>>({});
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [docTypeDrawerOpen, setDocTypeDrawerOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<DocumentType | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('Q-001');
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [activeContextTab, setActiveContextTab] = useState<'prospect' | 'rks' | 'both'>('prospect');
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

  // Local draft state for "Tambah Pertanyaan Baru" drawer
  const [newQuestionTypeId, setNewQuestionTypeId] = useState<string>('QT-01');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([]);

  const [editingQuestionType, setEditingQuestionType] = useState<QuestionType | null>(null);
  const [qtDrawerOpen, setQtDrawerOpen] = useState(false);
  const [periodDrawerOpen, setPeriodDrawerOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportingPeriod | null>(null);
  const [holidayDrawerOpen, setHolidayDrawerOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(null);
  const [lossReasonDrawerOpen, setLossReasonDrawerOpen] = useState(false);
  const [editingLossReason, setEditingLossReason] = useState<LossReason | null>(null);
  const [alDrawerOpen, setAlDrawerOpen] = useState(false);
  const [editingAl, setEditingAl] = useState<ApprovalLevel | null>(null);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<NotificationTemplate | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MasterUser | null>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);

  const qTypeLabel = (qtId: string) => questionTypes.find(qt => qt.id === qtId)?.name || qtId;

  const industryName = (indId: string | null) => indId ? industries.find(i => i.id === indId)?.name || indId : '-';

  const questionTypeIcon = (qtId: string) => {
    const map: Record<string, string> = { 'text': 'text_fields', 'textarea': 'notes', 'radio': 'radio_button_checked', 'checkbox': 'checklist', 'select': 'arrow_drop_down_circle', 'number': 'pin', 'date': 'calendar_today' };
    const code = questionTypes.find(qt => qt.id === qtId)?.code;
    return map[code || ''] || 'help_outline';
  };

  const tabClass = (tab: SuperTab) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-[10px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
      activeTab === tab
        ? 'border-primary text-primary bg-primary/5'
        : 'border-transparent text-secondary hover:text-primary hover:bg-surface-container-high'
    }`;

  const renderPreviewInput = (q: MasterQuestion) => {
    const qt = questionTypes.find(t => t.id === q.question_type_id);
    const code = qt?.code || 'text';
    switch (code) {
      case 'text':
        return (
          <input type="text" disabled placeholder={q.placeholder_text || 'Contoh masukan teks...'} className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs focus:outline-none cursor-not-allowed" />
        );
      case 'radio':
        return (
          <div className="space-y-1.5 mt-2">
            {(q.options || ['Opsi 1', 'Opsi 2']).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-surface-container-low text-xs">
                <input type="radio" checked={i === 0} disabled className="text-primary focus:ring-0" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'textarea':
        return <textarea disabled rows={3} placeholder={q.placeholder_text || 'Masukkan teks...'} className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs resize-none cursor-not-allowed" />;
      case 'number':
        return <input type="number" disabled placeholder={q.placeholder_text || '0'} className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs cursor-not-allowed" />;
      case 'date':
        return <input type="date" disabled className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs cursor-not-allowed" />;
      case 'checkbox':
        return (
          <div className="space-y-1.5 mt-2">
            {(q.options || ['Opsi 1', 'Opsi 2']).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-surface-container-low text-xs">
                <input type="checkbox" disabled className="text-primary focus:ring-0" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'select':
        return (
          <select disabled className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs cursor-not-allowed">
            <option>{(q.options || ['Pilih opsi'])[0]}</option>
          </select>
        );
      default:
        return <input type="text" disabled className="w-full bg-surface-container-low border border-border rounded-lg p-2 text-xs cursor-not-allowed" />;
    }
  };

  const customerColumns: Column<Customer>[] = [
    { key: 'name', header: 'Nama', sortable: true, render: (c) => <span className="font-bold text-on-surface">{c.name}</span> },
    { key: 'code', header: 'Kode', sortable: true, render: (c) => <span className="font-mono font-semibold text-outline">{c.code}</span> },
    {
      key: 'type', header: 'Jenis', sortable: true,
      render: (c) => {
        const colorMap: Record<string, string> = { bumn: 'bg-status-indigo/15 text-status-indigo', pemerintah: 'bg-status-orange/15 text-status-orange', asing: 'bg-purple-100 text-purple-700' };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorMap[c.type] || 'bg-surface-container-high text-secondary'}`}>{c.type}</span>;
      },
    },
    { key: 'industry_id', header: 'Industri', render: (c) => <span className="text-[10px] text-outline">{industryName(c.industry_id)}</span> },
    { key: 'pic_name', header: 'PIC', render: (c) => <div className="font-medium text-secondary">{c.pic_name}</div> },
    {
      key: 'pic_email', header: 'Kontak',
      render: (c) => <div><div className="text-[10px] text-outline">{c.pic_email}</div><div className="text-[10px] text-outline">{c.pic_phone}</div></div>,
    },
    { key: 'city', header: 'Kota', render: (c) => <span className="text-outline text-[10px]">{c.city}</span> },
    {
      key: 'is_active', header: 'Aktif', sortable: true, align: 'center',
      render: (c) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${c.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-success' : 'bg-outline'}`} /></span>,
    },
    {
      key: '_actions', header: 'Aksi', align: 'right',
      render: (c) => <button onClick={() => { deleteData('customers', c.id); onShowNotification('Pelanggan dinonaktifkan.', 'success'); }} className="p-1 hover:bg-red-50 text-outline hover:text-red-650 rounded cursor-pointer"><span className="material-symbols-outlined text-base">delete</span></button>,
    },
  ];

  const industryColumns: Column<Industry>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (i) => <span className="font-mono font-bold text-primary">{i.code}</span> },
    { key: 'name', header: 'Nama Industri', sortable: true, render: (i) => <span className="font-bold text-on-surface">{i.name}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (i) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${i.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${i.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const categoryColumns: Column<ProjectCategory>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (c) => <span className="font-mono font-bold text-primary">{c.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (c) => <span className="font-bold text-on-surface">{c.name}</span> },
    { key: 'requires_lphs', header: 'LPHS', align: 'center', render: (c) => <span className={`text-[10px] font-bold ${c.requires_lphs ? 'text-success' : 'text-outline'}`}>{c.requires_lphs ? 'Ya' : 'Tidak'}</span> },
    { key: 'requires_rks', header: 'RKS', align: 'center', render: (c) => <span className={`text-[10px] font-bold ${c.requires_rks ? 'text-success' : 'text-outline'}`}>{c.requires_rks ? 'Ya' : 'Tidak'}</span> },
    { key: 'default_workflow_type', header: 'Workflow', render: (c) => <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded text-[10px] font-bold">{c.default_workflow_type}</span> },
    { key: 'color_hex', header: 'Warna', align: 'center', render: (c) => <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: c.color_hex }} /> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (c) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${c.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const competitorColumns: Column<Competitor>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (x) => <span className="font-mono font-bold text-primary">{x.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (x) => <span className="font-bold text-on-surface">{x.name}</span> },
    { key: 'industry_id', header: 'Industri', render: (x) => <span className="text-[10px] text-outline">{industryName(x.industry_id)}</span> },
    { key: 'bidang_usaha', header: 'Bidang Usaha', render: (x) => <span className="text-secondary">{x.bidang_usaha}</span> },
    { key: 'website', header: 'Website', render: (x) => <span className="text-[10px] text-primary underline">{x.website}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (x) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${x.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${x.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const statusColumns: Column<ProjectStatus>[] = [
    { key: 'sort_order', header: 'Urutan', align: 'center', render: (s) => <span className="text-outline">{s.sort_order}</span> },
    { key: 'code', header: 'Kode', sortable: true, render: (s) => <span className="font-mono font-bold text-secondary">{s.code}</span> },
    { key: 'label', header: 'Label', sortable: true, render: (s) => <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: s.color_hex }}>{s.label}</span> },
    { key: 'color_hex', header: 'Warna', render: (s) => <span className="font-mono text-[10px] text-outline">{s.color_hex}</span> },
    { key: 'is_system', header: 'System', align: 'center', render: (s) => s.is_system ? <span className="text-success text-[10px]">System</span> : <span className="text-outline text-[10px]">Custom</span> },
    { key: 'is_terminal', header: 'Terminal', align: 'center', render: (s) => s.is_terminal ? <span className="text-danger text-[10px]">Ya</span> : <span className="text-outline text-[10px]">Tidak</span> },
    { key: 'applicable_to', header: 'Berlaku Untuk', render: (s) => <span className="text-secondary text-[10px]">{s.applicable_to}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (s) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${s.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const docTypeColumns: Column<DocumentType>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (d) => <span className="font-mono font-bold text-primary">{d.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (d) => <span className="font-bold text-on-surface">{d.name}</span> },
    { key: 'allowed_extensions', header: 'Ekstensi', render: (d) => <span className="font-mono text-[10px] text-outline">{d.allowed_extensions.join(', ')}</span> },
    { key: 'max_size_mb', header: 'Max MB', align: 'center', render: (d) => <span className="font-mono text-secondary">{d.max_size_mb} MB</span> },
    { key: 'applicable_to', header: 'Berlaku', render: (d) => <span className="text-secondary text-[10px]">{d.applicable_to}</span> },
    { key: 'is_system', header: 'System', align: 'center', render: (d) => d.is_system ? <span className="text-success text-[10px]">Ya</span> : <span className="text-outline text-[10px]">Tidak</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (d) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${d.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${d.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const questionTypeColumns: Column<QuestionType>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (t) => <span className="font-mono font-bold text-primary">{t.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (t) => <span className="font-bold text-on-surface">{t.name}</span> },
    { key: 'has_options', header: 'Memiliki Opsi', render: (t) => t.has_options ? <span className="text-success text-[10px] font-bold">Ya</span> : <span className="text-outline text-[10px]">Tidak</span> },
    { key: 'validation_config', header: 'Konfigurasi Validasi', render: (t) => <code className="font-mono text-[10px] bg-surface-container-low border border-border p-1 rounded text-indigo-650">{t.validation_config}</code> },
    { key: 'is_system', header: 'System', align: 'center', render: (t) => t.is_system ? <span className="text-success text-[10px]">Ya</span> : <span className="text-outline text-[10px]">Tidak</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (t) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${t.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const periodColumns: Column<ReportingPeriod>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (p) => <span className="font-mono font-bold text-primary">{p.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (p) => <span className="font-bold text-on-surface">{p.name}</span> },
    { key: 'type', header: 'Tipe', render: (p) => <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded text-[10px] font-bold">{p.type}</span> },
    { key: 'year', header: 'Tahun', sortable: true, render: (p) => <span className="font-mono text-secondary">{p.year}</span> },
    { key: 'start_date', header: 'Mulai', render: (p) => <span className="font-mono text-[10px] text-outline">{p.start_date}</span> },
    { key: 'end_date', header: 'Selesai', render: (p) => <span className="font-mono text-[10px] text-outline">{p.end_date}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (p) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${p.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
    { key: 'is_locked', header: 'Terkunci', align: 'center', render: (p) => p.is_locked ? <span className="text-danger text-[10px] font-bold">Terkunci</span> : <span className="text-outline text-[10px]">Buka</span> },
  ];

  const holidayColumns: Column<PublicHoliday>[] = [
    { key: 'date', header: 'Tanggal', sortable: true, render: (h) => <span className="font-mono text-secondary">{h.date}</span> },
    { key: 'name', header: 'Nama Hari Libur', sortable: true, render: (h) => <span className="font-bold text-on-surface">{h.name}</span> },
    { key: 'type', header: 'Tipe', render: (h) => <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded text-[10px] font-bold">{h.type}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (h) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${h.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${h.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const lossReasonColumns: Column<LossReason>[] = [
    { key: 'code', header: 'Kode', sortable: true, render: (l) => <span className="font-mono font-bold text-primary">{l.code}</span> },
    { key: 'name', header: 'Nama', sortable: true, render: (l) => <span className="font-bold text-on-surface">{l.name}</span> },
    { key: 'category', header: 'Kategori', render: (l) => <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded text-[10px] font-bold">{l.category}</span> },
    { key: 'description', header: 'Deskripsi', render: (l) => <span className="text-outline text-[10px]">{l.description}</span> },
    { key: 'is_active', header: 'Aktif', sortable: true, align: 'center', render: (l) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${l.is_active ? 'text-success' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${l.is_active ? 'bg-success' : 'bg-outline'}`} /></span> },
  ];

  const departmentColumns: Column<Department>[] = [
    { key: 'name', header: 'Nama Departemen', sortable: true, render: (d) => <span className="font-bold text-on-surface">{d.name}</span> },
    { key: 'code', header: 'Kode', render: (d) => <span className="p-1 px-2 font-mono bg-surface-container-high rounded text-secondary text-[11px] font-semibold">{d.code}</span> },
    { key: 'head', header: 'Kepala Urusan', render: (d) => <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-status-indigo/20 text-status-indigo flex items-center justify-center text-[10px]"><span className="material-symbols-outlined text-[12px]">person</span></div><span className="font-semibold text-secondary">{d.head}</span></div> },
    { key: 'division', header: 'Divisi Utama', render: (d) => <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold">{d.division}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (d) => <button onClick={() => { updateData('departments', d.id, { status: !d.status } as any); onShowNotification(`Status departemen ${d.name} dirubah.`, 'success'); }} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${d.status ? 'bg-success' : 'bg-border'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ${d.status ? 'translate-x-5' : 'translate-x-1'}`} /></button> },
    { key: '_actions', header: 'Aksi', align: 'right', render: (d) => <button onClick={() => { setEditingDepartment(d); setDeptDrawerOpen(true); }} className="p-1 hover:bg-surface-container-high rounded text-outline hover:text-primary cursor-pointer" title="Atur Departemen"><span className="material-symbols-outlined text-base">edit_note</span></button> },
  ];

  const auditLogColumns: Column<AuditLog>[] = [
    { key: 'time', header: 'Waktu Log', sortable: true, render: (log) => <div><p className="font-mono font-medium text-secondary">{log.time}</p><p className="text-[9px] text-outline">Waktu Standar Server Lokal</p></div> },
    { key: 'user', header: 'Pelaku Operator', render: (log) => <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-black">{log.userInitials}</span><span className="font-bold text-secondary">{log.user}</span></div> },
    { key: 'action', header: 'Tipe Mutasi', render: (log) => <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${log.actionColor}`}>{log.action}</span> },
    { key: 'entity', header: 'Entitas Referensi', render: (log) => <div><span className="font-bold text-on-surface">{log.entity}</span><span className="text-[10px] text-outline block font-medium">({log.entityName})</span></div> },
    { key: 'impact', header: 'Dampak Risiko', align: 'center', render: (log) => <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${log.impact === 'High' ? 'text-red-500' : log.impact === 'Medium' ? 'text-amber-500' : 'text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${log.impact === 'High' ? 'bg-red-500' : log.impact === 'Medium' ? 'bg-amber-500' : 'bg-outline'}`} />Akses {log.impact}</span> },
    { key: '_actions', header: 'Periksa JSON', align: 'right', render: (log) => <button onClick={() => { setSelectedAuditLog(log); setAuditDetailOpen(true); }} className="px-3 py-1 bg-white border border-border text-primary hover:bg-primary/5 rounded font-bold transition-all text-[10px] cursor-pointer">Bandingkan Diff</button> },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-on-surface">
      
      {/* Header — title inline with search */}
      <div className="bg-white border-b border-border shrink-0 px-8 py-2 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-extrabold text-on-surface whitespace-nowrap">Ruang Kerja Data Master</h2>
          <span className="hidden sm:block w-px h-4 bg-border/60" />
          <p className="hidden sm:block text-[10px] text-outline truncate">Konsol operasi pusat untuk memelihara data master regional.</p>
        </div>

        {/* Search Query Filter input */}
        <div className="relative w-56 shrink-0">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input
            type="text"
            placeholder="Cari records master..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-high rounded-full border-none focus:ring-1 focus:ring-primary text-xs"
          />
        </div>
      </div>

      {/* Under-header Navigation Bar Tabs — compact */}
      <div className="bg-white px-6 flex overflow-x-auto border-b border-border shrink-0 custom-scrollbar scrollbar-hide">
        <button onClick={() => { setActiveTab('customers'); setSearchQuery(''); }} className={tabClass('customers')}>
          <span className="material-symbols-outlined text-xs">groups</span> Pelanggan
        </button>
        <button onClick={() => { setActiveTab('industries'); setSearchQuery(''); }} className={tabClass('industries')}>
          <span className="material-symbols-outlined text-xs">category</span> Industri
        </button>
        <button onClick={() => { setActiveTab('categories'); setSearchQuery(''); }} className={tabClass('categories')}>
          <span className="material-symbols-outlined text-xs">folder</span> Kategori Proyek
        </button>
        <button onClick={() => { setActiveTab('competitors'); setSearchQuery(''); }} className={tabClass('competitors')}>
          <span className="material-symbols-outlined text-xs">factory</span> Kompetitor
        </button>
        <button onClick={() => { setActiveTab('statuses'); setSearchQuery(''); }} className={tabClass('statuses')}>
          <span className="material-symbols-outlined text-xs">flag</span> Status Proyek
        </button>
        <button onClick={() => { setActiveTab('doc_types'); setSearchQuery(''); }} className={tabClass('doc_types')}>
          <span className="material-symbols-outlined text-xs">description</span> Tipe Dokumen
        </button>
        <button onClick={() => { setActiveTab('questions'); setSearchQuery(''); }} className={tabClass('questions')}>
          <span className="material-symbols-outlined text-xs">list_alt</span> Pertanyaan
        </button>
        <button onClick={() => { setActiveTab('question_types'); setSearchQuery(''); }} className={tabClass('question_types')}>
          <span className="material-symbols-outlined text-xs">rule</span> Tipe Respon
        </button>
        <button onClick={() => { setActiveTab('periods'); setSearchQuery(''); }} className={tabClass('periods')}>
          <span className="material-symbols-outlined text-xs">calendar_month</span> Periode
        </button>
        <button onClick={() => { setActiveTab('holidays'); setSearchQuery(''); }} className={tabClass('holidays')}>
          <span className="material-symbols-outlined text-xs">celebration</span> Hari Libur
        </button>
        <button onClick={() => { setActiveTab('loss_reasons'); setSearchQuery(''); }} className={tabClass('loss_reasons')}>
          <span className="material-symbols-outlined text-xs">sentiment_dissatisfied</span> Alasan Kekalahan
        </button>
        <button onClick={() => { setActiveTab('departments'); setSearchQuery(''); }} className={tabClass('departments')}>
          <span className="material-symbols-outlined text-xs">domain</span> Departemen
        </button>
        <button onClick={() => { setActiveTab('users'); setSearchQuery(''); }} className={tabClass('users')}>
          <span className="material-symbols-outlined text-xs">manage_accounts</span> Pengguna
        </button>
        <button onClick={() => { setActiveTab('audit_logs'); setSearchQuery(''); }} className={tabClass('audit_logs')}>
          <span className="material-symbols-outlined text-xs">security</span> Log Audit
        </button>
      </div>

      {/* 3. SCROLLABLE INNER PANEL SECTION — compact */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">

        {/* ==================== CUSTOMER (Doc 021) ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">groups</span>
                  Master Pelanggan
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Referensi customer terpusat untuk prospek dan proyek. Doc 021 §1.</p>
              </div>
              <button onClick={() => { setNewCust({}); setCustomerModalOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Pelanggan
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={customerColumns}
                data={customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(c) => c.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-customers"
              />
            </div>
          </div>
        )}

        {/* ==================== INDUSTRY (Doc 021 §3) ==================== */}
        {activeTab === 'industries' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">category</span>
                  Master Industri
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Segmen industri untuk customer. Doc 021 §3.</p>
              </div>
              <button onClick={() => { setEditingIndustry({ id: '', name: '', code: '', is_active: true }); setIndustryDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Industri
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={industryColumns}
                data={industries.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(i) => i.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-industries"
              />
            </div>
          </div>
        )}

        {/* ==================== PROJECT CATEGORY (Doc 021 §2) ==================== */}
        {activeTab === 'categories' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">folder</span>
                  Kategori Proyek
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Klasifikasi proyek berdasarkan jenis pekerjaan. Doc 021 §2.</p>
              </div>
              <button onClick={() => { setEditingCategory({ id: '', name: '', code: '', description: '', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#6B7280', sort_order: 0, is_active: true }); setCategoryDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Kategori
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={categoryColumns}
                data={categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(c) => c.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-categories"
              />
            </div>
          </div>
        )}

        {/* ==================== COMPETITOR (Doc 023) ==================== */}
        {activeTab === 'competitors' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">factory</span>
                  Master Kompetitor
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Entitas kompetitor ternormalisasi untuk analisis win rate. Doc 023.</p>
              </div>
              <button onClick={() => { setNewComp({}); setCompDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Kompetitor
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={competitorColumns}
                data={competitors.filter(x => x.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(x) => x.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-competitors"
              />
            </div>
          </div>
        )}

        {/* ==================== PROJECT STATUS (Doc 022 §1) ==================== */}
        {activeTab === 'statuses' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">flag</span>
                  Status Proyek
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Status proyek dinamis yang dapat dikonfigurasi. Doc 022 §1.</p>
              </div>
              <button onClick={() => { setEditingStatus({ id: '', code: '', label: '', description: '', color_hex: '#6B7280', text_color_hex: '#FFFFFF', sort_order: 0, is_system: false, is_terminal: false, is_active: true, applicable_to: 'both' }); setStatusDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Status
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={statusColumns}
                data={projectStatuses.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(s) => s.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-statuses"
              />
            </div>
          </div>
        )}

        {/* ==================== DOCUMENT TYPE (Doc 022 §2) ==================== */}
        {activeTab === 'doc_types' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">description</span>
                  Tipe Dokumen
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Klasifikasi dokumen untuk upload dan validasi. Doc 022 §2.</p>
              </div>
              <button onClick={() => { setEditingDocType({ id: '', name: '', code: '', description: '', allowed_extensions: ['pdf'], max_size_mb: 25, is_required_at_stage: null, applicable_to: 'both', sort_order: 0, is_system: false, is_active: true }); setDocTypeDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Tipe
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={docTypeColumns}
                data={documentTypes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(d) => d.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-doc-types"
              />
            </div>
          </div>
        )}

        {/* ==================== QUESTION (Doc 024 §3) ==================== */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <MasterQuestionPage />
          </div>
        )}


        {/* ==================== QUESTION TYPE (Doc 024 §2) ==================== */}
        {activeTab === 'question_types' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <h3 className="text-xs font-bold text-on-surface flex items-center">
                <span className="material-symbols-outlined mr-1.5 text-primary text-sm">rule</span>
                Tipe Pertanyaan
              </h3>
              <button onClick={() => { setEditingQuestionType({ id: '', name: '', code: '', description: '', has_options: false, validation_config: '{}', is_system: false, is_active: true }); setQtDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add_circle</span> Tambah Tipe
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={questionTypeColumns}
                data={questionTypes.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(t) => t.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-question-types"
              />
            </div>
          </div>
        )}

        {/* ==================== REPORTING PERIOD (Doc 025 §2) ==================== */}
        {activeTab === 'periods' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">calendar_month</span>
                  Periode Pelaporan
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Periode untuk laporan, target, dan SLA. Doc 025 §2.</p>
              </div>
              <button onClick={() => { setEditingPeriod({ id: '', name: '', code: '', type: 'quarterly', year: 2026, start_date: '', end_date: '', is_active: true, is_locked: false, notes: '' }); setPeriodDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Periode
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={periodColumns}
                data={periods.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(p) => p.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-periods"
              />
            </div>
          </div>
        )}

        {/* ==================== PUBLIC HOLIDAY (Doc 025 §3) ==================== */}
        {activeTab === 'holidays' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">celebration</span>
                  Hari Libur Nasional
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Kalender hari libur untuk kalkulasi SLA hari kerja. Doc 025 §3.</p>
              </div>
              <button onClick={() => { setEditingHoliday({ id: '', date: '', name: '', type: 'national', year: 2026, is_active: true }); setHolidayDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Libur
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={holidayColumns}
                data={holidays.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(h) => h.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-holidays"
              />
            </div>
          </div>
        )}

        {/* ==================== LOSS REASON (Doc 026 §1) ==================== */}
        {activeTab === 'loss_reasons' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">sentiment_dissatisfied</span>
                  Alasan Kekalahan
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Alasan kekalahan tender terstandar untuk analisis. Doc 026 §1.</p>
              </div>
              <button onClick={() => { setEditingLossReason({ id: '', name: '', code: '', category: 'harga', description: '', sort_order: 0, is_active: true }); setLossReasonDrawerOpen(true); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Alasan
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={lossReasonColumns}
                data={lossReasons.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(l) => l.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-loss-reasons"
              />
            </div>
          </div>
        )}

        {/* ==================== DEPARTEMEN ==================== */}
        {activeTab === 'departments' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">domain</span>
                  Master Departemen Organisasi
                </h3>
                <p className="text-outline text-[10px] mt-0.5 font-medium">Tentukan departemen resmi sistem, koordinator kepala, serta wilayah afiliasi divisi penanggung jawab.</p>
              </div>
              <button onClick={() => { onShowNotification('Pendaftaran departemen baru disimulasikan.', 'success'); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[14px]">add</span> Tambah Departemen
              </button>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={departmentColumns}
                data={departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(d) => d.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-departments"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-border rounded-xl shadow-sm flex items-center gap-2"><span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full text-sm">groups</span><div><p className="text-[9px] text-outline font-bold uppercase tracking-wider">Total Departemen</p><p className="text-sm font-extrabold text-on-surface">24 Internal</p></div></div>
              <div className="p-3 bg-white border border-border rounded-xl shadow-sm flex items-center gap-2 animate-fade-in text-left"><span className="material-symbols-outlined text-success bg-green-50 p-2 rounded-full text-sm">verified</span><div><p className="text-[9px] text-outline font-bold uppercase tracking-wider">Aktif Beroperasi</p><p className="text-sm font-extrabold text-on-surface">21 Aktif</p></div></div>
              <div className="p-3 bg-white border border-border rounded-xl shadow-sm flex items-center gap-2"><span className="material-symbols-outlined text-secondary bg-surface-container-high p-2 rounded-full text-sm">cancel</span><div><p className="text-[9px] text-outline font-bold uppercase tracking-wider">Inaktif / Ditahan</p><p className="text-sm font-extrabold text-on-surface">03 Nonaktif</p></div></div>
            </div>
          </div>
        )}

        {/* ==================== USERS ==================== */}
        {activeTab === 'users' && (
          <UsersView onShowNotification={onShowNotification} onNavigatePage={() => {}} />
        )}

        {/* ==================== SYSTEM AUDIT LOG ==================== */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-white p-3 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary text-sm">security_update_warning</span>
                  Jejak Audit Sistem & Log Keamanan
                </h3>
                <p className="text-outline text-[10px] mt-0.5">Metadata operasional, perubahan status RKS komparatif, jejak login administrator, dan jejak mutasi data.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onShowNotification('Ekspor CSV dari real-time audit log berhasil.', 'success')} className="px-3 py-1 bg-white border border-border hover:bg-surface-container-low text-secondary text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">download</span> Ekspor CSV
                </button>
                <button onClick={() => { onShowNotification('Log audit terupdate secara synchronous.', 'success'); }} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">refresh</span> Perbarui Data
                </button>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden p-1.5">
              <DataTable
                columns={auditLogColumns}
                data={auditLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.entity.toLowerCase().includes(searchQuery.toLowerCase()))}
                keyExtractor={(log) => log.id}
                pageSize={10}
                showPagination
                exportable
                exportFilename="master-audit-logs"
              />
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* =================== MODAL OVERLAYS AND INTERACTIVES ===================== */}
      {/* ========================================================================= */}

      {/* 1. AUDIT DETAIL COMPARATIVE JSON MODAL */}
      <Modal
        isOpen={auditDetailOpen}
        onClose={() => setAuditDetailOpen(false)}
        title="Laporan Json Perbedaan Mutasi Data"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAuditDetailOpen(false)}>Tutup Dokumen</Button>
            <Button variant="primary" size="sm" onClick={() => {
              onShowNotification(`Rollback log ${selectedAuditLog?.id} berhasil diajukan.`, 'success');
              setAuditDetailOpen(false);
            }}>Rollback Mutasi</Button>
          </>
        }
      >
        {selectedAuditLog && (
          <div className="space-y-4">
            <p className="text-[10px] text-outline">ID log: {selectedAuditLog.id} • Operator: {selectedAuditLog.user}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-2.5 rounded border border-border">
                <span className="text-[10px] font-bold text-outline uppercase font-mono block">Status Sebelum Perubahan</span>
                <pre className="font-mono text-[10px] text-red-650 bg-red-50/20 p-2 rounded mt-1.5 overflow-x-auto">
                  {selectedAuditLog.beforeJson}
                </pre>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded border border-border">
                <span className="text-[10px] font-bold text-outline uppercase font-mono block">Status Sesudah Perubahan</span>
                <pre className="font-mono text-[10px] text-success bg-green-50/20 p-2 rounded mt-1.5 overflow-x-auto">
                  {selectedAuditLog.afterJson}
                </pre>
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-[10px] text-amber-700">
              <span className="font-bold block mb-0.5">Enforcement Audit Trail:</span> File backup mutasi disimpan dalam memory sandbox. Administrator diizinkan rollback dalam 24 jam.
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CUSTOMER ADD MODAL */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Tambah Pelanggan Baru"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCustomerModalOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!newCust.name) { onShowNotification('Nama pelanggan wajib dimasukkan.', 'error'); return; }
              const added: Customer = { id: String(customers.length + 1), name: newCust.name, code: newCust.code || `CST-${Math.floor(100 + Math.random() * 899)}`, type: newCust.type || 'swasta', industry_id: newCust.industry_id || null, pic_name: newCust.pic_name || '', pic_email: newCust.pic_email || '', pic_phone: newCust.pic_phone || '', address: newCust.address || '', city: newCust.city || '', province: newCust.province || '', npwp: newCust.npwp || '', notes: newCust.notes || '', is_active: true };
              addData('customers', added);
              onShowNotification(`Pelanggan ${newCust.name} berhasil ditambahkan.`, 'success');
              setCustomerModalOpen(false);
            }}>Simpan Pelanggan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Nama Pelanggan *</label><input type="text" placeholder="Nama pelanggan" value={newCust.name || ''} onChange={(e) => setNewCust({...newCust, name: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
            <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="Kode" value={newCust.code || ''} onChange={(e) => setNewCust({...newCust, code: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Jenis</label><select value={newCust.type || 'swasta'} onChange={(e) => setNewCust({...newCust, type: e.target.value as any})} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="swasta">Swasta</option><option value="bumn">BUMN</option><option value="pemerintah">Pemerintah</option><option value="asing">Asing</option></select></div>
            <div><label className="font-bold text-outline mb-1 block">Industri</label><select value={newCust.industry_id || ''} onChange={(e) => setNewCust({...newCust, industry_id: e.target.value || null})} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="">- Pilih Industri -</option>{industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          </div>
          <div><label className="font-bold text-outline mb-1 block">Nama PIC</label><input type="text" placeholder="Nama PIC" value={newCust.pic_name || ''} onChange={(e) => setNewCust({...newCust, pic_name: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Email PIC</label><input type="email" placeholder="email@domain.com" value={newCust.pic_email || ''} onChange={(e) => setNewCust({...newCust, pic_email: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
            <div><label className="font-bold text-outline mb-1 block">Telepon PIC</label><input type="text" placeholder="021-12345678" value={newCust.pic_phone || ''} onChange={(e) => setNewCust({...newCust, pic_phone: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          </div>
          <div><label className="font-bold text-outline mb-1 block">Alamat</label><textarea rows={2} placeholder="Alamat lengkap" value={newCust.address || ''} onChange={(e) => setNewCust({...newCust, address: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Kota</label><input type="text" placeholder="Kota" value={newCust.city || ''} onChange={(e) => setNewCust({...newCust, city: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
            <div><label className="font-bold text-outline mb-1 block">Provinsi</label><input type="text" placeholder="Provinsi" value={newCust.province || ''} onChange={(e) => setNewCust({...newCust, province: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">NPWP</label><input type="text" placeholder="XX.XXX.XXX.X-XXX.XXX" value={newCust.npwp || ''} onChange={(e) => setNewCust({...newCust, npwp: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          </div>
          <div><label className="font-bold text-outline mb-1 block">Catatan</label><textarea rows={2} placeholder="Catatan" value={newCust.notes || ''} onChange={(e) => setNewCust({...newCust, notes: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs resize-none" /></div>
        </div>
      </Modal>

      {/* 3. COMPETITOR DRAWER */}
      <Drawer
        isOpen={compDrawerOpen}
        onClose={() => setCompDrawerOpen(false)}
        title="Tambah Kompetitor Baru"
        subtitle="Normalisasi master kompetitor (Doc 023)"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCompDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!newComp.name) { onShowNotification('Nama kompetitor wajib diisi.', 'error'); return; }
              const added: Competitor = { id: String(competitors.length + 1), name: newComp.name, code: newComp.code || `COMP-${Math.floor(100 + Math.random() * 899)}`, industry_id: newComp.industry_id || null, bidang_usaha: newComp.bidang_usaha || '', website: newComp.website || '', description: newComp.description || '', is_active: true };
              addData('competitors', added);
              onShowNotification(`Kompetitor ${newComp.name} didaftarkan.`, 'success');
              setCompDrawerOpen(false);
            }}>Simpan Kompetitor</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama Kompetitor *</label><input type="text" placeholder="Nama resmi" value={newComp.name || ''} onChange={(e) => setNewComp({...newComp, name: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="Kode" value={newComp.code || ''} onChange={(e) => setNewComp({...newComp, code: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Industri</label><select value={newComp.industry_id || ''} onChange={(e) => setNewComp({...newComp, industry_id: e.target.value || null})} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="">- Pilih Industri -</option>{industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          <div><label className="font-bold text-outline mb-1 block">Bidang Usaha</label><input type="text" placeholder="Bidang usaha utama" value={newComp.bidang_usaha || ''} onChange={(e) => setNewComp({...newComp, bidang_usaha: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Website</label><input type="text" placeholder="https://" value={newComp.website || ''} onChange={(e) => setNewComp({...newComp, website: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Deskripsi</label><textarea rows={3} placeholder="Catatan analisis" value={newComp.description || ''} onChange={(e) => setNewComp({...newComp, description: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs resize-none" /></div>
        </div>
      </Drawer>

      {/* 5. SLIDE OVER DRAWER FOR ADDING / EDITING USERS */}
      <Drawer
        isOpen={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        title={editingUser ? 'Edit Pengguna Regional' : 'Tambah Pengguna Baru'}
        subtitle="MAST-05 Access Scoping Security"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setUserDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (editingUser) {
                updateData('users', editingUser.id, editingUser);
                onShowNotification(`Hak akses untuk ${editingUser.name} berhasil dimutasi.`, 'success');
              } else {
                onShowNotification('Pembuatan pengguna baru disimulasikan.', 'success');
              }
              setUserDrawerOpen(false);
            }}>Simpan Pengguna</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-outline mb-1 block">Nama Lengkap Karyawan</label>
            <input
              type="text"
              placeholder="Masukkan nama lengkap..."
              value={editingUser ? editingUser.name : ''}
              onChange={(e) => {
                if (editingUser) setEditingUser({ ...editingUser, name: e.target.value });
              }}
              className="w-full p-2 border border-border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Sistem Role Group</label>
            <select
              value={editingUser ? editingUser.role : 'Cabang'}
              onChange={(e) => {
                if (editingUser) setEditingUser({ ...editingUser, role: e.target.value, roleColor: e.target.value === 'Admin' ? 'bg-status-maroon/10 text-status-maroon' : 'bg-secondary-container text-on-secondary-container' });
              }}
              className="w-full p-2 border border-border rounded-lg text-xs bg-white"
            >
              <option value="Cabang">Cabang (Branch Operations)</option>
              <option value="PM">Project Manager (PM)</option>
              <option value="Dept">Department Head</option>
              <option value="Admin">System Administrator</option>
            </select>
            <p className="text-[9px] text-outline mt-0.5">Scoping default disesuaikan dengan limitasi regional.</p>
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Penempatan Regional / Kantor Pusat</label>
            <input
              type="text"
              placeholder="Misal: Cabang Jakarta Pusat"
              value={editingUser ? editingUser.branch : ''}
              onChange={(e) => {
                if (editingUser) setEditingUser({ ...editingUser, branch: e.target.value });
              }}
              className="w-full p-2 border border-border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Email Akun</label>
            <input
              type="email"
              placeholder="name.staff@kinetic.co.id"
              value={editingUser ? editingUser.email : ''}
              onChange={(e) => {
                if (editingUser) setEditingUser({ ...editingUser, email: e.target.value });
              }}
              className="w-full p-2 border border-border rounded-lg text-xs"
            />
          </div>
        </div>
      </Drawer>

      {/* 6. SLIDE OVER DRAWER FOR QUESTION DRAWER */}
      <Drawer
        isOpen={questionDrawerOpen}
        onClose={() => setQuestionDrawerOpen(false)}
        title="Tambah Pertanyaan Baru"
        subtitle="Doc 024 §3 - Master Pertanyaan"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setQuestionDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              const text = (document.getElementById('new-q-text') as HTMLInputElement)?.value;
              const typeId = (document.getElementById('new-q-type') as HTMLSelectElement)?.value;
              const ctx = (document.getElementById('new-q-context') as HTMLSelectElement)?.value as 'prospect' | 'rks' | 'both';
              const cat = (document.getElementById('new-q-category') as HTMLSelectElement)?.value;
              const ph = (document.getElementById('new-q-placeholder') as HTMLInputElement)?.value || '';
              const help = (document.getElementById('new-q-help') as HTMLTextAreaElement)?.value || '';
              if (!text) { onShowNotification('Teks pertanyaan wajib dimasukkan.', 'error'); return; }
              const maxSort = Math.max(...questions.map(q => q.sort_order), 0);
              const qt = questionTypes.find(x => x.id === typeId);
              const added: MasterQuestion = {
                id: `Q-${String(questions.length + 1).padStart(3, '0')}`,
                question_text: text,
                question_type_id: typeId,
                context: ctx,
                category: cat,
                is_required: false,
                sort_order: maxSort + 1,
                placeholder_text: ph,
                help_text: help,
                is_active: true,
                options: qt?.has_options ? newQuestionOptions : undefined,
              };
              addData('questions', added);
              setSelectedQuestionId(added.id);
              onShowNotification(`Pertanyaan "${text}" berhasil ditambahkan.`, 'success');
              setQuestionDrawerOpen(false);
            }}>Simpan Pertanyaan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-outline mb-1 block">Teks Pertanyaan *</label>
            <input type="text" id="new-q-text" placeholder="Teks pertanyaan" className="w-full p-2 border border-border rounded-lg text-xs" />
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Tipe Jawaban</label>
            <select
              id="new-q-type"
              className="w-full p-2 border border-border rounded-lg text-xs bg-white"
              value={newQuestionTypeId}
              onChange={(e) => {
                const nextId = e.target.value;
                setNewQuestionTypeId(nextId);
                const qt = questionTypes.find(x => x.id === nextId);
                if (!qt?.has_options) setNewQuestionOptions([]);
              }}
            >
              {questionTypes.map(qt => <option key={qt.id} value={qt.id}>{qt.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Konteks</label>
            <select id="new-q-context" className="w-full p-2 border border-border rounded-lg text-xs bg-white">
              <option value="prospect">Prospek</option>
              <option value="rks">RKS</option>
              <option value="both">Keduanya</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Kategori</label>
            <select id="new-q-category" className="w-full p-2 border border-border rounded-lg text-xs bg-white">
              <option value="Data Pribadi">Data Pribadi</option>
              <option value="Lokasi">Lokasi</option>
              <option value="Verifikasi Fisik">Verifikasi Fisik</option>
              <option value="Keuangan">Keuangan</option>
              <option value="Teknis">Teknis</option>
              <option value="Komersial">Komersial</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Placeholder</label>
            <input type="text" id="new-q-placeholder" placeholder="Placeholder text" className="w-full p-2 border border-border rounded-lg text-xs" />
          </div>
          <div>
            <label className="font-bold text-outline mb-1 block">Help Text</label>
            <textarea id="new-q-help" rows={3} placeholder="Teks bantuan" className="w-full p-2 border border-border rounded-lg text-xs resize-none bg-surface-container-low" />
          </div>
          {(() => {
            const qt = questionTypes.find(x => x.id === newQuestionTypeId);
            if (!qt?.has_options) return null;
            return (
              <div>
                <label className="font-bold text-outline mb-1 block">Opsi Jawaban</label>
                <textarea
                  id="new-q-options"
                  rows={3}
                  placeholder="Satu opsi per baris (contoh: Ya\nTidak)"
                  value={newQuestionOptions.join('\n')}
                  onChange={(e) => setNewQuestionOptions(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                  className="w-full p-2 border border-border rounded-lg text-xs resize-none bg-white"
                />
              </div>
            );
          })()}
        </div>
      </Drawer>

      {/* QUESTION TYPE DRAWER */}
      <Drawer
        isOpen={qtDrawerOpen}
        onClose={() => setQtDrawerOpen(false)}
        title={editingQuestionType ? 'Edit Tipe Pertanyaan' : 'Tambah Tipe Pertanyaan'}
        subtitle="Doc 024 §2 - Master Tipe Pertanyaan"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setQtDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingQuestionType?.name || !editingQuestionType?.code) { onShowNotification('Nama dan kode wajib diisi.', 'error'); return; }
              if (editingQuestionType.id) {
                updateData('questionTypes', editingQuestionType.id, editingQuestionType as any);
                onShowNotification(`Tipe ${editingQuestionType.name} diperbarui.`, 'success');
              } else {
                const added: QuestionType = { id: `QT-${String(questionTypes.length + 1).padStart(2, '0')}`, name: editingQuestionType.name, code: editingQuestionType.code, description: editingQuestionType.description || '', has_options: editingQuestionType.has_options ?? false, validation_config: editingQuestionType.validation_config || '{}', is_system: false, is_active: true };
                addData('questionTypes', added);
                onShowNotification(`Tipe ${added.name} ditambahkan.`, 'success');
              }
              setQtDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama *</label><input type="text" placeholder="Nama tipe" value={editingQuestionType?.name || ''} onChange={(e) => setEditingQuestionType(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode *</label><input type="text" placeholder="snake_case" value={editingQuestionType?.code || ''} onChange={(e) => setEditingQuestionType(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div><label className="font-bold text-outline mb-1 block">Deskripsi</label><textarea rows={2} placeholder="Deskripsi" value={editingQuestionType?.description || ''} onChange={(e) => setEditingQuestionType(prev => prev ? { ...prev, description: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs resize-none" /></div>
          <div><label className="font-bold text-outline mb-1 block">Has Options</label><select value={editingQuestionType?.has_options ? '1' : '0'} onChange={(e) => setEditingQuestionType(prev => prev ? { ...prev, has_options: e.target.value === '1' } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="1">Ya</option><option value="0">Tidak</option></select></div>
          <div><label className="font-bold text-outline mb-1 block">Validation Config (JSON)</label><textarea rows={4} placeholder='{"maxLength": 500}' value={editingQuestionType?.validation_config || '{}'} onChange={(e) => setEditingQuestionType(prev => prev ? { ...prev, validation_config: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono bg-surface-container-low resize-none" /></div>
        </div>
      </Drawer>

      {/* INDUSTRY DRAWER */}
      <Drawer
        isOpen={industryDrawerOpen}
        onClose={() => setIndustryDrawerOpen(false)}
        title="Tambah Industri"
        subtitle="Doc 021 §3 - Master Industri"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIndustryDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingIndustry?.name) { onShowNotification('Nama industri wajib diisi.', 'error'); return; }
              const added: Industry = { id: `IND-${String(industries.length + 1).padStart(2, '0')}`, name: editingIndustry.name, code: editingIndustry.code || editingIndustry.name.slice(0, 5).toUpperCase(), is_active: true };
              addData('industries', added);
              onShowNotification(`Industri ${added.name} ditambahkan.`, 'success');
              setIndustryDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama Industri *</label><input type="text" placeholder="Nama" value={editingIndustry?.name || ''} onChange={(e) => setEditingIndustry(prev => ({ ...prev!, name: e.target.value, id: prev?.id || '', code: prev?.code || '', is_active: prev?.is_active ?? true }))} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="KODE" value={editingIndustry?.code || ''} onChange={(e) => setEditingIndustry(prev => ({ ...prev!, code: e.target.value, id: prev?.id || '', name: prev?.name || '', is_active: prev?.is_active ?? true }))} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
        </div>
      </Drawer>

      {/* CATEGORY DRAWER */}
      <Drawer
        isOpen={categoryDrawerOpen}
        onClose={() => setCategoryDrawerOpen(false)}
        title="Tambah Kategori Proyek"
        subtitle="Doc 021 §2 - Kategori Proyek"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCategoryDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingCategory?.name) { onShowNotification('Nama kategori wajib diisi.', 'error'); return; }
              const added: ProjectCategory = { id: `CAT-${String(categories.length + 1).padStart(2, '0')}`, name: editingCategory.name, code: editingCategory.code || editingCategory.name.slice(0, 8).toUpperCase(), description: '', requires_lphs: editingCategory.requires_lphs ?? true, requires_rks: editingCategory.requires_rks ?? true, default_workflow_type: editingCategory.default_workflow_type || 'tender', color_hex: editingCategory.color_hex || '#6B7280', sort_order: categories.length + 1, is_active: true };
              addData('categories', added);
              onShowNotification(`Kategori ${added.name} ditambahkan.`, 'success');
              setCategoryDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama *</label><input type="text" placeholder="Nama kategori" value={editingCategory?.name || ''} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="KODE" value={editingCategory?.code || ''} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Wajib LPHS</label><select value={editingCategory?.requires_lphs ? '1' : '0'} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, requires_lphs: e.target.value === '1' } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="1">Ya</option><option value="0">Tidak</option></select></div>
            <div><label className="font-bold text-outline mb-1 block">Wajib RKS</label><select value={editingCategory?.requires_rks ? '1' : '0'} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, requires_rks: e.target.value === '1' } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="1">Ya</option><option value="0">Tidak</option></select></div>
          </div>
          <div><label className="font-bold text-outline mb-1 block">Workflow Default</label><select value={editingCategory?.default_workflow_type || 'tender'} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, default_workflow_type: e.target.value as any } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="tender">Tender</option><option value="prospecting">Prospecting</option></select></div>
          <div><label className="font-bold text-outline mb-1 block">Warna (Hex)</label><input type="text" placeholder="#RRGGBB" value={editingCategory?.color_hex || '#6B7280'} onChange={(e) => setEditingCategory(prev => prev ? { ...prev, color_hex: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
        </div>
      </Drawer>

      {/* STATUS DRAWER */}
      <Drawer
        isOpen={statusDrawerOpen}
        onClose={() => setStatusDrawerOpen(false)}
        title={editingStatus ? 'Edit Status Proyek' : 'Tambah Status Proyek'}
        subtitle="Doc 022 §1 - Status Proyek"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setStatusDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingStatus?.code || !editingStatus?.label) { onShowNotification('Kode dan label wajib diisi.', 'error'); return; }
              const maxSort = Math.max(...projectStatuses.map(s => s.sort_order), 0);
              const added: ProjectStatus = { id: `PS-${String(projectStatuses.length + 1).padStart(2, '0')}`, code: editingStatus.code, label: editingStatus.label, description: '', color_hex: editingStatus.color_hex || '#6B7280', text_color_hex: editingStatus.text_color_hex || '#FFFFFF', sort_order: maxSort + 1, is_system: false, is_terminal: false, is_active: true, applicable_to: editingStatus.applicable_to || 'both' };
              addData('projectStatuses', added);
              onShowNotification(`Status ${added.label} ditambahkan.`, 'success');
              setStatusDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Kode *</label><input type="text" placeholder="snake_case" value={editingStatus?.code || ''} onChange={(e) => setEditingStatus(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div><label className="font-bold text-outline mb-1 block">Label *</label><input type="text" placeholder="Nama tampilan" value={editingStatus?.label || ''} onChange={(e) => setEditingStatus(prev => prev ? { ...prev, label: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Warna Badge</label><input type="text" placeholder="#RRGGBB" value={editingStatus?.color_hex || '#6B7280'} onChange={(e) => setEditingStatus(prev => prev ? { ...prev, color_hex: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
            <div><label className="font-bold text-outline mb-1 block">Warna Teks</label><input type="text" placeholder="#FFFFFF" value={editingStatus?.text_color_hex || '#FFFFFF'} onChange={(e) => setEditingStatus(prev => prev ? { ...prev, text_color_hex: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          </div>
          <div><label className="font-bold text-outline mb-1 block">Berlaku Untuk</label><select value={editingStatus?.applicable_to || 'both'} onChange={(e) => setEditingStatus(prev => prev ? { ...prev, applicable_to: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="both">Keduanya</option><option value="tender">Tender</option><option value="prospecting">Prospecting</option></select></div>
        </div>
      </Drawer>

      {/* DOC TYPE DRAWER */}
      <Drawer
        isOpen={docTypeDrawerOpen}
        onClose={() => setDocTypeDrawerOpen(false)}
        title="Tambah Tipe Dokumen"
        subtitle="Doc 022 §2 - Tipe Dokumen"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDocTypeDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingDocType?.name || !editingDocType?.code) { onShowNotification('Nama dan kode wajib diisi.', 'error'); return; }
              const added: DocumentType = { id: `DT-${String(documentTypes.length + 1).padStart(2, '0')}`, name: editingDocType.name, code: editingDocType.code, description: '', allowed_extensions: editingDocType.allowed_extensions || ['pdf'], max_size_mb: editingDocType.max_size_mb || 25, is_required_at_stage: null, applicable_to: editingDocType.applicable_to || 'both', sort_order: documentTypes.length + 1, is_system: false, is_active: true };
              addData('documentTypes', added);
              onShowNotification(`Tipe dokumen ${added.name} ditambahkan.`, 'success');
              setDocTypeDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama *</label><input type="text" placeholder="Nama tipe dokumen" value={editingDocType?.name || ''} onChange={(e) => setEditingDocType(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode *</label><input type="text" placeholder="KODE" value={editingDocType?.code || ''} onChange={(e) => setEditingDocType(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div><label className="font-bold text-outline mb-1 block">Ekstensi (pisahkan koma)</label><input type="text" placeholder="pdf, docx, xlsx" value={editingDocType?.allowed_extensions?.join(', ') || 'pdf'} onChange={(e) => setEditingDocType(prev => prev ? { ...prev, allowed_extensions: e.target.value.split(',').map(s => s.trim()) } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Max Size (MB)</label><input type="number" placeholder="25" value={editingDocType?.max_size_mb || 25} onChange={(e) => setEditingDocType(prev => prev ? { ...prev, max_size_mb: parseInt(e.target.value) || 25 } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Berlaku Untuk</label><select value={editingDocType?.applicable_to || 'both'} onChange={(e) => setEditingDocType(prev => prev ? { ...prev, applicable_to: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="both">Keduanya</option><option value="tender">Tender</option><option value="prospecting">Prospecting</option></select></div>
        </div>
      </Drawer>

      {/* PERIOD DRAWER */}
      <Drawer
        isOpen={periodDrawerOpen}
        onClose={() => setPeriodDrawerOpen(false)}
        title="Tambah Periode"
        subtitle="Doc 025 §2 - Periode Pelaporan"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPeriodDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingPeriod?.name) { onShowNotification('Nama periode wajib diisi.', 'error'); return; }
              const added: ReportingPeriod = { id: `PER-${String(periods.length + 1).padStart(2, '0')}`, name: editingPeriod.name, code: editingPeriod.code || `${editingPeriod.year || 2026}-${(editingPeriod.type || 'quarterly').slice(0, 2).toUpperCase()}`, type: editingPeriod.type || 'quarterly', year: editingPeriod.year || 2026, start_date: editingPeriod.start_date || `${editingPeriod.year || 2026}-01-01`, end_date: editingPeriod.end_date || `${editingPeriod.year || 2026}-12-31`, is_active: true, is_locked: false, notes: '' };
              addData('periods', added);
              onShowNotification(`Periode ${added.name} ditambahkan.`, 'success');
              setPeriodDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama *</label><input type="text" placeholder="Q1 2026" value={editingPeriod?.name || ''} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="2026-Q1" value={editingPeriod?.code || ''} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Tipe</label><select value={editingPeriod?.type || 'quarterly'} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, type: e.target.value as any } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="monthly">Bulanan</option><option value="quarterly">Kuartalan</option><option value="semester">Semester</option><option value="annual">Tahunan</option></select></div>
            <div><label className="font-bold text-outline mb-1 block">Tahun</label><input type="number" placeholder="2026" value={editingPeriod?.year || 2026} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, year: parseInt(e.target.value) || 2026 } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="font-bold text-outline mb-1 block">Tanggal Mulai</label><input type="date" value={editingPeriod?.start_date || ''} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, start_date: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
            <div><label className="font-bold text-outline mb-1 block">Tanggal Selesai</label><input type="date" value={editingPeriod?.end_date || ''} onChange={(e) => setEditingPeriod(prev => prev ? { ...prev, end_date: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          </div>
        </div>
      </Drawer>

      {/* HOLIDAY DRAWER */}
      <Drawer
        isOpen={holidayDrawerOpen}
        onClose={() => setHolidayDrawerOpen(false)}
        title="Tambah Hari Libur"
        subtitle="Doc 025 §3 - Hari Libur Nasional"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setHolidayDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingHoliday?.name || !editingHoliday?.date) { onShowNotification('Nama dan tanggal wajib diisi.', 'error'); return; }
              const year = parseInt(editingHoliday.date.slice(0, 4));
              const added: PublicHoliday = { id: `HOL-${String(holidays.length + 1).padStart(2, '0')}`, name: editingHoliday.name, date: editingHoliday.date, type: editingHoliday.type || 'national', year, is_active: true };
              addData('holidays', added);
              onShowNotification(`Hari libur ${added.name} ditambahkan.`, 'success');
              setHolidayDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama Hari Libur *</label><input type="text" placeholder="Nama libur" value={editingHoliday?.name || ''} onChange={(e) => setEditingHoliday(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Tanggal *</label><input type="date" value={editingHoliday?.date || ''} onChange={(e) => setEditingHoliday(prev => prev ? { ...prev, date: e.target.value, year: parseInt(e.target.value.slice(0, 4)) } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Tipe</label><select value={editingHoliday?.type || 'national'} onChange={(e) => setEditingHoliday(prev => prev ? { ...prev, type: e.target.value as any } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="national">Nasional</option><option value="company_specific">Spesifik Perusahaan</option><option value="optional">Opsional</option></select></div>
        </div>
      </Drawer>

      {/* LOSS REASON DRAWER */}
      <Drawer
        isOpen={lossReasonDrawerOpen}
        onClose={() => setLossReasonDrawerOpen(false)}
        title="Tambah Alasan Kekalahan"
        subtitle="Doc 026 §1 - Alasan Kekalahan"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setLossReasonDrawerOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!editingLossReason?.name) { onShowNotification('Nama alasan wajib diisi.', 'error'); return; }
              const maxSort = Math.max(...lossReasons.map(l => l.sort_order), 0);
              const added: LossReason = { id: `LR-${String(lossReasons.length + 1).padStart(2, '0')}`, name: editingLossReason.name, code: editingLossReason.code || editingLossReason.name.slice(0, 8).toUpperCase().replace(/\s/g, '_'), category: editingLossReason.category || 'lainnya', description: editingLossReason.description || '', sort_order: maxSort + 1, is_active: true };
              addData('lossReasons', added);
              onShowNotification(`Alasan kekalahan ${added.name} ditambahkan.`, 'success');
              setLossReasonDrawerOpen(false);
            }}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div><label className="font-bold text-outline mb-1 block">Nama *</label><input type="text" placeholder="Nama alasan" value={editingLossReason?.name || ''} onChange={(e) => setEditingLossReason(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kode</label><input type="text" placeholder="KODE" value={editingLossReason?.code || ''} onChange={(e) => setEditingLossReason(prev => prev ? { ...prev, code: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs font-mono" /></div>
          <div><label className="font-bold text-outline mb-1 block">Kategori</label><select value={editingLossReason?.category || 'harga'} onChange={(e) => setEditingLossReason(prev => prev ? { ...prev, category: e.target.value as any } : null)} className="w-full p-2 border border-border rounded-lg text-xs bg-white"><option value="harga">Harga</option><option value="teknis">Teknis</option><option value="relasi">Relasi</option><option value="administrasi">Administrasi</option><option value="waktu">Waktu</option><option value="lainnya">Lainnya</option></select></div>
          <div><label className="font-bold text-outline mb-1 block">Deskripsi</label><textarea rows={3} placeholder="Deskripsi" value={editingLossReason?.description || ''} onChange={(e) => setEditingLossReason(prev => prev ? { ...prev, description: e.target.value } : null)} className="w-full p-2 border border-border rounded-lg text-xs resize-none" /></div>
        </div>
      </Drawer>

    </div>
  );
}
