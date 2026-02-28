import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "@/layouts/AppShell";
import AuthLayout from "@/layouts/AuthLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import NotFoundPage from "@/pages/system/NotFoundPage";

const lazyPage = (loader: () => Promise<{ default: ComponentType }>) => async () => {
  const module = await loader();
  return { Component: module.default };
};

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", lazy: lazyPage(() => import("@/pages/dashboard/DashboardPage")) },
      { path: "/profile", lazy: lazyPage(() => import("@/pages/auth/ProfilePage")) },
      { path: "/forbidden", lazy: lazyPage(() => import("@/pages/system/ForbiddenPage")) },

      { path: "/identity/users", lazy: lazyPage(() => import("@/pages/identity/UsersPage")) },
      { path: "/identity/roles", element: <Navigate to="/admin/iam/roles" replace /> },
      { path: "/admin/iam/roles", lazy: lazyPage(() => import("@/pages/identity/RolesPage")) },
      { path: "/identity/permissions", lazy: lazyPage(() => import("@/pages/identity/PermissionsPage")) },
      { path: "/identity/sessions", lazy: lazyPage(() => import("@/pages/identity/SessionsPage")) },
      { path: "/identity/mfa-settings", lazy: lazyPage(() => import("@/pages/identity/MFASettingsPage")) },
      { path: "/identity/ip-allowlist", lazy: lazyPage(() => import("@/pages/identity/IPAllowlistPage")) },

      { path: "/customer/tenants", lazy: lazyPage(() => import("@/pages/customer/TenantsPage")) },
      { path: "/customer/companies", lazy: lazyPage(() => import("@/pages/customer/CompaniesPage")) },
      { path: "/customer/projects", lazy: lazyPage(() => import("@/pages/customer/ProjectsPage")) },
      { path: "/customer/datacenters", lazy: lazyPage(() => import("@/pages/customer/DatacentersPage")) },
      { path: "/customer/contact-types", lazy: lazyPage(() => import("@/pages/customer/ContactTypesPage")) },
      { path: "/customer/contacts", lazy: lazyPage(() => import("@/pages/customer/ContactsPage")) },
      { path: "/customer/portal-users", lazy: lazyPage(() => import("@/pages/customer/PortalUsersPage")) },
      { path: "/customer/portal-activities", lazy: lazyPage(() => import("@/pages/customer/PortalActivitiesPage")) },

      { path: "/infrastructure/vms", lazy: lazyPage(() => import("@/pages/infrastructure/VirtualMachinesPage")) },
      {
        path: "/infrastructure/vms/new",
        lazy: lazyPage(() => import("@/pages/infrastructure/vm-wizard/VmCreateWizardPage")),
      },
      {
        path: "/infrastructure/vms/:vmId",
        lazy: lazyPage(() => import("@/pages/infrastructure/vm-detail/VmDetailPage")),
      },
      { path: "/infrastructure/templates", lazy: lazyPage(() => import("@/pages/infrastructure/TemplatesPage")) },
      {
        path: "/infrastructure/bulk-operations",
        lazy: lazyPage(() => import("@/pages/infrastructure/BulkOperationsPage")),
      },
      { path: "/infrastructure/iso-images", lazy: lazyPage(() => import("@/pages/infrastructure/ISOManagementPage")) },

      { path: "/backup/policies", lazy: lazyPage(() => import("@/pages/backup/BackupPoliciesPage")) },
      { path: "/backup/runs", lazy: lazyPage(() => import("@/pages/backup/BackupRunsPage")) },
      { path: "/backup/dr-status", lazy: lazyPage(() => import("@/pages/backup/DRStatusPage")) },
      { path: "/backup/replication", lazy: lazyPage(() => import("@/pages/backup/ReplicationStatusPage")) },

      { path: "/monitoring/metrics", lazy: lazyPage(() => import("@/pages/monitoring/MetricsDashboardPage")) },
      { path: "/monitoring/alerts", lazy: lazyPage(() => import("@/pages/monitoring/AlertsPage")) },
      { path: "/monitoring/audit-logs", lazy: lazyPage(() => import("@/pages/monitoring/AuditLogsPage")) },

      { path: "/admin/service-accesses", lazy: lazyPage(() => import("@/pages/admin/ServiceAccessesPage")) },
      { path: "/admin/monitoring-accesses", lazy: lazyPage(() => import("@/pages/admin/MonitoringAccessesPage")) },
      { path: "/admin/monitoring-providers", lazy: lazyPage(() => import("@/pages/admin/MonitoringProvidersPage")) },
      { path: "/admin/backup-providers", lazy: lazyPage(() => import("@/pages/admin/BackupProvidersPage")) },
      { path: "/admin/network-providers", lazy: lazyPage(() => import("@/pages/admin/NetworkProvidersPage")) },
      { path: "/admin/backup-reporters", lazy: lazyPage(() => import("@/pages/admin/BackupReportersPage")) },
      { path: "/admin/notifications", lazy: lazyPage(() => import("@/pages/admin/NotificationsPage")) },
      { path: "/admin/operations", lazy: lazyPage(() => import("@/pages/admin/OperationsPage")) },
      { path: "/admin/quotas", lazy: lazyPage(() => import("@/pages/admin/QuotasPage")) },
      { path: "/admin/approvals", lazy: lazyPage(() => import("@/pages/admin/ApprovalsPage")) },
      { path: "/admin/approval-policies", lazy: lazyPage(() => import("@/pages/admin/ApprovalPoliciesPage")) },
      { path: "/admin/audit-export", lazy: lazyPage(() => import("@/pages/admin/AuditExportPage")) },
      { path: "/admin/system-events", lazy: lazyPage(() => import("@/pages/admin/SystemEventsPage")) },
      { path: "/admin/settings", lazy: lazyPage(() => import("@/pages/admin/SettingsPage")) },
      { path: "/admin/general-settings", lazy: lazyPage(() => import("@/pages/admin/SettingsPage")) },

      { path: "/my/overview", lazy: lazyPage(() => import("@/pages/tenant/overview/TenantOverviewPage")) },
      { path: "/my/vms", lazy: lazyPage(() => import("@/pages/tenant/MyVMsPage")) },
      { path: "/my/backups", lazy: lazyPage(() => import("@/pages/tenant/MyBackupsPage")) },
      { path: "/my/metrics", lazy: lazyPage(() => import("@/pages/tenant/MyMetricsPage")) },
      { path: "/my/network", lazy: lazyPage(() => import("@/pages/tenant/MyNetworkPage")) },
      { path: "/my/activities", lazy: lazyPage(() => import("@/pages/tenant/MyActivitiesPage")) },
      { path: "*", element: <Navigate to="/not-found" replace /> },
    ],
  },
  { path: "/not-found", element: <NotFoundPage /> },
  { path: "*", element: <Navigate to="/not-found" replace /> },
]);
