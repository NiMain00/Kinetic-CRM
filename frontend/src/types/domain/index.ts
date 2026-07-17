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
  picEmail?: string;
  address?: string;
  province?: string;
  industryId?: string;
  providerExisting?: string;
  isNew?: boolean;
  isActive?: boolean;
  needsVerification?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  parentId?: string;
  level?: 'hot' | 'medium' | 'low';
  requirements?: string;
  unitLevel?: string;
  canonicalName?: string;
  source?: string;
  children?: Customer[];
}

export interface Prospect {
  id: string;
  name: string;
  client: string;
  customerId?: string;
  customerType?: 'existing' | 'new';
  customerData?: Customer;
  status: 'Lead' | 'Non Potensial' | 'Potensial' | 'Waiting Supervisor' | 'Revision' | 'Approved';
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
  projectType?: string;
  isConverted?: boolean;
  projectId?: string;
  createdByUserId?: string;
  departmentId?: string;
  currentStageId?: string;
  ownerUserId?: string;
  source?: string;
  timeline?: TimelineEvent[];
  documents?: DocGroup[];
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
  selectedDepartments?: string[];
  departmentsLocked?: boolean;
  overallStatus?: 'draft' | 'dept_review' | 'pm_review' | 'approved' | 'revision';
  pmStatus?: 'pending' | 'reviewing' | 'approved' | 'revision';
  departmentApprovals?: RksDepartmentApproval[];
}

export interface RksDepartmentApproval {
  departmentId: string;
  departmentName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'revision';
  approverName?: string;
  reviewNotes?: string;
  approvedAt?: string;
  revisionRound: number;
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
  type: string;
  sourceProspectId?: string;
  providerExisting?: string;
  deadlineTender?: string;
  createdByUserId?: string;
  departmentId?: string;
  currentStageId?: string;
  ownerUserId?: string;
  scopeDepartments?: string[];
  branch?: string;
  pricing?: {
    value: number;
    margin: number;
    note: string;
    referenceUrl?: string;
    bottomPrice?: number;
  };
  winnerDetails?: {
    outcome: 'menang' | 'kalah' | null;
    contractValue?: number;
    startDate?: string;
    duration?: number;
    loseReason?: string;
    loseNote?: string;
    spkDocument?: { name: string; size: string; time: string } | null;
  };
  delivery?: {
    startDate?: string;
    endDate?: string;
    actualEndDate?: string;
    note?: string;
    isCompleted?: boolean;
    completedAt?: string;
    completedBy?: string;
  };
  rks?: RksData;
  lphs?: LphsData;
  competitors?: CompetitorEntry[];
  documents?: DocGroup[];
  timeline?: TimelineEvent[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleId: string;
  departmentId: string;
  assignedBy: string;
}

export interface ApprovalItem {
  id: string;
  ref: string;
  name: string;
  branch: string;
  waitingSince: string;
  slaStatus: 'Overdue' | 'Near Deadline' | 'Normal';
  type: 'Prospek' | 'RKS' | 'LPHS';
  resourceType: 'prospect' | 'rks' | 'lphs_sios';
  resourceId: string;
  client?: string;
  entityId?: string;
  entityType?: 'prospect' | 'project';
  assigneeUserId?: string;
}

export type VisitStatus = 'pending' | 'completed' | 'cancelled';

export interface Visit {
  id: string;
  prospectId: string;
  customerId?: string;
  visitNumber: number;
  status: VisitStatus;
  date: string;
  notes?: string;
  picName?: string;
  picUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpStatus = 'pending' | 'in_progress' | 'completed';
export type FollowUpPriority = 'low' | 'medium' | 'high';

export interface FollowUpTask {
  id: string;
  title: string;
  prospectId: string;
  fromUserId: string;
  toUserId: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  progress: number;
  notes?: string;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export * from './users';
export * from './item';
export * from './master-item';

// NOTE: Some parts of the app use a different Prospect/Project typing model.
// This file re-exports the canonical domain types. Update them carefully.
