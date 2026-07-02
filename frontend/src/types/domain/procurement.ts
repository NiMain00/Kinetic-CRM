import type { TimelineEvent, DocGroup } from './index';

export type ProcurementStatus =
  | 'Draft'
  | 'Purchase Request'
  | 'Vendor Selection'
  | 'PO Process'
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

  // Purchase Request
  prNumber?: string;
  prDate?: string;
  prNotes?: string;

  // Vendor Selection
  selectedVendor?: string;
  vendorPic?: string;
  vendorContact?: string;

  // Purchase Order
  poNumber?: string;
  poDate?: string;
  poValue?: number;
  poNotes?: string;

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
  { id: 'PC-02', status: 'Purchase Request', phase: 'Purchase Request',  order: 2, isActive: true },
  { id: 'PC-03', status: 'Vendor Selection', phase: 'Vendor Selection',  order: 3, isActive: true },
  { id: 'PC-04', status: 'PO Process',       phase: 'PO',                order: 4, isActive: true },
  { id: 'PC-05', status: 'Delivery',         phase: 'Delivery',          order: 5, isActive: true },
  { id: 'PC-06', status: 'Progress',         phase: 'Progress',          order: 6, isActive: true },
  { id: 'PC-07', status: 'Closed',           phase: 'Closing',           order: 7, isActive: true },
  { id: 'PC-08', status: 'Cancelled',        phase: 'Selesai',           order: 8, isActive: true },
];

export function generateProcurementCode(index: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `PR-${year}${month}-${String(index + 1).padStart(4, '0')}`;
}
