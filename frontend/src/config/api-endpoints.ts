export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  TIMEOUT: 30000,

  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  PROSPECTS: {
    LIST: '/prospects',
    DETAIL: (id: string) => `/prospects/${id}`,
    CREATE: '/prospects',
    UPDATE: (id: string) => `/prospects/${id}`,
    DELETE: (id: string) => `/prospects/${id}`,
  },

  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
  },

  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/users/${id}/toggle-status`,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },

  MASTER_DATA: {
    CUSTOMERS: '/master/customers',
    CUSTOMER_DETAIL: (id: string) => `/master/customers/${id}`,
    ENTITY: '/master/{entity}',
    ENTITY_DETAIL: (entity: string, id: string) => `/master/${entity}/${id}`,
  },

  APPROVALS: {
    LIST: '/approvals',
    DETAIL: (id: string) => `/approvals/${id}`,
    APPROVE: (id: string) => `/approvals/${id}/approve`,
    REJECT: (id: string) => `/approvals/${id}/reject`,
    REVIEW: (id: string) => `/approvals/${id}/review`,
  },

  DASHBOARD: {
    STATS: '/dashboard/stats',
    TREND_WIN_LOSS: '/dashboard/trend-win-loss',
    STATUS_DISTRIBUTION: '/dashboard/status-distribution',
    CRITICAL_DEADLINES: '/dashboard/critical-deadlines',
    APPROVAL_PENDING: '/dashboard/approval-pending',
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
    CREATE: '/notifications',
  },

  REPORTS: {
    WIN_LOSS: '/reports/win-loss',
    PIPELINE: '/reports/pipeline',
    KPI: '/reports/kpi',
    EXPORT: (reportType: string) => `/reports/${reportType}/export`,
  },

  AI: {
    ANALYZE_PROJECT: (projectId: string) => `/ai/analyze/project/${projectId}`,
    ANALYZE_PROSPECT: (prospectId: string) => `/ai/analyze/prospect/${prospectId}`,
    STRATEGIZE: (projectId: string) => `/ai/strategize/${projectId}`,
    PREDICT: (projectId: string) => `/ai/predict/${projectId}`,
    CHAT: '/ai/chat',
  },

  RKS: {
    LIST: (projectId: string) => `/projects/${projectId}/rks`,
    CREATE: (projectId: string) => `/projects/${projectId}/rks`,
    SUBMIT: (projectId: string) => `/projects/${projectId}/rks/submit`,
    REVIEW: (projectId: string) => `/projects/${projectId}/rks/review`,
    UPLOAD: (projectId: string) => `/projects/${projectId}/rks/upload`,
    FILE: (projectId: string, fileName: string) =>
      `/projects/${projectId}/rks/files/${encodeURIComponent(fileName)}`,
  },

  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    LEAD_TIME: '/analytics/lead-time',
    STAGE_DURATION: '/analytics/stage-duration',
    BOTTLENECKS: '/analytics/bottlenecks',
    THROUGHPUT: '/analytics/throughput',
    HEATMAP: '/analytics/heatmap',
    PROJECT_TIMELINE: (id: string) => `/projects/${id}/timeline-analytics`,
  },

  LPHS_SIOS: {
    LIST: (projectId: string) => `/projects/${projectId}/lphs`,
    CREATE: (projectId: string) => `/projects/${projectId}/lphs`,
    SUBMIT: (projectId: string) => `/projects/${projectId}/lphs/submit`,
    REVIEW_DEPT: (projectId: string) => `/projects/${projectId}/lphs/review-department`,
    REVIEW_PM: (projectId: string) => `/projects/${projectId}/lphs/review-pm`,
    REVIEW_MGMT: (projectId: string) => `/projects/${projectId}/lphs/review-mgmt`,
    UPLOAD: (projectId: string) => `/projects/${projectId}/lphs/upload`,
    UPLOAD_SIOS: (projectId: string) => `/projects/${projectId}/lphs/upload-sios`,
  },
} as const;
