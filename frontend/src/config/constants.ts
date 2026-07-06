export const STORAGE_KEYS = {
  AUTH: 'kinetic-auth',
  APPROVALS: 'kinetic-approvals',
  APPROVAL_CHAINS: 'kinetic-approval-chains',
  CONFIG: 'kinetic-config',
  CUSTOMERS: 'kinetic-customers',
  DEAL_LINE_ITEMS: 'kinetic-deal-line-items',
  INPUT_CONFIG: 'kinetic-input-config',
  MASTER_DATA: 'kinetic-master-data',
  NOTIFICATIONS: 'kinetic-notifications',
  PREFERENCES: 'kinetic-preferences',
  PROCUREMENT_ITEMS: 'kinetic-procurement-items',
  PROJECT_REQUIREMENTS: 'kinetic-project-requirements',
  PROJECTS: 'kinetic-projects',
  PROSPECTS: 'kinetic-prospects',
  RBAC: 'kinetic-rbac',
  RELATIONS: 'kinetic-relations',
  RFQS: 'kinetic-rfqs',
  SUPPLIERS: 'kinetic-suppliers',
  TASKS: 'kinetic-tasks',
  THEME: 'kinetic-theme',
  USERS: 'kinetic-users',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  PROSPECTS: '/prospects',
  PROSPECTS_PIPELINE: '/prospects/pipeline',
  PROSPECTS_NEW: '/prospects/new',
  PROSPECTS_DETAIL: '/prospects/:id',
  PROSPECTS_EDIT: '/prospects/:id/edit',
  PROJECTS: '/projects',
  PROJECTS_NEW: '/projects/new',
  PROJECTS_DETAIL: '/project/:projectId/:tab?',
  PROCUREMENT: '/procurement',
  PROCUREMENT_NEW: '/procurement/new',
  PROCUREMENT_DETAIL: '/procurement/:procurementId',
  PROCUREMENT_DETAIL_TAB: '/procurement/:procurementId/:tab',
  APPROVALS: '/approvals',
  REPORTS: '/reports',
  REPORTS_WIN_LOSS: '/reports/win-loss',
  REPORTS_PIPELINE: '/reports/pipeline',
  REPORTS_CALENDAR: '/reports/calendar',
  REPORTS_KPI: '/reports/kpi',
  REPORTS_KPI_PROGRESS: '/reports/kpi/progress',
  REPORTS_KPI_TARGETS: '/reports/kpi/targets',
  MASTER_DATA: '/master-data',
  MASTER_DATA_CUSTOMERS: '/master-data/customers',
  MASTER_DATA_COMPETITORS: '/master-data/competitors',
  MASTER_DATA_CATEGORIES: '/master-data/categories',
  MASTER_DATA_DOC_TYPES: '/master-data/document-types',
  MASTER_DATA_QUESTIONS: '/master-data/questions',
  MASTER_DATA_HOLIDAYS: '/master-data/holidays',
  MASTER_DATA_LOSS_REASONS: '/master-data/loss-reasons',
  MASTER_DATA_PERIODS: '/master-data/periods',
  MASTER_DATA_ENTITY: '/master-data/:entity',
  NOTIFICATIONS: '/notifications',
  AUDIT: '/audit',
  AUDIT_LOG: '/audit/log',
  CONFIG: '/config',
  CONFIG_ORG: '/config/org',
  CONFIG_STATUS: '/config/status',
  CONFIG_NOTIFICATIONS: '/config/notifications',
  CONFIG_SLA: '/config/sla',
  CONFIG_TARGETS: '/config/targets',
  CONFIG_WORKFLOW: '/config/workflow',
  CONFIG_INTEGRATION: '/config/integration',
  CONFIG_UPLOAD: '/config/upload',
  CONFIG_PERIOD: '/config/period',
  CONFIG_QUESTION_TYPES: '/config/question-types',
  CONFIG_ACCESS_CONTROL: '/config/access-control',
  CONFIG_INPUT_OPTIONS: '/config/input-options',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
} as const;

export const ROLE_HIERARCHY = {
  super_admin: 5,
  director: 4,
  admin: 3,
  manager: 2,
  staff: 1,
} as const;

export type RoleLevel = keyof typeof ROLE_HIERARCHY;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  SUPERVISOR: 'supervisor',
  PROJECT_VIEWER: 'project_viewer',
  PROJECT_CONTRIBUTOR: 'project_contributor',
  PROJECT_MANAGER: 'project_manager',
} as const;

export const ELEVATED_ROLES: readonly string[] = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.SUPER_ADMIN,
];

export const SCOPE_TYPES = {
  GLOBAL: 'global',
  DEPARTMENT: 'department',
  PROJECT: 'project',
} as const;

export const ACCESS_LEVELS = {
  NONE: 'none',
  READ: 'read',
  WRITE: 'write',
} as const;

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  NOTIFICATION_READ: 'notification:read',
  PROFILE_MANAGE: 'profile:manage',
  PROSPECT_READ: 'prospect:read',
  PROSPECT_WRITE_PROSPECTING: 'prospect:write:prospecting',
  PROSPECT_APPROVE_TRANSITION: 'prospect:approve:transition',
  PROJECT_READ: 'project:read',
  PROJECT_CREATE: 'project:create',
  PROJECT_WRITE: 'project:write',
  PROJECT_MANAGE_MEMBERS: 'project:manage:members',
  PROJECT_MANAGE_SCOPE: 'project:manage:scope',
  PENGADAAN_READ: 'pengadaan:read',
  PENGADAAN_CREATE: 'pengadaan:create',
  PENGADAAN_WRITE: 'pengadaan:write',
  REPORT_VIEW_DEPARTMENT: 'report:view:department',
  REPORT_VIEW_CROSSDEPT: 'report:view:crossdept',
  CONFIG_ACCESS: 'config:access',
} as const;

export const GLOBAL_PERMISSIONS: readonly string[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.NOTIFICATION_READ,
  PERMISSIONS.PROFILE_MANAGE,
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  DEFAULT_LIMIT: 10,
};

export const UPLOAD = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_PER_UPLOAD: 5,
  ENABLE_COMPRESSION: true,
  STORAGE_PATH: '/uploads/documents/',
  ALLOWED_EXTENSIONS: [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif',
  ],
  MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
} as const;

export const SLA = {
  DEFAULT_WARNING_THRESHOLD: 24,
  DEFAULT_CRITICAL_THRESHOLD: 48,
  DEFAULT_UNIT: 'hours',
  ESCALATION_ROLES: ['Admin', 'PM', 'Branch Manager', 'Dept Head', 'Super Admin'],
} as const;

export const STATUS = {
  PROJECT: {
    CREATED: 'created',
    SUBMIT_RKS: 'submit_rks',
    REVIEW_DEPARTMENT: 'review_department',
    LPHS_SIOS: 'lphs_sios',
    REVISION: 'revision',
    SUBMIT_HARGA: 'submit_harga',
    PENGUMUMAN_PEMENANG: 'pengumuman_pemenang',
    TARGET_DELIVERY: 'target_delivery',
    SELESAI: 'selesai',
    CANCELLED: 'cancelled',
  },
  PROSPECT: {
    POTENSIAL: 'Potensial',
    APPROVED: 'Approved',
    WAITING_SUPERVISOR: 'Waiting Supervisor',
    REVISION: 'Revision',
    NON_POTENSIAL: 'Non Potensial',
  },
  USER: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
  APPROVAL: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SKIPPED: 'skipped',
  },
  NOTIFICATION: {
    APPROVAL: 'approval',
    REVISION: 'revision',
    STATUS_CHANGE: 'status_change',
    ASSIGNMENT: 'assignment',
    SYSTEM: 'system',
  },
  SUPPLIER: {
    ACTIVE: 'active',
    BLACKLISTED: 'blacklisted',
  },
  TASK: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
  },
  RFQ: {
    DRAFT: 'draft',
    SENT: 'sent',
    COMPLETED: 'completed',
  },
  QUOTE: {
    SELECTED: 'selected',
    REJECTED: 'rejected',
  },
  PROCUREMENT_STATUS: {
    FULLY_SUBMITTED: 'fully_submitted',
    PARTIAL: 'partial',
    NONE: 'none',
  },
} as const;

export const ITEM_TYPES = {
  BARANG: 'barang',
  JASA: 'jasa',
} as const;

export const ID_PREFIXES = {
  REQUIREMENT: 'req-',
  PROCUREMENT_ITEM: 'pritem-',
  NOTIFICATION: 'notif-',
  RFQ: 'RFQ-',
  MESSAGE: 'msg-',
  RBAC: 'rbac-',
} as const;

export const AI = {
  PROVIDER: import.meta.env.VITE_AI_PROVIDER || 'gemini',
  MODEL: import.meta.env.VITE_AI_MODEL || 'gemini-2.5-pro',
  MAX_TOKENS: Number(import.meta.env.VITE_AI_MAX_TOKENS) || 2048,
  TEMPERATURE: Number(import.meta.env.VITE_AI_TEMPERATURE) || 0.3,
  TIMEOUT_SECONDS: Number(import.meta.env.VITE_AI_TIMEOUT_SECONDS) || 30,
  MAX_RETRIES: Number(import.meta.env.VITE_AI_MAX_RETRIES) || 3,
  ENABLED: import.meta.env.VITE_AI_ENABLED === 'true',
  LABELS: {
    ANALYSIS_TYPE: {
      RISK: 'risk',
      OPPORTUNITY: 'opportunity',
      INSIGHT: 'insight',
    },
    SENTIMENT: {
      POSITIVE: 'positive',
      NEUTRAL: 'neutral',
      NEGATIVE: 'negative',
    },
  },
} as const;

export const DEFAULT_LOCALE = {
  LANGUAGE: 'id',
  TIMEZONE: 'Asia/Jakarta',
  NOTIFICATIONS_ENABLED: true,
} as const;

export const DASHBOARD = {
  SEVERITY: {
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info',
  },
} as const;

export const ENTITY_TYPES = {
  PROCUREMENT: 'procurement',
  PROJECT: 'project',
  PROSPECT: 'prospect',
} as const;

export const CONNECTOR_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export const DEPARTMENTS = {
  IT: 'dept-it',
  HC: 'dept-hc',
  FINANCE: 'dept-finance',
  PROCUREMENT: 'dept-procurement',
  MARKETING: 'dept-marketing',
  PM: 'dept-pm',
} as const;

export const WORKFLOW_STAGES = {
  PROSPECTING: 'stage-prospecting',
  SUPERVISOR_REVIEW: 'stage-supervisor-review',
  WAITING_PM: 'stage-waiting-pm',
  IN_PROJECT: 'stage-in-project',
  PENGADAAN: 'stage-pengadaan',
  DELIVERY: 'stage-delivery',
} as const;

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

export const ACCEPTABLE_LABELS_MAP = {
  'id': 'Indonesia',
  'en': 'English',
} as const;

export const RBAC_CONFIG = {
  DEFAULT_ACCESS_LEVEL: 'write',
  NEXT_ID_START: 1000,
  LENGTH_TO_CHECK: 3,
  INDEX_TO_CHECK: 2,
  SEPARATOR: ':',
} as const;

export const ITEM_HANDOFF = {
  DEFAULT_QUANTITY_USED: 0,
  DEFAULT_QUANTITY_PROCURED: 0,
  DEFAULT_QUANTITY_RECEIVED: 0,
  DEFAULT_STATUS: 'pending',
  PROGRESS_PERCENTAGE_MAX: 100,
} as const;

export const EVENT_BRIDGE = {
  ERROR_PREFIX: '[EventBridge] Handler error for ',
} as const;

export const TRANSACTION = {
  ERROR_NAME: 'TransactionError',
  ROLLBACK_SEPARATOR: '; ',
  ERROR_DELIMITER: '. Rollback errors: ',
} as const;
