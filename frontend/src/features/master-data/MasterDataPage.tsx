import React, { useState } from 'react';

interface MasterDataViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

// 1. Types for high-density mock datasets
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

interface QuestionType {
  name: string;
  config: string;
  questionsCount: number;
  active: boolean;
  icon: string;
  desc: string;
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

interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'Swasta' | 'BUMN' | 'Pemerintah';
  pic: string;
  email: string;
  status: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  division: string;
  status: boolean;
}

interface Competitor {
  id: string;
  code: string;
  name: string;
  initials: string;
  segment: string;
  usage: string;
  status: 'Aktif' | 'Review' | 'Non-Aktif';
}

interface MasterQuestion {
  id: string;
  title: string;
  group: string;
  type: 'Short Text' | 'Radio Button' | 'File Upload' | 'Currency';
  icon: string;
  required: boolean;
  status: 'Aktif' | 'Draft';
  help: string;
  placeholder?: string;
  maxLen?: number;
  options?: string[];
}

// 2. Initial Datasets (Unifying multiple operations)
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-77291102',
    time: '2026-06-18 14:32:01',
    user: 'Admin User',
    userInitials: 'AS',
    action: 'UPDATE',
    actionColor: 'bg-status-indigo/10 text-status-indigo',
    entity: 'PRJ-4022',
    entityName: 'Infrastructure Dev',
    impact: 'Medium',
    beforeJson: `{\n  "id": "PRJ-4022",\n  "status": "PENDING_REVIEW",\n  "budget_cap": 250000.00,\n  "last_modified_by": "PB_INTERNAL"\n}`,
    afterJson: `{\n  "id": "PRJ-4022",\n  "status": "ACTIVE_OPERATIONAL",\n  "budget_cap": 375000.00,\n  "last_modified_by": "PB_INTERNAL",\n  "revision": 14\n}`
  },
  {
    id: 'AUD-77291103',
    time: '2026-06-18 14:15:22',
    user: 'Pam Beesly',
    userInitials: 'PB',
    action: 'APPROVE',
    actionColor: 'bg-success/10 text-success',
    entity: 'INV-20993',
    entityName: 'Invoice Unit 2',
    impact: 'Low',
    beforeJson: `{\n  "invoice_id": "INV-20993",\n  "approved": false\n}`,
    afterJson: `{\n  "invoice_id": "INV-20993",\n  "approved": true,\n  "approved_by": "Pam Beesly"\n}`
  },
  {
    id: 'AUD-77291104',
    time: '2026-06-18 13:58:10',
    user: 'Dwight Schrute',
    userInitials: 'DS',
    action: 'DELETE',
    actionColor: 'bg-danger/10 text-danger',
    entity: 'TMP_REPORT_01',
    entityName: 'Temporary Report',
    impact: 'High',
    beforeJson: `{\n  "report_name": "TMP_REPORT_01",\n  "owner": "Dwight Schrute"\n}`,
    afterJson: `null`
  },
  {
    id: 'AUD-77291105',
    time: '2026-06-18 13:42:45',
    user: 'Michael Scott',
    userInitials: 'MS',
    action: 'CREATE',
    actionColor: 'bg-status-teal/10 text-status-teal',
    entity: 'LEAD-8812',
    entityName: 'Prospect Lead X',
    impact: 'Low',
    beforeJson: `null`,
    afterJson: `{\n  "lead_id": "LEAD-8812",\n  "title": "Pondasi Region 3",\n  "created_by": "Michael Scott"\n}`
  }
];

const INITIAL_QUESTION_TYPES: QuestionType[] = [
  { name: 'Short Text', config: '{"max_length": 255, "required": true}', questionsCount: 42, active: true, icon: 'title', desc: 'Single line text input' },
  { name: 'Radio Button', config: '{"options": [], "orientation": "v"}', questionsCount: 28, active: true, icon: 'radio_button_checked', desc: 'Single selection list' },
  { name: 'File Upload', config: '{"allow": ["pdf", "jpg"], "size": "10MB"}', questionsCount: 15, active: true, icon: 'upload_file', desc: 'Secure document intake' },
  { name: 'Multi Select', config: '{"min_sel": 1, "max_sel": "none"}', questionsCount: 33, active: true, icon: 'checklist', desc: 'Select multiple options' },
  { name: 'Date Picker', config: '{"format": "YYYY-MM-DD"}', questionsCount: 0, active: false, icon: 'calendar_today', desc: 'Standard date selection' }
];

const INITIAL_USERS: MasterUser[] = [
  { id: '1', name: 'Ahmad Sulistyo', branch: 'Cabang Jakarta Pusat', username: 'asulistyo_jkp', email: 'ahmad.s@kinetic.co.id', role: 'Cabang', roleColor: 'bg-secondary-container text-on-secondary-container', active: true, avatarColor: 'bg-primary/10 text-primary' },
  { id: '2', name: 'Bambang Permadi', branch: 'Project Management', username: 'bambang.pm', email: 'b.permadi@kinetic.co.id', role: 'PM', roleColor: 'bg-primary-container text-on-primary-container', active: true, avatarColor: 'bg-status-purple/10 text-status-purple' },
  { id: '3', name: 'Rina Marlina', branch: 'Operations Dept', username: 'rina.ops', email: 'rina.marlina@kinetic.co.id', role: 'Dept', roleColor: 'bg-secondary-fixed text-on-secondary-fixed-variant', active: false, avatarColor: 'bg-status-orange/10 text-status-orange' },
  { id: '4', name: 'Doni Wahyudi', branch: 'Head Office', username: 'doni.admin', email: 'doni.w@kinetic.co.id', role: 'Admin', roleColor: 'bg-status-maroon/10 text-status-maroon', active: true, avatarColor: 'bg-status-maroon/10 text-status-maroon' }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'PT Astra International Tbk', code: 'CST-AS-001', type: 'Swasta', pic: 'Budi Santoso', email: 'budi.s@astra.co.id', status: true },
  { id: '2', name: 'Bank Rakyat Indonesia', code: 'CST-BR-002', type: 'BUMN', pic: 'Siti Aminah', email: 'siti.a@bri.co.id', status: true },
  { id: '3', name: 'Dinas Kesehatan Prov DKI', code: 'CST-DK-003', type: 'Pemerintah', pic: 'Herry Setiawan', email: 'herry@dinkes.jakarta.go.id', status: false }
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: '01', name: 'IT Infrastructure', code: 'DEPT-INF-01', head: 'Budi Santoso', division: 'Technology', status: true },
  { id: '02', name: 'Financial Audit', code: 'DEPT-FIN-02', head: 'Siti Aminah', division: 'Finance & Ops', status: true },
  { id: '03', name: 'Brand Expansion', code: 'DEPT-MKT-03', head: 'Rizky Pratama', division: 'Marketing', status: false }
];

const INITIAL_COMPETITORS: Competitor[] = [
  { id: '1', code: 'COMP-001', name: 'Astra Modern Ltd.', initials: 'AM', segment: 'Retail & Logistik', usage: '24 Proyek', status: 'Aktif' },
  { id: '2', code: 'COMP-002', name: 'Global Enterprise Solutions', initials: 'GE', segment: 'Infrastructure', usage: '18 Proyek', status: 'Aktif' },
  { id: '3', code: 'COMP-003', name: 'Nippon Power Corp', initials: 'NP', segment: 'Energy & Utilities', usage: '09 Proyek', status: 'Review' },
  { id: '4', code: 'COMP-004', name: 'Tekno Konstruksi Indonesia', initials: 'TK', segment: 'Industrial', usage: '42 Proyek', status: 'Aktif' },
  { id: '5', code: 'COMP-005', name: 'Silverscape Ventures', initials: 'SV', segment: 'Banking & Finance', usage: '03 Proyek', status: 'Non-Aktif' }
];

const INITIAL_QUESTIONS: MasterQuestion[] = [
  { id: 'PR-001', title: 'Nama Lengkap Sesuai KTP', group: 'Data Pribadi', type: 'Short Text', icon: 'text_fields', required: true, status: 'Aktif', help: 'Masukkan nama lengkap sesuai identitas resmi yang masih berlaku.', placeholder: 'Contoh: Ahmad Subarjo', maxLen: 100 },
  { id: 'PR-002', title: 'Domisili Sesuai Domisili Usaha?', group: 'Lokasi', type: 'Radio Button', icon: 'radio_button_checked', required: true, status: 'Aktif', help: 'Pilih Ya jika alamat rumah sama dengan lokasi operasional bisnis.', options: ['Ya, Sama', 'Tidak, Berbeda'] },
  { id: 'PR-003', title: 'Unggah Foto Tempat Usaha', group: 'Verifikasi Fisik', type: 'File Upload', icon: 'upload_file', required: true, status: 'Draft', help: 'Pastikan papan nama atau tampak depan bangunan terlihat jelas.' },
  { id: 'PR-004', title: 'Estimasi Omzet Bulanan', group: 'Keuangan', type: 'Currency', icon: 'payments', required: false, status: 'Aktif', help: 'Rata-rata pendapatan kotor dalam satu bulan operasional.', placeholder: 'Rp 0' }
];

type SuperTab = 'questions' | 'types' | 'customers' | 'departments' | 'competitors' | 'users' | 'audit_logs';

export default function MasterDataView({ onShowNotification }: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<SuperTab>('questions');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. QUESTION MASTER STATES (MAST-03 Dynamic Editor)
  const [questions, setQuestions] = useState<MasterQuestion[]>(INITIAL_QUESTIONS);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('PR-001');
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<'prospek' | 'rks'>('prospek');
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

  // 2. QUESTION TYPES STATES (CONF-07)
  const [types, setTypes] = useState<QuestionType[]>(INITIAL_QUESTION_TYPES);
  const [editingType, setEditingType] = useState<QuestionType | null>(null);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);

  // 3. MASTER CUSTOMER STATES
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustType, setNewCustType] = useState<'Swasta' | 'BUMN' | 'Pemerintah'>('Swasta');
  const [newCustPic, setNewCustPic] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // 4. MASTER DEPARTEMEN STATES
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false);

  // 5. MASTER KOMPETITOR STATES (GAP-09)
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [compDrawerOpen, setCompDrawerOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompSegment, setNewCompSegment] = useState('Retail');
  const [newCompNotes, setNewCompNotes] = useState('');

  // 6. USER MANAGEMENT STATES (MAST-05 Scoping)
  const [users, setUsers] = useState<MasterUser[]>(INITIAL_USERS);
  const [editingUser, setEditingUser] = useState<MasterUser | null>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  // 7. SYSTEM AUDIT LOG STATES
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);

  // General tab switcher styling helper
  const tabClass = (tab: SuperTab) =>
    `flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
      activeTab === tab
        ? 'border-primary text-primary bg-primary/5'
        : 'border-transparent text-secondary hover:text-primary hover:bg-slate-55'
    }`;

  // Helper inside Question Editor Live Preview Rendering
  const renderPreviewInput = (q: MasterQuestion) => {
    switch (q.type) {
      case 'Short Text':
        return (
          <input
            type="text"
            disabled
            placeholder={q.placeholder || 'Contoh masukan teks...'}
            className="w-full bg-slate-50 border border-border rounded-lg p-2 text-xs focus:outline-none cursor-not-allowed"
          />
        );
      case 'Radio Button':
        return (
          <div className="space-y-1.5 mt-2">
            {(q.options || ['Opsi 1', 'Opsi 2']).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-slate-50 text-xs">
                <input type="radio" checked={i === 0} disabled className="text-primary focus:ring-0" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'File Upload':
        return (
          <div className="border border-dashed border-primary/30 rounded-xl p-4 text-center bg-slate-50 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">cloud_upload</span>
            <p className="text-[10px] font-bold text-slate-700">Pilih Berkas Komputer</p>
            <p className="text-[8px] text-slate-400">PDF, JPG (Maks 10MB)</p>
          </div>
        );
      case 'Currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">Rp</span>
            <input
              type="text"
              disabled
              placeholder="0"
              className="w-full pl-8 bg-slate-50 border border-border rounded-lg p-2 text-xs cursor-not-allowed font-mono"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-slate-800">
      
      {/* 1. GAP-03 Banner compliance notification */}
      <div className="bg-primary/5 border-b border-primary/20 p-3 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-base">verified_user</span>
          <p className="text-[11px] font-medium text-slate-600">
            <span className="font-bold text-primary">GAP-03 & Security Bound:</span> Seluruh pilar konfigurasi disinkronisasikan ke master database terpusat untuk integritas regional.
          </p>
        </div>
        <span className="text-[9px] uppercase font-mono tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Database Synced</span>
      </div>

      {/* 2. Top Header and Super Tabs list */}
      <div className="bg-white border-b border-border shrink-0 px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-slate-800">Workspace Master Data</h2>
          <p className="text-slate-400 text-[11px]">Konsol operasi pusat untuk memelihara normalisasi, kuesioner, kompetitor, dan hak departemen regional.</p>
        </div>
        
        {/* Search Query Filter input */}
        <div className="relative w-64 size-sm shrink-0">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            type="text"
            placeholder="Cari records master..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-full border-none focus:ring-1 focus:ring-primary text-xs"
          />
        </div>
      </div>

      {/* Under-header Navigation Bar Tabs (Single Master Data parent container inside sidebar) */}
      <div className="bg-white px-8 flex overflow-x-auto border-b border-border shrink-0 custom-scrollbar scrollbar-hide">
        <button onClick={() => { setActiveTab('questions'); setSearchQuery(''); }} className={tabClass('questions')}>
          <span className="material-symbols-outlined text-sm">list_alt</span> Form Editor (MAST-03)
        </button>
        <button onClick={() => { setActiveTab('types'); setSearchQuery(''); }} className={tabClass('types')}>
          <span className="material-symbols-outlined text-sm">rule</span> Tipe Respon (CONF-07)
        </button>
        <button onClick={() => { setActiveTab('customers'); setSearchQuery(''); }} className={tabClass('customers')}>
          <span className="material-symbols-outlined text-sm">groups</span> Master Customer
        </button>
        <button onClick={() => { setActiveTab('competitors'); setSearchQuery(''); }} className={tabClass('competitors')}>
          <span className="material-symbols-outlined text-sm">factory</span> Kompetitor (GAP-09)
        </button>
        <button onClick={() => { setActiveTab('departments'); setSearchQuery(''); }} className={tabClass('departments')}>
          <span className="material-symbols-outlined text-sm">domain</span> Departemen
        </button>
        <button onClick={() => { setActiveTab('users'); setSearchQuery(''); }} className={tabClass('users')}>
          <span className="material-symbols-outlined text-sm">manage_accounts</span> Hak Pengguna (MAST-05)
        </button>
        <button onClick={() => { setActiveTab('audit_logs'); setSearchQuery(''); }} className={tabClass('audit_logs')}>
          <span className="material-symbols-outlined text-sm">security</span> Audit Log
        </button>
      </div>

      {/* 3. SCROLLABLE INNER PANEL SECTION */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">

        {/* ==================== TAB 1: MASTER PERTANYAAN (MAST-03) ==================== */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">edit_note</span>
                  Form Dynamic Editor (MAST-03)
                </h3>
                <p className="text-secondary text-xs mt-0.5">Definisikan dan atur urutan pertanyaan kuesioner operasional secara dinamis untuk dikirimkan ke regional field.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onShowNotification('Ekspor skema kuesioner JSON berhasil.', 'success')}
                  className="px-3.5 py-1.5 bg-slate-150 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span> Export JSON
                </button>
                <button
                  onClick={() => {
                    setQuestionDrawerOpen(true);
                  }}
                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Tambah Pertanyaan
                </button>
              </div>
            </div>

            {/* Sub Tabs Group selection */}
            <div className="flex border-b border-border mb-2.5">
              <button
                onClick={() => setActiveGroupTab('prospek')}
                className={`px-5 py-2 text-xs font-bold ${
                  activeGroupTab === 'prospek' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'
                }`}
              >
                Pertanyaan Prospek ({questions.filter(q => q.group !== 'RKS').length})
              </button>
              <button
                onClick={() => {
                  setActiveGroupTab('rks');
                  onShowNotification('Skema kuesioner rujukan RKS dimuat.', 'success');
                }}
                className={`px-5 py-2 text-xs font-bold ${
                  activeGroupTab === 'rks' ? 'border-b-2 border-primary text-primary' : 'text-slate-400'
                }`}
              >
                Pertanyaan RKS ({questions.filter(q => q.group === 'RKS').length})
              </button>
            </div>

            {/* Split layout: Table vs Live Mobile Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Question Table List */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto text-left">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border">
                        <th className="p-3 w-8 text-center">Urutan</th>
                        <th className="p-3">Pertanyaan</th>
                        <th className="p-3">Tipe Respon</th>
                        <th className="p-3 text-center">Wajib</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {questions
                        .filter(q => {
                          if (searchQuery) {
                            return q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.group.toLowerCase().includes(searchQuery.toLowerCase());
                          }
                          return activeGroupTab === 'rks' ? q.group === 'RKS' : q.group !== 'RKS';
                        })
                        .map((q, idx) => (
                          <tr
                            key={q.id}
                            onClick={() => setSelectedQuestionId(q.id)}
                            className={`hover:bg-slate-50 cursor-pointer ${
                              selectedQuestionId === q.id ? 'bg-primary/5 font-medium' : ''
                            }`}
                          >
                            <td className="p-3 text-center text-slate-400">
                              <span className="material-symbols-outlined text-[16px] cursor-grab">drag_indicator</span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{q.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">ID: {q.id} • Grup: {q.group}</div>
                            </td>
                            <td className="p-3">
                              <span className="flex items-center gap-1.5 font-mono text-slate-600 text-[11px]">
                                <span className="material-symbols-outlined text-[14px]">{q.icon}</span> {q.type}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setQuestions(questions.map(x => x.id === q.id ? { ...x, required: e.target.checked } : x));
                                  onShowNotification(`Wajib diisi diubah untuk ${q.title}`, 'success');
                                }}
                                className="rounded text-primary focus:ring-0 cursor-pointer shrink-0"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.status === 'Aktif' ? 'bg-success/15 text-success' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => {
                                    setQuestions(questions.filter(x => x.id !== q.id));
                                    onShowNotification('Pertanyaan dinonaktifkan.', 'success');
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-650"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-border bg-slate-50 text-[10px] text-slate-400 italic">
                  Urutan dapat dirubah dengan menyeret handle drag paling kiri.
                </div>
              </div>

              {/* Right Column: Live Mobile device preview panel */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                <div className="bg-primary/5 border border-primary/25 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">visibility</span>
                    <h4 className="text-xs font-bold text-slate-700">Live Device Inspector</h4>
                  </div>
                  <span className="text-[10px] bg-white text-primary border border-primary/30 px-2 py-0.5 rounded-full font-mono font-semibold">Active: {selectedQuestion.id}</span>
                </div>

                {/* Device Frame layout and viewport simulation */}
                <div className="bg-slate-900 rounded-[2rem] border-8 border-slate-950 p-4 shadow-xl max-w-sm mx-auto w-full flex flex-col relative overflow-hidden">
                  
                  {/* Top camera slot mockup */}
                  <div className="absolute top-2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20"></div>

                  {/* Context simulated screen viewport */}
                  <div className="bg-white rounded-[1rem] overflow-hidden flex flex-col h-96 text-left relative">
                    <div className="bg-primary p-3 text-white flex items-center justify-between px-4">
                      <span className="material-symbols-outlined text-xs">arrow_back</span>
                      <span className="text-xs font-bold font-heading-section">Form Kuesioner Survey</span>
                      <span className="material-symbols-outlined text-xs">help_outline</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 border-l-4 border-primary">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Previewing Input</span>
                        <h4 className="text-xs font-bold text-slate-700">{selectedQuestion.title} {selectedQuestion.required && <span className="text-red-500">*</span>}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{selectedQuestion.help}</p>
                      </div>

                      {/* Display live reactive input form based on active selection */}
                      <div className="space-y-3">
                        {renderPreviewInput(selectedQuestion)}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 border-t border-border flex justify-between gap-2 px-4 shrink-0">
                      <button className="px-3 py-1 bg-white border border-border text-[10px] rounded hover:bg-slate-100 font-semibold text-slate-600 transition-colors">Simpan Draf</button>
                      <button className="px-3 py-1 bg-primary text-white text-[10px] rounded hover:brightness-110 font-bold transition-all">Lanjutkan</button>
                    </div>
                  </div>
                </div>

                {/* Quick Editor Configuration settings panel below viewport */}
                <div className="bg-white p-5 border border-border rounded-xl shadow-sm text-left">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">settings_suggest</span>
                    Config Option Tuning
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Pertanyaan Label</label>
                      <input
                        type="text"
                        value={selectedQuestion.title}
                        onChange={(e) => {
                          setQuestions(questions.map(q => q.id === selectedQuestion.id ? { ...q, title: e.target.value } : q));
                        }}
                        className="w-full p-2 border border-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Help Text Rujukan</label>
                      <textarea
                        rows={2}
                        value={selectedQuestion.help}
                        onChange={(e) => {
                          setQuestions(questions.map(q => q.id === selectedQuestion.id ? { ...q, help: e.target.value } : q));
                        }}
                        className="w-full p-2 border border-border rounded-lg text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 2: TIPE PERTANYAAN (CONF-07) ==================== */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-4 text-left items-start">
              <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
              <div>
                <p className="text-primary text-xs font-bold mb-0.5">Definisi Skema Respon (CONF-07)</p>
                <p className="text-slate-500 text-xs">Atur tipe masukan, parameter JSON penampung, regulasi ukuran berkas, serta skema validasi yang didaftarkan ke core backend kuesioner.</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                <span className="material-symbols-outlined mr-1.5 text-primary font-bold">rule</span>
                Konfigurasi Tipe Pertanyaan
              </h3>
              <button
                onClick={() => {
                  onShowNotification('Skema tipe respon baru ditambahkan ke draft.', 'success');
                }}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span> Tambah Tipe
              </button>
            </div>

            {/* Bento Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">list_alt</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total Tipe</p>
                  <p className="text-sm font-extrabold text-slate-700">12 Tipe</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-success">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Tipe Aktif</p>
                  <p className="text-sm font-extrabold text-slate-700">10 Aktif</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">help_outline</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total Pertanyaan</p>
                  <p className="text-sm font-extrabold text-slate-700">142 Items</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-xl">update</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Perubahan Terakhir</p>
                  <p className="text-sm font-extrabold text-slate-700">2 Jam Lalu</p>
                </div>
              </div>
            </div>

            {/* Question Types table */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="p-4">Nama Tipe</th>
                    <th className="p-4">Konfigurasi Default (JSON)</th>
                    <th className="p-4 text-center">Digunakan Oleh</th>
                    <th className="p-4 text-center">Status Aktif</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types
                    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-base">{t.icon}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{t.name}</p>
                              <p className="text-[10px] text-slate-400">{t.desc}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="font-mono text-[11px] bg-slate-50 border border-border p-1 rounded block max-w-xs truncate text-indigo-650 font-semibold">
                            {t.config}
                          </code>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            {t.questionsCount} Pertanyaan
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setTypes(types.map(x => x.name === t.name ? { ...x, active: !x.active } : x));
                              onShowNotification(`Tipe ${t.name} berhasil diperbarui statusnya.`, 'success');
                            }}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors border ${
                              t.active ? 'bg-success border-success' : 'bg-slate-350 border-slate-300'
                            }`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ${
                              t.active ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setEditingType(t);
                                setTypeDrawerOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-primary cursor-pointer"
                              title="Edit Tipe"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: MASTER CUSTOMER ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">groups</span>
                  Database Master Customer
                </h3>
                <p className="text-secondary text-xs mt-0.5">Kelola data korespondensi rekanan, subkontrak BUMN, swasta regional, dan instansi daerah secara tersistem.</p>
              </div>
              <button
                onClick={() => {
                  setNewCustName('');
                  setNewCustCode(`CST-XX-${Math.floor(100 + Math.random() * 900)}`);
                  setNewCustPic('');
                  setNewCustEmail('');
                  setCustomerModalOpen(true);
                }}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Tambah Customer
              </button>
            </div>

            {/* Layout with data tables of registered customers */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Nama Customer</th>
                    <th className="p-4">Kode Rujukan</th>
                    <th className="p-4">Jenis</th>
                    <th className="p-4">PIC Kontak Rekanan</th>
                    <th className="p-4 text-center">Status Keaktifan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50 group">
                        <td className="p-4 text-center font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center font-black rounded text-[10px]">
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-500">{c.code}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.type === 'BUMN'
                              ? 'bg-status-indigo/15 text-status-indigo'
                              : c.type === 'Pemerintah'
                              ? 'bg-status-orange/15 text-status-orange'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-700">{c.pic}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{c.email}</div>
                        </td>
                        <td className="p-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.status}
                              onChange={(e) => {
                                setCustomers(customers.map(x => x.id === c.id ? { ...x, status: e.target.checked } : x));
                                onShowNotification(`Status keaktifan customer ${c.name} diubah.`, 'success');
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                            <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase peer-checked:text-success">
                              {c.status ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </label>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setCustomers(customers.filter(x => x.id !== c.id));
                              onShowNotification('Customer berhasil dihapus dari master.', 'success');
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: DEPARTEMEN ==================== */}
        {activeTab === 'departments' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">domain</span>
                  Master Departemen Organisasi
                </h3>
                <p className="text-secondary text-xs mt-0.5 font-semibold">Tentukan departemen resmi sistem, koordinator kepala, serta wilayah afiliasi divisi penanggung jawab.</p>
              </div>
              <button
                onClick={() => {
                  onShowNotification('Pendaftaran departemen baru disimulasikan.', 'success');
                }}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Tambah Departemen
              </button>
            </div>

            {/* Organization department lists */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Nama Departemen</th>
                    <th className="p-4">Kode</th>
                    <th className="p-4">Kepala Urusan</th>
                    <th className="p-4">Divisi Utama</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments
                    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((d, idx) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-center font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="p-4 font-bold text-slate-800">{d.name}</td>
                        <td className="p-4"><span className="p-1 px-2 font-mono bg-slate-100 rounded text-slate-650 text-[11px] font-semibold">{d.code}</span></td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-status-indigo/20 text-status-indigo flex items-center justify-center text-[10px]">
                              <span className="material-symbols-outlined text-[12px]">person</span>
                            </div>
                            <span className="font-semibold text-slate-750">{d.head}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold">{d.division}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setDepartments(departments.map(x => x.id === d.id ? { ...x, status: !x.status } : x));
                              onShowNotification(`Status departemen ${d.name} dirubah.`, 'success');
                            }}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                              d.status ? 'bg-success' : 'bg-slate-350 bg-slate-300'
                            }`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ${
                              d.status ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingDepartment(d);
                                setDeptDrawerOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-primary cursor-pointer"
                              title="Tuning Departemen"
                            >
                              <span className="material-symbols-outlined text-base">edit_note</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Bento Insights bottom panel for Departemen */}
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 bg-white border border-border rounded-xl shadow-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-full text-base">groups</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Departemen</p>
                  <p className="text-lg font-extrabold text-slate-800">24 Internal</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-border rounded-xl shadow-sm flex items-center gap-3 animate-fade-in text-left">
                <span className="material-symbols-outlined text-success bg-green-50 p-2.5 rounded-full text-base">verified</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aktif Beroperasi</p>
                  <p className="text-lg font-extrabold text-slate-800">21 Aktif</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-border rounded-xl shadow-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary bg-slate-100 p-2.5 rounded-full text-base">cancel</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inaktif / Ditahan</p>
                  <p className="text-lg font-extrabold text-slate-800">03 Nonaktif</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: MASTER KOMPETITOR (GAP-09) ==================== */}
        {activeTab === 'competitors' && (
          <div className="space-y-6 text-left">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-4 text-left items-start">
              <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
              <div>
                <p className="text-primary text-xs font-bold mb-0.5">Standardized Lookup Integration (GAP-09)</p>
                <p className="text-slate-500 text-xs">Seluruh entitas kompetitor ini didefinisikan secara konstan untuk menghindari redudansi, dan menjadi referensi pencarian pada dynamic form penawaran / komparasi tender.</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">factory</span>
                  Data Master Kompetitor
                </h3>
                <p className="text-secondary text-xs mt-0.5">Lookup standarisasi regional dan data normalisasi kompetitor nasional.</p>
              </div>
              <button
                onClick={() => {
                  setNewCompName('');
                  setNewCompNotes('');
                  setCompDrawerOpen(true);
                }}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm animate-pulse-once"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Tambah Kompetitor
              </button>
            </div>

            {/* Table of competitors */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-700">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Kode</th>
                    <th className="p-4">Nama Kompetitor Resmi</th>
                    <th className="p-4">Skup Segmentasi</th>
                    <th className="p-4">Frekuensi Lookup</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {competitors
                    .filter(x => x.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((x, idx) => (
                      <tr key={x.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-center font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="p-4 font-mono font-bold text-primary">{x.code}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-slate-600 text-[11px] shrink-0 border border-border">
                              {x.initials}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800">{x.name}</p>
                              <p className="text-[10px] text-slate-400">Sektor Konstruksi regional</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded text-[10px] font-bold border border-border">
                            {x.segment}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-500">{x.usage}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            x.status === 'Aktif'
                              ? 'bg-success/10 text-success'
                              : x.status === 'Review'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-50 text-red-650 border border-red-200'
                          }`}>
                            {x.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==================== TAB 6: MANAJEMEN PENGGUNA (MAST-05) ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">manage_accounts</span>
                  User Management (MAST-05)
                </h3>
                <p className="text-secondary text-xs mt-0.5">Konfigurasi hak akses regional, pembatasan scoping cabang, dan enforcement multi-factor authentication (2FA).</p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserDrawerOpen(true);
                }}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span> Tambah Pengguna
              </button>
            </div>

            {/* List table profiles */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-in">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Username System</th>
                    <th className="p-4">Email Perusahaan</th>
                    <th className="p-4">Role Hak Akses</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users
                    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.avatarColor}`}>
                              {u.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-850">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{u.branch}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-500">{u.username}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.roleColor}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            u.active ? 'text-success' : 'text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-success' : 'bg-slate-400'}`} />
                            {u.active ? 'Aktif' : 'Inaktif'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setUserDrawerOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-primary cursor-pointer"
                              title="Edit Scoping User"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                onShowNotification(`Reset sandi instan terkirim ke email: ${u.email}`, 'success');
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600 cursor-pointer"
                              title="Reset Password"
                            >
                              <span className="material-symbols-outlined text-base">lock_reset</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==================== TAB 7: SYSTEM AUDIT LOG ==================== */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center bg-white p-5 border border-border rounded-xl shadow-sm">
              <div>
                <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined mr-1.5 text-primary">security_update_warning</span>
                  System Audit Trail & Log Keamanan
                </h3>
                <p className="text-secondary text-xs mt-0.5">Metadata operasional, perubahan status RKS komparatif, trace login administrator, dan trace data mutation.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onShowNotification('Ekspor CSV dari real-time audit log berhasil.', 'success')}
                  className="px-3.5 py-1.5 bg-white border border-border hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
                </button>
                <button
                  onClick={() => {
                    onShowNotification('Log audit terupdate secara synchronous.', 'success');
                  }}
                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span> Refresh Records
                </button>
              </div>
            </div>

            {/* Security Audit logs list table */}
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border font-bold">
                    <th className="p-4">Timestamp Log</th>
                    <th className="p-4">Pelaku Operator</th>
                    <th className="p-4">Tipe Mutasi</th>
                    <th className="p-4">Entitas Referensi</th>
                    <th className="p-4 text-center">Impact Risiko</th>
                    <th className="p-4 text-right">Periksa JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs
                    .filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.entity.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-mono font-medium text-slate-600">
                          <p>{log.time}</p>
                          <p className="text-[9px] text-slate-400">Local Standard Server Time</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black">{log.userInitials}</span>
                            <span className="font-bold text-slate-750">{log.user}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${log.actionColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800">{log.entity}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">({log.entityName})</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            log.impact === 'High' ? 'text-red-500' : log.impact === 'Medium' ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.impact === 'High' ? 'bg-red-500' : log.impact === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {log.impact} Access
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAuditLog(log);
                              setAuditDetailOpen(true);
                            }}
                            className="px-3 py-1 bg-white border border-border text-primary hover:bg-primary/5 rounded font-bold transition-all text-[10px] cursor-pointer"
                          >
                            Bandingkan Diff
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* =================== MODAL OVERLAYS AND INTERACTIVES ===================== */}
      {/* ========================================================================= */}

      {/* 1. AUDIT DETAIL COMPARATIVE JSON MODAL */}
      {auditDetailOpen && selectedAuditLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left font-body-main animate-fade-in">
            <div className="p-5 border-b border-border bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">manage_history</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-850">Laporan Json Perbedaan Mutasi Data</h4>
                  <p className="text-[10px] text-slate-400">ID log: {selectedAuditLog.id} • Operator: {selectedAuditLog.user}</p>
                </div>
              </div>
              <button
                onClick={() => setAuditDetailOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-2.5 rounded border border-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Status Sebelum Perubahan</span>
                  <pre className="font-mono text-[10px] text-red-650 bg-red-50/20 p-2 rounded mt-1.5 overflow-x-auto">
                    {selectedAuditLog.beforeJson}
                  </pre>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Status Sesudah Perubahan</span>
                  <pre className="font-mono text-[10px] text-success bg-green-50/20 p-2 rounded mt-1.5 overflow-x-auto">
                    {selectedAuditLog.afterJson}
                  </pre>
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-[10px] text-amber-700">
                <span className="font-bold block mb-0.5">Enforcement Audit Trail:</span> File backup mutasi disimpan dalam memory sandbox. Administrator diizinkan rollback dalam 24 jam.
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setAuditDetailOpen(false)}
                className="px-4 py-1.5 bg-white border border-border text-slate-650 rounded text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Tutup Dokumen
              </button>
              <button
                onClick={() => {
                  onShowNotification(`Rollback log ${selectedAuditLog.id} berhasil diajukan.`, 'success');
                  setAuditDetailOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 cursor-pointer"
              >
                Rollback Mutasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHOOSE CUSTOMER ADD MODAL OVERLAY */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-left animate-fade-in">
            <div className="p-5 border-b border-border bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">groups</span>
                <span className="text-xs font-bold text-slate-800">Daftarkan Customer Corporate Baru</span>
              </div>
              <button onClick={() => setCustomerModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 hover:bg-slate-200 text-xs">
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Nama Pelanggan / Entitas</label>
                <input
                  type="text"
                  placeholder="e.g. PT Example Corp"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 mb-1 block">Kode Unik</label>
                  <input
                    type="text"
                    value={newCustCode}
                    onChange={(e) => setNewCustCode(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 mb-1 block">Klasifikasi</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as any)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-white"
                  >
                    <option value="Swasta">Pelanggan Swasta</option>
                    <option value="BUMN">Badan Usaha (BUMN)</option>
                    <option value="Pemerintah">Instansi Pemerintah</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Nama PIC Penanggung Jawab</label>
                <input
                  type="text"
                  placeholder="Nama lengkap PIC rujukan..."
                  value={newCustPic}
                  onChange={(e) => setNewCustPic(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Email PIC</label>
                <input
                  type="email"
                  placeholder="nama.pic@domain.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => setCustomerModalOpen(false)}
                className="px-4 py-1.5 border border-border bg-white rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newCustName) {
                    onShowNotification('Nama pelanggan wajib dimasukkan.', 'error');
                    return;
                  }
                  const added: Customer = {
                    id: String(customers.length + 1),
                    name: newCustName,
                    code: newCustCode,
                    type: newCustType,
                    pic: newCustPic || 'Unknown PIC',
                    email: newCustEmail || 'pic@domain.com',
                    status: true
                  };
                  setCustomers([...customers, added]);
                  onShowNotification(`Customer ${newCustName} berhasil ditambahkan ke master registry.`, 'success');
                  setCustomerModalOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110"
              >
                Simpan Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLIDE OVER DRAWER FOR QUESTION TYPE EDITING */}
      {typeDrawerOpen && editingType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform animate-slide-in duration-200 text-left">
            <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">settings_suggest</span>
                  Edit Respon Struktur
                </h4>
                <p className="text-[10px] text-slate-400">CONF-07 Question Definition Tuning</p>
              </div>
              <button onClick={() => setTypeDrawerOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 hover:bg-slate-200">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Tipe Nama</label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 mb-1 block">JSON Schema Default</label>
                <textarea
                  rows={6}
                  value={editingType.config}
                  onChange={(e) => setEditingType({ ...editingType, config: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg text-xs font-mono bg-slate-50"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded border border-border text-[10px] text-slate-500">
                <p className="font-bold text-slate-650 flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[13px]">verified_user</span> Security Audit Info
                </p>
                <p>Terakhir dimodifikasi oleh: <strong>admin_jdoe</strong></p>
                <p>Status: Dipergunakan oleh <strong>{editingType.questionsCount} pertanyaan</strong> kuesioner aktif.</p>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5">
              <button onClick={() => setTypeDrawerOpen(false)} className="px-4 py-1.5 bg-white border border-border rounded text-xs hover:bg-slate-100 font-semibold text-slate-500">
                Batal
              </button>
              <button
                onClick={() => {
                  setTypes(types.map(x => x.name === editingType.name ? editingType : x));
                  onShowNotification(`Konfigurasi tipe ${editingType.name} tersinkronisasi.`, 'success');
                  setTypeDrawerOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110"
              >
                Simpan Tipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SLIDE OVER DRAWER FOR ADDING COMPETITORS */}
      {compDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between text-left">
            <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-855 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">factory</span>
                  Daftarkan Kompetitor Baru
                </h4>
                <p className="text-[10px] text-slate-400">Penyelarasan normalisasi referensi lookup (GAP-09)</p>
              </div>
              <button onClick={() => setCompDrawerOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-550 block mb-1">Nama Kompetitor</label>
                <input
                  type="text"
                  placeholder="e.g. PT Nippon Power Corp Indonesia"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-550 block mb-1">Sektor Segmentasi</label>
                <select
                  value={newCompSegment}
                  onChange={(e) => setNewCompSegment(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-white"
                >
                  <option value="Retail & Logistik">Retail & Logistik</option>
                  <option value="Infrastructure">Infrastructure Sektor</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                  <option value="Industrial">Industrial Construction</option>
                  <option value="Banking & Finance">Banking & Finance</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-550 block mb-1">Catatan Profiling Tambahan</label>
                <textarea
                  rows={4}
                  placeholder="Detail singkat analisis kompetitor..."
                  value={newCompNotes}
                  onChange={(e) => setNewCompNotes(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs resize-none bg-slate-50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5">
              <button onClick={() => setCompDrawerOpen(false)} className="px-4 py-1.5 bg-white border border-border rounded text-xs hover:bg-slate-100 text-slate-600">
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newCompName) {
                    onShowNotification('Nama kompetitor wajib diisi.', 'error');
                    return;
                  }
                  const letters = newCompName.slice(0, 2).toUpperCase();
                  const added: Competitor = {
                    id: String(competitors.length + 1),
                    code: `COMP-${Math.floor(100 + Math.random() * 899)}`,
                    name: newCompName,
                    initials: letters,
                    segment: newCompSegment,
                    usage: '01 Proyek',
                    status: 'Aktif'
                  };
                  setCompetitors([...competitors, added]);
                  onShowNotification(`Kompetitor ${newCompName} didaftarkan ke lookup master.`, 'success');
                  setCompDrawerOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110"
              >
                Simpan Kompetitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SLIDE OVER DRAWER FOR ADDING / EDITING USERS */}
      {userDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between text-left">
            <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">security</span>
                  {editingUser ? 'Edit Pengguna Regional' : 'Tambah Pengguna Baru'}
                </h4>
                <p className="text-[10px] text-slate-400">MAST-05 Access Scoping Security</p>
              </div>
              <button onClick={() => setUserDrawerOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Nama Lengkap Karyawan</label>
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
                <label className="font-bold text-slate-500 mb-1 block">Sistem Role Group</label>
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
                <p className="text-[9px] text-slate-400 mt-0.5">Scoping default disesuaikan dengan limitasi regional.</p>
              </div>
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Penempatan Regional / Kantor Pusat</label>
                <input
                  type="text"
                  placeholder="e.g. Cabang Jakarta Pusat"
                  value={editingUser ? editingUser.branch : ''}
                  onChange={(e) => {
                    if (editingUser) setEditingUser({ ...editingUser, branch: e.target.value });
                  }}
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 mb-1 block">Email Akun</label>
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

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5">
              <button onClick={() => setUserDrawerOpen(false)} className="px-4 py-1.5 bg-white border border-border rounded text-xs hover:bg-slate-100 text-slate-650">
                Batal
              </button>
              <button
                onClick={() => {
                  if (editingUser) {
                    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
                    onShowNotification(`Hak akses untuk ${editingUser.name} berhasil dimutasi.`, 'success');
                  } else {
                    onShowNotification('Pembuatan pengguna baru disimulasikan.', 'success');
                  }
                  setUserDrawerOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110"
              >
                Simpan Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SLIDE OVER DRAWER FOR QUESTION DRAWER */}
      {questionDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between text-left">
            <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
                  Tambah Pertanyaan Baru
                </h4>
                <p className="text-[10px] text-slate-400">MAST-03 Dynamic Questionnaire Editor</p>
              </div>
              <button onClick={() => setQuestionDrawerOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-550 block mb-1">Judul / Label Pertanyaan</label>
                <input
                  type="text"
                  placeholder="e.g. Masukkan Alamat Usaha Regional"
                  id="new-question-title"
                  className="w-full p-2 border border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-550 block mb-1">Grup Penempatan</label>
                <select id="new-question-group" className="w-full p-2 border border-border rounded-lg text-xs bg-white">
                  <option value="Data Pribadi">Data Pribadi</option>
                  <option value="Lokasi">Lokasi Operasional</option>
                  <option value="Verifikasi Fisik">Verifikasi Fisik</option>
                  <option value="Keuangan">Analisis Keuangan</option>
                  <option value="RKS">Syaratan RKS</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-550 block mb-1">Tipe Respon</label>
                <select id="new-question-type" className="w-full p-2 border border-border rounded-lg text-xs bg-white">
                  <option value="Short Text">Short Text Input</option>
                  <option value="Radio Button">Radio Button List</option>
                  <option value="File Upload">Secure File Upload</option>
                  <option value="Currency">Currency (IDR)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-550 block mb-1">Help Text Penjelas</label>
                <textarea
                  id="new-question-help"
                  rows={3}
                  placeholder="Berikan pedoman bagi regional field saat mengisi..."
                  className="w-full p-2 border border-border rounded-lg text-xs resize-none bg-slate-50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2.5">
              <button onClick={() => setQuestionDrawerOpen(false)} className="px-4 py-1.5 bg-white border border-border rounded text-xs hover:bg-slate-100 text-slate-600">
                Batal
              </button>
              <button
                onClick={() => {
                  const titleInput = (document.getElementById('new-question-title') as HTMLInputElement)?.value;
                  const groupSelect = (document.getElementById('new-question-group') as HTMLSelectElement)?.value;
                  const typeSelect = (document.getElementById('new-question-type') as HTMLSelectElement)?.value;
                  const helpInput = (document.getElementById('new-question-help') as HTMLTextAreaElement)?.value;

                  if (!titleInput) {
                    onShowNotification('Label pertanyaan wajib dimasukkan.', 'error');
                    return;
                  }

                  let typeIcon = 'text_fields';
                  if (typeSelect === 'Radio Button') typeIcon = 'radio_button_checked';
                  if (typeSelect === 'File Upload') typeIcon = 'upload_file';
                  if (typeSelect === 'Currency') typeIcon = 'payments';

                  const added: MasterQuestion = {
                    id: `PR-${Math.floor(100 + Math.random() * 900)}`,
                    title: titleInput,
                    group: groupSelect,
                    type: typeSelect as any,
                    icon: typeIcon,
                    required: true,
                    status: 'Aktif',
                    help: helpInput || 'Harap masukkan data sesuai kebenaran.',
                    placeholder: 'Masukan data...'
                  };

                  setQuestions([...questions, added]);
                  setSelectedQuestionId(added.id);
                  onShowNotification(`Pertanyaan "${titleInput}" berhasil didaftarkan secara dinamis.`, 'success');
                  setQuestionDrawerOpen(false);
                }}
                className="px-5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110"
              >
                Posisikan Pertanyaan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
