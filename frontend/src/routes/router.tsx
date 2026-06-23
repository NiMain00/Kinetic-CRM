import React, { Suspense, lazy, type ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, RoleRoute } from './guards';
import { AppLayout } from '@/components/layout';
import { PageLoader } from '@/components/layout';
import { withPageProps } from './page-adapter';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

const LazyLoad = (Component: ComponentType<any>) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Wrapped {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

const LazyLoadRole = (Component: ComponentType<any>, roles: string[]) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <RoleRoute roles={roles}>
          <Wrapped {...props} />
        </RoleRoute>
      </Suspense>
    </ErrorBoundary>
  );
};

// Auth pages
const LoginPage = LazyLoad(lazy(() => import('@/features/auth/LoginPage')));
const ForgotPasswordPage = LazyLoad(lazy(() => import('@/features/auth/ForgotPasswordPage')));
const ResetPasswordPage = LazyLoad(lazy(() => import('@/features/auth/ResetPasswordPage')));

// Dashboard
const DashboardPage = LazyLoad(lazy(() => import('@/features/dashboard/DashboardPage')));

// Prospects
const ProspectsPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectsPage')));
const ProspectFormPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectFormPage')));
const ProspectDetailPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectDetailPage')));

// Projects
const ProjectListPage = LazyLoad(lazy(() => import('@/features/projects/ProjectListPage')));
const ProjectFormPage = LazyLoad(lazy(() => import('@/features/projects/ProjectFormPage')));
const ProjectDetailPage = LazyLoad(lazy(() => import('@/features/projects/ProjectDetailPage')));

// Approvals
const ApprovalInboxPage = LazyLoad(lazy(() => import('@/features/approvals/ApprovalInboxPage')));

// KPI → moved under Reports
const KPIDashboardPage = LazyLoad(lazy(() => import('@/features/kpi/KPIDashboardPage')));
const KPIProgressPage = LazyLoad(lazy(() => import('@/features/kpi/KPIProgressPage')));
const KPITargetsPage = LazyLoad(lazy(() => import('@/features/kpi/KPITargetsPage')));

// Reports
const WinLossReportPage = LazyLoad(lazy(() => import('@/features/reports/WinLossReportPage')));
const PipelineReportPage = LazyLoad(lazy(() => import('@/features/reports/PipelineReportPage')));
const ReportsIndexPage = LazyLoad(lazy(() => import('@/features/reports/ReportsIndexPage')));

// Master Data
const MasterDataPage = LazyLoad(lazy(() => import('@/features/master-data/MasterDataPage')));
const MasterCustomerPage = LazyLoad(lazy(() => import('@/features/master-data/MasterCustomerPage')));
const MasterCompetitorPage = LazyLoad(lazy(() => import('@/features/master-data/MasterCompetitorPage')));
const MasterCategoryPage = LazyLoad(lazy(() => import('@/features/master-data/MasterCategoryPage')));
const MasterDocTypePage = LazyLoad(lazy(() => import('@/features/master-data/MasterDocTypePage')));
const MasterQuestionPage = LazyLoad(lazy(() => import('@/features/master-data/MasterQuestionPage')));
const MasterHolidayPage = LazyLoad(lazy(() => import('@/features/master-data/MasterHolidayPage')));
const MasterLossReasonPage = LazyLoad(lazy(() => import('@/features/master-data/MasterLossReasonPage')));
const MasterPeriodPage = LazyLoad(lazy(() => import('@/features/master-data/MasterPeriodPage')));

// Users
const UsersPage = LazyLoad(lazy(() => import('@/features/users/UsersPage')));
const UserListPage = LazyLoad(lazy(() => import('@/features/users/UserListPage')));
const UserDetailPage = LazyLoad(lazy(() => import('@/features/users/UserDetailPage')));
const UserFormPage = LazyLoad(lazy(() => import('@/features/users/UserFormPage')));

// Audit
const AuditPage = LazyLoad(lazy(() => import('@/features/audit/AuditPage')));
const AuditLogPage = LazyLoad(lazy(() => import('@/features/audit/AuditLogPage')));

// Notifications
const NotificationsPage = LazyLoad(lazy(() => import('@/features/notifications/NotificationsPage')));

// Profile
const ProfilePage = LazyLoad(lazy(() => import('@/features/profile/ProfilePage')));

// Config
const ConfigDashboardPage = LazyLoad(lazy(() => import('@/features/config/ConfigDashboardPage')));
const ConfigOrgPage = LazyLoad(lazy(() => import('@/features/config/ConfigOrgPage')));
const ConfigStatusPage = LazyLoad(lazy(() => import('@/features/config/ConfigStatusPage')));
const ConfigNotifTemplatePage = LazyLoad(lazy(() => import('@/features/config/ConfigNotifTemplatePage')));
const ConfigSlaPage = LazyLoad(lazy(() => import('@/features/config/ConfigSlaPage')));
const ConfigRolesPage = LazyLoad(lazy(() => import('@/features/config/ConfigRolesPage')));
const ConfigTargetsPage = LazyLoad(lazy(() => import('@/features/config/ConfigTargetsPage')));
const ConfigWorkflowPage = LazyLoad(lazy(() => import('@/features/config/ConfigWorkflowPage')));
const ConfigIntegrationPage = LazyLoad(lazy(() => import('@/features/config/ConfigIntegrationPage')));
const ConfigUploadPage = LazyLoad(lazy(() => import('@/features/config/ConfigUploadPage')));
const ConfigPeriodPage = LazyLoad(lazy(() => import('@/features/config/ConfigPeriodPage')));
const ConfigQuestionTypesPage = LazyLoad(lazy(() => import('@/features/config/ConfigQuestionTypesPage')));

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
        <Route path="project/:projectId/:tab?" element={<ProjectDetailPage />} />

        {/* Approvals */}
        <Route path="approvals" element={<ApprovalInboxPage />} />

        {/* Reports (includes KPI) */}
        <Route path="reports" element={<ReportsIndexPage />} />
        <Route path="reports/win-loss" element={<WinLossReportPage />} />
        <Route path="reports/pipeline" element={<PipelineReportPage />} />
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

        {/* Users */}
        <Route path="users" element={<UsersPage />} />
        <Route path="users/list" element={<UserListPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />

        {/* Audit */}
        <Route path="audit" element={<AuditPage />} />
        <Route path="audit/log" element={<AuditLogPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Configuration */}
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
