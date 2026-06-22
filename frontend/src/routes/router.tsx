import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './guards';
import { AppLayout } from '@/components/layout';
import { PageLoader } from '@/components/layout';
import { withPageProps } from './page-adapter';

const LazyLoad = (Component: React.ComponentType) => {
  const Wrapped = withPageProps(Component);
  return (props: Record<string, unknown>) => (
    <Suspense fallback={<PageLoader />}>
      <Wrapped {...props} />
    </Suspense>
  );
};

const DashboardPage = LazyLoad(lazy(() => import('@/features/dashboard/DashboardPage')));
const ProspectsPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectsPage')));
const ProspectFormPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectFormPage')));
const ProspectDetailPage = LazyLoad(lazy(() => import('@/features/prospects/ProspectDetailPage')));
const ProjectListPage = LazyLoad(lazy(() => import('@/features/projects/ProjectListPage')));
const ProjectFormPage = LazyLoad(lazy(() => import('@/features/projects/ProjectFormPage')));
const ProjectDetailPage = LazyLoad(lazy(() => import('@/features/projects/ProjectDetailPage')));
const ApprovalInboxPage = LazyLoad(lazy(() => import('@/features/approvals/ApprovalInboxPage')));
const KpiPage = LazyLoad(lazy(() => import('@/features/kpi/KpiPage')));
const ReportsPage = LazyLoad(lazy(() => import('@/features/reports/ReportsPage')));
const MasterDataPage = LazyLoad(lazy(() => import('@/features/master-data/MasterDataPage')));
const UsersPage = LazyLoad(lazy(() => import('@/features/users/UsersPage')));
const AuditPage = LazyLoad(lazy(() => import('@/features/audit/AuditPage')));
const NotificationsPage = LazyLoad(lazy(() => import('@/features/notifications/NotificationsPage')));
const ProfilePage = LazyLoad(lazy(() => import('@/features/profile/ProfilePage')));
const LoginPage = LazyLoad(lazy(() => import('@/features/auth/LoginPage')));
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

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<ProfilePage />} />
      </Route>
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="prospects" element={<ProspectsPage />} />
        <Route path="prospects/new" element={<ProspectFormPage />} />
        <Route path="prospects/:id" element={<ProspectDetailPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="project/:projectId/:tab?" element={<ProjectDetailPage />} />
        <Route path="approvals" element={<ApprovalInboxPage />} />
        <Route path="kpi" element={<KpiPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
