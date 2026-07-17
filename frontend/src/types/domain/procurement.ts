import type { TimelineEvent, DocGroup } from './index';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'manufacturer' | 'distributor' | 'agent' | 'contractor' | 'consultant';
  city: string;
  phone: string;
  email: string;
  picName: string;
  picPosition: string;
  npwp?: string;
  rating: number;
  totalProjects: number;
  totalValue: number;
  onTimeDelivery: number;
  qualityScore: number;
  complianceScore: number;
  status: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
  categories: string[];
  certificates: string[];
  blacklistReason?: string;
  blacklistedAt?: string;
  createdAt: string;
  updatedAt?: string;
  evaluations: SupplierEvaluation[];
}

export interface SupplierEvaluation {
  id: string;
  supplierId: string;
  projectId: string;
  projectName: string;
  evaluator: string;
  date: string;
  quality: number;
  delivery: number;
  pricing: number;
  compliance: number;
  communication: number;
  notes: string;
  overall: number;
}

export interface RfqDocument {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
}

export interface RfqItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface RfqQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    itemId: string;
    unitPrice: number;
    totalPrice: number;
    deliveryTime: string;
    notes?: string;
  }>;
  totalAmount: number;
  deliveryTime: string;
  validityPeriod: string;
  terms: string;
  submittedAt: string;
  status: 'pending' | 'evaluated' | 'selected' | 'rejected';
  evaluatorNotes?: string;
}

export interface Rfq {
  id: string;
  procurementId: string;
  number: string;
  title: string;
  description?: string;
  deadline: string;
  status: 'draft' | 'sent' | 'evaluating' | 'completed' | 'cancelled';
  items: RfqItem[];
  suppliers: string[];
  quotes: RfqQuote[];
  selectedQuoteId?: string;
  documents: RfqDocument[];
  createdAt: string;
  createdBy: string;
  sentAt?: string;
  completedAt?: string;
  notes?: string;
}

export type ProcurementStatus =
  | 'Draft'
  | 'Vendor Selection'
  | 'Delivery'
  | 'Progress'
  | 'Closed'
  | 'Cancelled';

export interface Procurement {
  id: string;
  code: string;
  sourceProjectId?: string;
  sourceProjectCode?: string;
  sourceProjectName?: string;

  // Inherited from project
  client: string;
  contractValue: number;
  location: string;

  // Workflow
  status: ProcurementStatus;
  phase: string;
  progress: number;

  // Timestamps
  createdAt: string;
  createdBy: string;
  createdByUserId?: string;
  updatedAt?: string;

  // Legacy fields (PR / PO data)
  prNumber?: string;
  prDate?: string;
  prNotes?: string;
  poNumber?: string;
  poDate?: string;
  poValue?: number;
  poNotes?: string;

  // Vendor Selection
  selectedVendor?: string;
  vendorPic?: string;
  vendorContact?: string;

  // Delivery / Tracking
  targetStartDate?: string;
  targetEndDate?: string;
  unitReadyDate?: string;
  unitShippedDate?: string;
  unitReceivedDate?: string;
  actualEndDate?: string;
  deliveryNote?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  deliveredBy?: string;

  // Progress & Closing
  progressNotes?: string;
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;

  // Sub-entities (separate from project)
  timeline?: TimelineEvent[];
  documents?: DocGroup[];
}

export const PROCUREMENT_PHASES = [
  { id: 'PC-01', status: 'Draft',            phase: 'Overview',          order: 1, isActive: true },
  { id: 'PC-02', status: 'Vendor Selection', phase: 'Vendor Selection',  order: 2, isActive: true },
  { id: 'PC-03', status: 'Delivery',         phase: 'Delivery',          order: 3, isActive: true },
  { id: 'PC-04', status: 'Closed',           phase: 'Closing',           order: 4, isActive: true },
  { id: 'PC-05', status: 'Cancelled',        phase: 'Selesai',           order: 5, isActive: true },
];

export function generateProcurementCode(index: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(index + 1).padStart(4, '0');
  // Random suffix prevents unique constraint collision after soft-delete
  const unique = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PR-${year}${month}-${seq}-${unique}`;
}
