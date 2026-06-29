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

export const CUSTOMER_TYPES = [
  { value: 'swasta', label: 'Swasta' },
  { value: 'bumn', label: 'BUMN' },
  { value: 'pemerintah', label: 'Pemerintah' },
  { value: 'asing', label: 'Asing' },
];

export * from './users';

// NOTE: Some parts of the app use a different Prospect/Project typing model.
// This file re-exports the canonical domain types. Update them carefully.
