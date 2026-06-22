export interface Prospect {
  id: string;
  name: string;
  client: string;
  status: 'Prospecting' | 'Waiting PM' | 'Revision' | 'Approved';
  author: string;
  date: string;
  estimatedValue?: number;
  description?: string;
  answers?: Record<string, string>;
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
  };
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
