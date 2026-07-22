import React, { Suspense, lazy, type ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, RoleRoute, PermissionRoute } from './guards';
import { PageLoader } from '@/components/layout';
import SeoHandler from '@/components/seo/SeoHandler';
import FeatureBoundary from '@/components/shared/FeatureBoundary';

const AppLayout = lazy(() => import('@/components/layout/AppLayout'));
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

// Analytics
const AnalyticsDashboardPage = LazyLoadPermission(lazy(() => import('@/features/analytics/AnalyticsDashboardPage')), ['analytics:view']);

// Prospects
const ProspectsPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectsPage')), ['prospect:read']);
const ProspectFormPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectFormPage')), ['prospect:read']);
const ProspectDetailPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectDetailPage')), ['prospect:read']);
const ProspectPipelinePage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectPipelinePage')), ['prospect:read']);
const ProspectQualificationPage = LazyLoadPermission(lazy(() => import('@/features/prospects/ProspectQualificationPage')), ['prospect:read']);

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

// Follow-Up
const FollowUpPage = LazyLoadPermission(lazy(() => import('@/features/follow-up/FollowUpPage')), ['prospect:read']);

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
const ConfigStageRulesPage = LazyLoadPermission(lazy(() => import('@/features/config/ConfigStageRulesPage')), ['config:access']);

// Error pages
const ForbiddenPage = LazyLoad(lazy(() => import('@/features/errors/ForbiddenPage')));
const NotFoundPage = LazyLoad(lazy(() => import('@/features/errors/NotFoundPage')));
const ServerErrorPage = LazyLoad(lazy(() => import('@/features/errors/ServerErrorPage')));

export default function AppRouter() {
  return (
    <>
      <SeoHandler />
      <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AppLayout /></Suspense></ProtectedRoute>}>
        <Route index element={<FeatureBoundary name="Profil"><ProfilePage /></FeatureBoundary>} />
      </Route>

      {/* Main app routes */}
      <Route path="/" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AppLayout /></Suspense></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<FeatureBoundary name="Dashboard"><DashboardPage /></FeatureBoundary>} />
        <Route path="analytics" element={<FeatureBoundary name="Analytics"><AnalyticsDashboardPage /></FeatureBoundary>} />

        {/* Prospects */}
        <Route path="prospects" element={<FeatureBoundary name="Prospek"><ProspectsPage /></FeatureBoundary>} />
        <Route path="prospects/pipeline" element={<FeatureBoundary name="Prospek"><ProspectPipelinePage /></FeatureBoundary>} />
        <Route path="prospects/qualification" element={<FeatureBoundary name="Prospek"><ProspectQualificationPage /></FeatureBoundary>} />
        <Route path="prospects/new" element={<FeatureBoundary name="Prospek"><ProspectFormPage /></FeatureBoundary>} />
        <Route path="prospects/:id" element={<FeatureBoundary name="Prospek"><ProspectDetailPage /></FeatureBoundary>} />
        <Route path="prospects/:id/edit" element={<FeatureBoundary name="Prospek"><ProspectFormPage /></FeatureBoundary>} />

        {/* Projects */}
        <Route path="projects" element={<FeatureBoundary name="Proyek"><ProjectListPage /></FeatureBoundary>} />
        <Route path="projects/new" element={<FeatureBoundary name="Proyek"><ProjectFormPage /></FeatureBoundary>} />
        <Route path="project/:projectId/:tab?" element={<FeatureBoundary name="Proyek"><ProjectDetailPage /></FeatureBoundary>} />
        <Route path="projects/:projectId/:tab?" element={<FeatureBoundary name="Proyek"><ProjectDetailPage /></FeatureBoundary>} />

        {/* Procurement */}
        <Route path="procurement" element={<FeatureBoundary name="Pengadaan"><ProcurementListPage /></FeatureBoundary>} />
        <Route path="procurement/new" element={<FeatureBoundary name="Pengadaan"><ProcurementFormPage /></FeatureBoundary>} />
        <Route path="procurement/:procurementId" element={<FeatureBoundary name="Pengadaan"><ProcurementDetailPage /></FeatureBoundary>} />
        <Route path="procurement/:procurementId/:tab" element={<FeatureBoundary name="Pengadaan"><ProcurementDetailPage /></FeatureBoundary>} />

        {/* Follow-Up */}
        <Route path="follow-up" element={<FeatureBoundary name="Follow-Up"><FollowUpPage /></FeatureBoundary>} />

        {/* Approvals */}
        <Route path="approvals" element={<FeatureBoundary name="Persetujuan"><ApprovalInboxPage /></FeatureBoundary>} />

        {/* Reports (includes KPI) */}
        <Route path="reports" element={<FeatureBoundary name="Laporan"><ReportsIndexPage /></FeatureBoundary>} />
        <Route path="reports/win-loss" element={<FeatureBoundary name="Laporan"><WinLossReportPage /></FeatureBoundary>} />
        <Route path="reports/pipeline" element={<FeatureBoundary name="Laporan"><PipelineReportPage /></FeatureBoundary>} />
        <Route path="reports/calendar" element={<FeatureBoundary name="Laporan"><CalendarPage /></FeatureBoundary>} />
        <Route path="reports/kpi" element={<FeatureBoundary name="KPI"><KPIDashboardPage /></FeatureBoundary>} />
        <Route path="reports/kpi/progress" element={<FeatureBoundary name="KPI"><KPIProgressPage /></FeatureBoundary>} />
        <Route path="reports/kpi/targets" element={<FeatureBoundary name="KPI"><KPITargetsPage /></FeatureBoundary>} />

        {/* Redirect old KPI routes to Reports */}
        <Route path="kpi" element={<Navigate to="/reports/kpi" replace />} />
        <Route path="kpi/dashboard" element={<Navigate to="/reports/kpi" replace />} />
        <Route path="kpi/progress" element={<Navigate to="/reports/kpi/progress" replace />} />
        <Route path="kpi/targets" element={<Navigate to="/reports/kpi/targets" replace />} />

        {/* Master Data */}
        <Route path="master-data" element={<FeatureBoundary name="Master Data"><MasterDataPage /></FeatureBoundary>} />
        <Route path="master-data/customers" element={<FeatureBoundary name="Master Data"><MasterCustomerPage /></FeatureBoundary>} />
        <Route path="master-data/competitors" element={<FeatureBoundary name="Master Data"><MasterCompetitorPage /></FeatureBoundary>} />
        <Route path="master-data/categories" element={<FeatureBoundary name="Master Data"><MasterCategoryPage /></FeatureBoundary>} />
        <Route path="master-data/document-types" element={<FeatureBoundary name="Master Data"><MasterDocTypePage /></FeatureBoundary>} />
        <Route path="master-data/questions" element={<FeatureBoundary name="Master Data"><MasterQuestionPage /></FeatureBoundary>} />
        <Route path="master-data/holidays" element={<FeatureBoundary name="Master Data"><MasterHolidayPage /></FeatureBoundary>} />
        <Route path="master-data/loss-reasons" element={<FeatureBoundary name="Master Data"><MasterLossReasonPage /></FeatureBoundary>} />
        <Route path="master-data/periods" element={<FeatureBoundary name="Master Data"><MasterPeriodPage /></FeatureBoundary>} />
        <Route path="master-data/:entity" element={<FeatureBoundary name="Master Data"><MasterDataPage /></FeatureBoundary>} />

        {/* Users - pindah ke dalam Master Data sebagai tab */}
        <Route path="users" element={<Navigate to="/master-data" replace />} />
        <Route path="users/list" element={<Navigate to="/master-data" replace />} />
        <Route path="users/new" element={<Navigate to="/master-data" replace />} />
        <Route path="users/:id" element={<Navigate to="/master-data" replace />} />
        <Route path="users/:id/edit" element={<Navigate to="/master-data" replace />} />

        {/* Audit — hanya Super Admin */}
        <Route path="audit" element={<FeatureBoundary name="Audit"><AuditPageSuperAdmin /></FeatureBoundary>} />
        <Route path="audit/log" element={<FeatureBoundary name="Audit"><AuditLogPageSuperAdmin /></FeatureBoundary>} />

        {/* Notifications */}
        <Route path="notifications" element={<FeatureBoundary name="Notifikasi"><NotificationsPage /></FeatureBoundary>} />

        {/* Configuration — berdasarkan permission config:access */}
        <Route path="config" element={<FeatureBoundary name="Konfigurasi"><ConfigDashboardPage /></FeatureBoundary>} />
        <Route path="config/org" element={<FeatureBoundary name="Konfigurasi"><ConfigOrgPage /></FeatureBoundary>} />
        <Route path="config/status" element={<FeatureBoundary name="Konfigurasi"><ConfigStatusPage /></FeatureBoundary>} />
        <Route path="config/notifications" element={<FeatureBoundary name="Konfigurasi"><ConfigNotifTemplatePage /></FeatureBoundary>} />
        <Route path="config/sla" element={<FeatureBoundary name="Konfigurasi"><ConfigSlaPage /></FeatureBoundary>} />
        <Route path="config/roles" element={<Navigate to="/config/access-control" replace />} />
        <Route path="config/targets" element={<FeatureBoundary name="Konfigurasi"><ConfigTargetsPage /></FeatureBoundary>} />
        <Route path="config/workflow" element={<FeatureBoundary name="Konfigurasi"><ConfigWorkflowPage /></FeatureBoundary>} />
        <Route path="config/integration" element={<FeatureBoundary name="Konfigurasi"><ConfigIntegrationPage /></FeatureBoundary>} />
        <Route path="config/upload" element={<FeatureBoundary name="Konfigurasi"><ConfigUploadPage /></FeatureBoundary>} />
        <Route path="config/period" element={<FeatureBoundary name="Konfigurasi"><ConfigPeriodPage /></FeatureBoundary>} />
        <Route path="config/question-types" element={<FeatureBoundary name="Konfigurasi"><ConfigQuestionTypesPage /></FeatureBoundary>} />
        <Route path="config/access-control" element={<FeatureBoundary name="Konfigurasi"><ConfigAccessControlPage /></FeatureBoundary>} />
        <Route path="config/input-options" element={<FeatureBoundary name="Konfigurasi"><ConfigInputPage /></FeatureBoundary>} />
        <Route path="config/stage-rules" element={<FeatureBoundary name="Konfigurasi"><ConfigStageRulesPage /></FeatureBoundary>} />

        {/* Error pages */}
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="500" element={<ServerErrorPage />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
