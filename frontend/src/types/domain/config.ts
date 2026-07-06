export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  unitType: 'company' | 'division' | 'branch' | 'department';
  city?: string;
  province?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SlaConfig {
  id: string;
  name: string;
  entityType: 'prospek' | 'rks' | 'lphs' | 'approval';
  warningThreshold: number;
  criticalThreshold: number;
  unit: 'hours' | 'days';
  escalationRole: string;
  active: boolean;
}

export interface KpiTarget {
  id: string;
  name: string;
  category: 'KPI' | 'Approval';
  targetValue: number;
  actualValue: number;
  unit: string;
  period: string;
  description: string;
}

export interface WorkflowStep {
  id: string;
  entityType: 'prospek' | 'rks' | 'lphs';
  name: string;
  order: number;
  description: string;
  assigneeRole: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface WorkflowDefinition {
  entityType: 'prospek' | 'rks' | 'lphs';
  steps: WorkflowStep[];
}

export interface Connector {
  id: string;
  name: string;
  type: 'API' | 'Webhook' | 'Email' | 'Database' | 'Cloud Storage' | 'LDAP';
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  active: boolean;
  lastTested?: string;
  configJson?: string;
}

export interface ProjectPhase {
  id: string;
  status: string;
  phase: string;
  order: number;
  isActive: boolean;
}

export interface UploadConfig {
  maxFileSizeMb: number;
  allowedExtensions: string[];
  storagePath: string;
  maxFilesPerUpload: number;
  enableCompression: boolean;
  allowedMimeTypes: string[];
}
