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
const DashboardPage = LazyLoadPermission(lazy(() => import('@/features/dashboard/DashboardPage')), ['dashboard_view']);

// Prospects
const ProspectsPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectsPage')), ['prospek_view']);
const ProspectFormPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectFormPage')), ['prospek_view']);
const ProspectDetailPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectDetailPage')), ['prospek_view']);

// Projects
const ProjectListPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectListPage')), ['proyek_view']);
const ProjectFormPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectFormPage')), ['proyek_view']);
const ProjectDetailPage = LazyLoadPermission(lazy(() => import('@/features/projects/ProjectDetailPage')), ['proyek_view']);

// Approvals
const ApprovalInboxPage = LazyLoadPermission(lazy(() => import('@/features/approvals/ApprovalInboxPage')), ['approval_view']);

// KPI → moved under Reports
const KPIDashboardPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIDashboardPage')), ['laporan_view']);
const KPIProgressPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPIProgressPage')), ['laporan_view']);
const KPITargetsPage = LazyLoadPermission(lazy(() => import('@/features/kpi/KPITargetsPage')), ['laporan_view']);

// Reports
const WinLossReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/WinLossReportPage')), ['laporan_view']);
const PipelineReportPage = LazyLoadPermission(lazy(() => import('@/features/reports/PipelineReportPage')), ['laporan_view']);
const ReportsIndexPage = LazyLoadPermission(lazy(() => import('@/features/reports/ReportsIndexPage')), ['laporan_view']);
const CalendarPage = LazyLoadPermission(lazy(() => import('@/features/reports/CalendarPage')), ['laporan_view']);

// Master Data
const MasterDataPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterDataPage')), ['master_data']);
const MasterCustomerPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCustomerPage')), ['master_data']);
const MasterCompetitorPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCompetitorPage')), ['master_data']);
const MasterCategoryPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterCategoryPage')), ['master_data']);
const MasterDocTypePage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterDocTypePage')), ['master_data']);
const MasterQuestionPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterQuestionPage')), ['master_data']);
const MasterHolidayPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterHolidayPage')), ['master_data']);
const MasterLossReasonPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterLossReasonPage')), ['master_data']);
const MasterPeriodPage = LazyLoadPermission(lazy(() => import('@/features/master-data/MasterPeriodPage')), ['master_data']);

// Audit — hanya Super Admin
const AuditPageSuperAdmin = LazyLoadRole(lazy(() => import('@/features/audit/AuditPage')), ['Super Admin']);
const AuditLogPageSuperAdmin = LazyLoadRole(lazy(() => import('@/features/audit/AuditLogPage')), ['Super Admin']);

// Notifications
const NotificationsPage = LazyLoad(lazy(() => import('@/features/notifications/NotificationsPage')));

// Profile
const ProfilePage = LazyLoad(lazy(() => import('@/features/profile/ProfilePage')));

// Config — hanya Super Admin
const ConfigDashboardPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigDashboardPage')), ['config_access']);
const ConfigOrgPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigOrgPage')), ['config_access']);
const ConfigStatusPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigStatusPage')), ['config_access']);
const ConfigNotifTemplatePage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigNotifTemplatePage')), ['config_access']);
const ConfigSlaPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigSlaPage')), ['config_access']);
const ConfigRolesPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigRolesPage')), ['config_access']);
const ConfigTargetsPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigTargetsPage')), ['config_access']);
const ConfigWorkflowPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigWorkflowPage')), ['config_access']);
const ConfigIntegrationPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigIntegrationPage')), ['config_access']);
const ConfigUploadPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigUploadPage')), ['config_access']);
const ConfigPeriodPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigPeriodPage')), ['config_access']);
const ConfigQuestionTypesPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigQuestionTypesPage')), ['config_access']);

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
        <Route path="prospects/new" element={<ProspectFormPage />} />
        <Route path="prospects/:id" element={<ProspectDetailPage />} />
        <Route path="prospects/:id/edit" element={<ProspectFormPage />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:projectId/:tab?" element={<ProjectDetailPage />} />

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
        <Route path="master-data/users" element={<Navigate to="/master-data" replace />} />

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

        {/* Configuration — berdasarkan permission config_access */}
        <Route path="config" element={<ConfigDashboardPage />} />
        <Route path="config/org" element={<ConfigOrgPage />} />
        <Route path="config/status" element={<ConfigStatusPage />} />
        <Route path="config/notifications" element={<ConfigNotifTemplatePage />} />
        <Route path="config/sla" element={<ConfigSlaPage />} />
        <Route path="config/roles" element={<ConfigRolesPage />} />
        <Route path="config/targets" element={<ConfigTargetsPage />} />
        <Route path="config/workflow" element={<ConfigWorkflowPage />} />
        <Route path="config/integration" element={<ConfigIntegrationPage />} />
        <Route path="config/upload" element={<ConfigUploadPage />} />
        <Route path="config/period" element={<ConfigPeriodPage />} />
        <Route path="config/question-types" element={<ConfigQuestionTypesPage />} />

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
