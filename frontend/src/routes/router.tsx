import React, { Suspense, lazy, type ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, RoleRoute, PermissionRoute } from './guards';
import { AppLayout } from '@/components/layout';
import { PageLoader } from '@/components/layout';
import { withPageProps } from './page-adapter';

const LazyLoad = (Component: ComponentType<any>) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <Suspense fallback={<PageLoader />}>
      <Wrapped {...props} />
    </Suspense>
  );
};

const LazyLoadRole = (Component: ComponentType<any>, roles: string[]) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <Suspense fallback={<PageLoader />}>
      <RoleRoute roles={roles}>
        <Wrapped {...props} />
      </RoleRoute>
    </Suspense>
  );
};

const LazyLoadPermission = (Component: ComponentType<any>, permissions: string[]) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <Suspense fallback={<PageLoader />}>
      <PermissionRoute permissions={permissions}>
        <Wrapped {...props} />
      </PermissionRoute>
    </Suspense>
  );
};

// Auth pages
const LoginPage = LazyLoad(lazy(() => import('@/features/auth/LoginPage')));
const ForgotPasswordPage = LazyLoad(lazy(() => import('@/features/auth/ForgotPasswordPage')));
const ResetPasswordPage = LazyLoad(lazy(() => import('@/features/auth/ResetPasswordPage')));

// Dashboard
const DashboardPage = LazyLoadPermission(lazy(() => import('@/features/dashboard/DashboardPage')), ['dashboard:view']);

// Prospects
const ProspectsPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectsPage')), ['prospect:read']);
const ProspectFormPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectFormPage')), ['prospect:read']);
const ProspectDetailPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectDetailPage')), ['prospect:read']);
const ProspectPipelinePage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectPipelinePage')), ['prospect:read']);

// Projects
const ProjectListPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectListPage')), ['project:read']);
const ProjectFormPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectFormPage')), ['project:create']);
const ProjectDetailPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectDetailPage')), ['project:read']);

// Procurement
const ProcurementListPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementListPage')), ['pengadaan:read']);
const ProcurementFormPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementFormPage')), ['pengadaan:create']);
const ProcurementDetailPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementDetailPage')), ['pengadaan:read']);

// Approvals
const ApprovalInboxPage = LazyLoadPermission(lazy(() => import('@/features/approvals/ApprovalInboxPage')), ['prospect:approve:transition']);

// KPI → moved under Reports
const KPIDashboardPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIDashboardPage')), ['report:view:department']);
const KPIProgressPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIProgressPage')), ['report:view:department']);
const KPITargetsPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPITargetsPage')), ['report:view:department']);

// Reports
const WinLossReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/WinLossReportPage')), ['report:view:department']);
const PipelineReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/PipelineReportPage')), ['report:view:department']);
const ReportsIndexPage = LazyLoadPermission(lazy(() => import('@/features/reports/ReportsIndexPage')), ['report:view:department']);
const CalendarPage = LazyLoadPermission(lazy(() => import('@/features/reports/CalendarPage')), ['report:view:department']);

// Master Data
const MasterDataPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterDataPage')), ['config:access']);
const MasterCustomerPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCustomerPage')), ['config:access']);
const MasterCompetitorPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCompetitorPage')), ['config:access']);
const MasterCategoryPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCategoryPage')), ['config:access']);
const MasterDocTypePage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterDocTypePage')), ['config:access']);
const MasterQuestionPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterQuestionPage')), ['config:access']);
const MasterHolidayPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterHolidayPage')), ['config:access']);
const MasterLossReasonPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterLossReasonPage')), ['config:access']);
const MasterPeriodPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterPeriodPage')), ['config:access']);

// Audit — hanya Super Admin
const AuditPageSuperAdmin = LazyLoadRole(lazy(() => import('@/features/audit/AuditPage')), ['Super Admin']);
const AuditLogPageSuperAdmin = LazyLoadRole(lazy(() => import('@/features/audit/AuditLogPage')), ['Super Admin']);

// Notifications
const NotificationsPage = LazyLoad(lazy(() => import('@/features/notifications/NotificationsPage')));

// Profile
const ProfilePage = LazyLoad(lazy(() => import('@/features/profile/ProfilePage')));

// Config — hanya admin/director dengan RBAC config:access
const ConfigDashboardPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigDashboardPage')), ['config:access']);
const ConfigOrgPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigOrgPage')), ['config:access']);
const ConfigStatusPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigStatusPage')), ['config:access']);
const ConfigNotifTemplatePage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigNotifTemplatePage')), ['config:access']);
const ConfigSlaPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigSlaPage')), ['config:access']);
const ConfigAccessControlPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigAccessControlPage')), ['config:access']);
const ConfigTargetsPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigTargetsPage')), ['config:access']);
const ConfigWorkflowPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigWorkflowPage')), ['config:access']);
const ConfigIntegrationPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigIntegrationPage')), ['config:access']);
const ConfigUploadPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigUploadPage')), ['config:access']);
const ConfigPeriodPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigPeriodPage')), ['config:access']);
const ConfigQuestionTypesPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigQuestionTypesPage')), ['config:access']);
const ConfigInputPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigInputPage')), ['config:access']);

// Error pages
const ForbiddenPage = LazyLoad(lazy(() => import('@/features/errors/ForbiddenPage')));
const NotFoundPage = LazyLoad(lazy(() => import('@/features/errors/NotFoundPage')));
const ServerErrorPage = LazyLoad(lazy(() => import('@/features/errors/ServerErrorPage')));

export default function AppRouter() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<ProfilePage />} />
      </Route>

      {/* Main app routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Prospects */}
        <Route path="prospects" element={<ProspectsPage />} />
        <Route path="prospects/pipeline" element={<ProspectPipelinePage />} />
        <Route path="prospects/new" element={<ProspectFormPage />} />
        <Route path="prospects/:id" element={<ProspectDetailPage />} />
        <Route path="prospects/:id/edit" element={<ProspectFormPage />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="project/:projectId/:tab?" element={<ProjectDetailPage />} />
        <Route path="projects/:projectId/:tab?" element={<ProjectDetailPage />} />

        {/* Procurement */}
        <Route path="procurement" element={<ProcurementListPage />} />
        <Route path="procurement/new" element={<ProcurementFormPage />} />
        <Route path="procurement/:procurementId" element={<ProcurementDetailPage />} />
        <Route path="procurement/:procurementId/:tab" element={<ProcurementDetailPage />} />

        {/* Approvals */}
        <Route path="approvals" element={<ApprovalInboxPage />} />

        {/* Reports (includes KPI) */}
        <Route path="reports" element={<ReportsIndexPage />} />
        <Route path="reports/win-loss" element={<WinLossReportPage />} />
        <Route path="reports/pipeline" element={<PipelineReportPage />} />
        <Route path="reports/calendar" element={<CalendarPage />} />
        <Route path="reports/kpi" element={<KPIDashboardPage />} />
        <Route path="reports/kpi/progress" element={<KPIProgressPage />} />
        <Route path="reports/kpi/targets" element={<KPITargetsPage />} />

        {/* Redirect old KPI routes to Reports */}
        <Route path="kpi" element={<Navigate to="/reports/kpi" replace />} />
        <Route path="kpi/dashboard" element={<Navigate to="/reports/kpi" replace />} />
        <Route path="kpi/progress" element={<Navigate to="/reports/kpi/progress" replace />} />
        <Route path="kpi/targets" element={<Navigate to="/reports/kpi/targets" replace />} />

        {/* Master Data */}
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="master-data/customers" element={<MasterCustomerPage />} />
        <Route path="master-data/competitors" element={<MasterCompetitorPage />} />
        <Route path="master-data/categories" element={<MasterCategoryPage />} />
        <Route path="master-data/document-types" element={<MasterDocTypePage />} />
        <Route path="master-data/questions" element={<MasterQuestionPage />} />
        <Route path="master-data/holidays" element={<MasterHolidayPage />} />
        <Route path="master-data/loss-reasons" element={<MasterLossReasonPage />} />
        <Route path="master-data/periods" element={<MasterPeriodPage />} />
        <Route path="master-data/:entity" element={<MasterDataPage />} />

        {/* Users - pindah ke dalam Master Data sebagai tab */}
        <Route path="users" element={<Navigate to="/master-data" replace />} />
        <Route path="users/list" element={<Navigate to="/master-data" replace />} />
        <Route path="users/new" element={<Navigate to="/master-data" replace />} />
        <Route path="users/:id" element={<Navigate to="/master-data" replace />} />
        <Route path="users/:id/edit" element={<Navigate to="/master-data" replace />} />

        {/* Audit — hanya Super Admin */}
        <Route path="audit" element={<AuditPageSuperAdmin />} />
        <Route path="audit/log" element={<AuditLogPageSuperAdmin />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Configuration — berdasarkan permission config:access */}
        <Route path="config" element={<ConfigDashboardPage />} />
        <Route path="config/org" element={<ConfigOrgPage />} />
        <Route path="config/status" element={<ConfigStatusPage />} />
        <Route path="config/notifications" element={<ConfigNotifTemplatePage />} />
        <Route path="config/sla" element={<ConfigSlaPage />} />
        <Route path="config/roles" element={<Navigate to="/config/access-control" replace />} />
        <Route path="config/targets" element={<ConfigTargetsPage />} />
        <Route path="config/workflow" element={<ConfigWorkflowPage />} />
        <Route path="config/integration" element={<ConfigIntegrationPage />} />
        <Route path="config/upload" element={<ConfigUploadPage />} />
        <Route path="config/period" element={<ConfigPeriodPage />} />
        <Route path="config/question-types" element={<ConfigQuestionTypesPage />} />
        <Route path="config/access-control" element={<ConfigAccessControlPage />} />
        <Route path="config/input-options" element={<ConfigInputPage />} />

        {/* Error pages */}
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="500" element={<ServerErrorPage />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
