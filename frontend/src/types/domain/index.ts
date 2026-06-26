export interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  city: string;
  npwp?: string;
  picName: string;
  picPosition: string;
  picPhone: string;
  industryId?: string;
  providerExisting?: string;
  isNew?: boolean;
  needsVerification?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Prospect {
  id: string;
  name: string;
  client: string;
  customerId?: string;
  customerType?: 'existing' | 'new';
  customerData?: Customer;
  status: 'Non Potensial' | 'Potensial' | 'Waiting PM' | 'Revision' | 'Approved';
  prospectType?: 'non_potensial' | 'potensial';
  potensiUnit: number;
  author: string;
  date: string;
  estimatedValue?: number;
  description?: string;
  branch?: string;
  answers?: Record<string, string>;
  industryId?: string;
  providerExisting?: string;
  projectType?: 'Tender' | 'Prospecting';
  isConverted?: boolean;
  projectId?: string;
}

export interface RksData {
  nomorTender: string;
  namaTender: string;
  deadlineTender: string;
  aanwijzing: string;
  workLocation: string;
  mainScope: string;
  additionalNotes: string;
  uploadedFiles: Array<{ name: string; size: string; time: string }>;
  answers?: Record<string, string>;
}

export interface LphsDepartmentApproval {
  departmentId: string;
  departmentName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'revision';
  approverName?: string;
  reviewNotes?: string;
  approvedAt?: string;
  revisionNotes?: string;
  revisionRound: number;
  isTargetedRevision: boolean;
}

export interface LphsData {
  lphsFileName?: string;
  lphsFileSize?: string;
  lphsExternalUrl?: string;
  siosFileName?: string;
  siosFileSize?: string;
  selectedDepartments: string[];
  departmentsLocked: boolean;
  pmStatus: 'pending' | 'reviewing' | 'approved' | 'revision';
  pmApprovedAt?: string;
  mgmtStatus: 'pending' | 'approved' | 'revision';
  mgmtApprovedAt?: string;
  overallStatus: 'draft' | 'dept_review' | 'mgmt_review' | 'approved' | 'revision';
  submittedAt?: string;
  finalApprovedAt?: string;
  departmentApprovals: LphsDepartmentApproval[];
}

export interface CompetitorEntry {
  id: string;
  name: string;
  estPrice: number;
  advantages: string[];
  notes: string;
}

export interface MilestoneEntry {
  id: string;
  name: string;
  completed: boolean;
  date?: string;
}

export interface DocumentEntry {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  uploader: string;
  version: string;
  icon: string;
  iconColor: string;
}

export interface DocGroup {
  key: string;
  label: string;
  icon: string;
  color: string;
  documents: DocumentEntry[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  phase: string;
  location: string;
  author: string;
  date: string;
  progress: number;
  estimatedValue: number;
  type: 'Tender' | 'Prospecting';
  sourceProspectId?: string;
  providerExisting?: string;
  deadlineTender?: string;
  pricing?: {
    value: number;
    margin: number;
    note: string;
    referenceUrl?: string;
  };
  winnerDetails?: {
    outcome: 'menang' | 'kalah' | null;
    contractValue?: number;
    startDate?: string;
    duration?: number;
    loseReason?: string;
    loseNote?: string;
  };
  delivery?: {
    startDate?: string;
    endDate?: string;
    note?: string;
    progress?: number;
    milestones?: MilestoneEntry[];
  };
  rks?: RksData;
  lphs?: LphsData;
  competitors?: CompetitorEntry[];
  documents?: DocGroup[];
  timeline?: TimelineEvent[];
}

export interface ApprovalItem {
  id: string;
  ref: string;
  name: string;
  branch: string;
  waitingSince: string;
  slaStatus: 'Overdue' | 'Near Deadline' | 'Normal';
  type: 'Prospek' | 'RKS' | 'LPHS';
  client?: string;
  entityId?: string;
  entityType?: 'prospect' | 'project';
}

export interface TimelineEvent {
  id: string;
  title: string;
  actor: string;
  role: string;
  time: string;
  type: 'approve' | 'submit' | 'revision' | 'upload' | 'status_change' | 'comment';
  description?: string;
  prevVal?: string;
  newVal?: string;
  fileName?: string;
  fileSize?: string;
}

export const BRANCHES = [
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Bandung',
  'Surabaya',
  'Medan',
  'Makassar',
  'Balikpapan',
  'Yogyakarta',
  'Semarang',
  'Palembang',
  'Denpasar',
];

export const CUSTOMER_TYPES = [
  { value: 'swasta', label: 'Swasta' },
  { value: 'bumn', label: 'BUMN' },
  { value: 'pemerintah', label: 'Pemerintah' },
  { value: 'asing', label: 'Asing' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'PT. Telkom Indonesia Tbk.', code: 'TELKOM', type: 'bumn', city: 'Bandung', npwp: '01.234.567.8-091.000', picName: 'Budi Santoso', picPosition: 'Procurement Manager', picPhone: '0812-3456-7890' },
  { id: 'C002', name: 'PT. Telekom Nusantara', code: 'TELKON', type: 'bumn', city: 'Jakarta Selatan', npwp: '02.345.678.9-092.001', picName: 'Siti Aminah', picPosition: 'IT Director', picPhone: '0813-4567-8901' },
  { id: 'C003', name: 'Energi Bangsa Corp', code: 'EBC', type: 'swasta', city: 'Jakarta Pusat', picName: 'Rizky Pratama', picPosition: 'CEO', picPhone: '0814-5678-9012' },
  { id: 'C004', name: 'Secure City Group', code: 'SCG', type: 'swasta', city: 'Jakarta Timur', picName: 'Dian Permata', picPosition: 'Security Manager', picPhone: '0815-6789-0123' },
  { id: 'C005', name: 'Bank Artha Graha', code: 'BAG', type: 'swasta', city: 'Jakarta Barat', npwp: '03.456.789.0-093.002', picName: 'Hendra Gunawan', picPosition: 'Finance Director', picPhone: '0816-7890-1234' },
  { id: 'C006', name: 'Pemerintah Provinsi DKI Jakarta', code: 'PEMDKI', type: 'pemerintah', city: 'Jakarta Pusat', picName: 'Bambang Sutejo', picPosition: 'Kepala Dinas', picPhone: '021-1234567' },
  { id: 'C007', name: 'Global Tech Solutions', code: 'GTS', type: 'asing', city: 'Jakarta Selatan', npwp: '04.567.890.1-094.003', picName: 'John Smith', picPosition: 'Regional Manager', picPhone: '0817-8901-2345' },
];

export * from './users';

// NOTE: Some parts of the app use a different Prospect/Project typing model.
// This file re-exports the canonical domain types. Update them carefully.
