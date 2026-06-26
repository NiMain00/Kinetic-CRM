export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  branch: string;
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  lastLogin?: string;
  createdAt: string;
}

export type UserRole = 'Super Admin' | 'Admin' | 'PM' | 'Branch Manager' | 'Dept Head' | 'Management' | 'Reviewer' | 'Staff';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorInitials: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'REVISE' | 'UPLOAD' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId: string;
  entityName: string;
  summary: string;
  before?: string;
  after?: string;
  ipAddress?: string;
  impact: 'Low' | 'Medium' | 'High';
}

export interface KpiTarget {
  id: string;
  name: string;
  category: 'win_rate' | 'revenue' | 'project_count' | 'avg_margin' | 'sla_compliance' | 'customer_satisfaction';
  targetValue: number;
  actualValue: number;
  unit: string;
  period: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
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
