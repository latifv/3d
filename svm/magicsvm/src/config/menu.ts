import {
  Activity,
  ArrowLeftRight,
  Bell,
  BellRing,
  Building2,
  CheckCircle,
  Cog,
  Contact,
  Copy,
  Database,
  Download,
  Eye,
  FileBarChart,
  FileText,
  FolderOpen,
  Gauge,
  Globe,
  Key,
  Layers,
  LayoutDashboard,
  LineChart,
  Link,
  Map,
  Monitor,
  Network,
  Paintbrush,
  PlayCircle,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Upload,
  UserCircle,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";
import { isFeatureEnabled, type FeatureFlagKey } from "@/config/features";

export interface NavItem {
  label: string;
  labelKey?: string;
  path: string;
  icon: LucideIcon;
  badge?: "MOCK" | "NEW" | "COMING_SOON";
  roles?: Role[];
  requiredPermissions?: string[];
  featureFlag?: FeatureFlagKey;
  readOnly?: boolean;
}

export interface NavGroup {
  label: string;
  groupKey?: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const BASE_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    groupKey: "menu.group.operations",
    collapsible: false,
    defaultOpen: true,
    items: [
      { label: "Dashboard", labelKey: "menu.dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Operations", labelKey: "menu.operations", path: "/admin/operations", icon: Cog, requiredPermissions: ["operations.read"] },
      { label: "Events / Timeline", labelKey: "menu.eventsTimeline", path: "/admin/system-events", icon: Zap, requiredPermissions: ["events.read"] },
      {
        label: "Portal Activities",
        labelKey: "menu.portalActivities",
        path: "/customer/portal-activities",
        icon: Activity,
        requiredPermissions: ["portal_activities.read"],
        readOnly: true,
      },
      { label: "Approvals", labelKey: "menu.approvals", path: "/admin/approvals", icon: CheckCircle, requiredPermissions: ["approvals.read"] },
    ],
  },
  {
    label: "Resources",
    groupKey: "menu.group.resources",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Virtual Machines", labelKey: "menu.virtualMachines", path: "/infrastructure/vms", icon: Monitor, requiredPermissions: ["vms.read"] },
      { label: "VM Templates", labelKey: "menu.vmTemplates", path: "/infrastructure/templates", icon: Layers, requiredPermissions: ["vms.read"] },
      { label: "VM Bulk Create", labelKey: "menu.vmBulkCreate", path: "/infrastructure/bulk-operations", icon: Copy, requiredPermissions: ["vms.write"] },
      { label: "ISO Management", labelKey: "menu.isoManagement", path: "/infrastructure/iso-images", icon: Upload, requiredPermissions: ["isos.read"] },
      { label: "Backup Policies", labelKey: "menu.backupPolicies", path: "/backup/policies", icon: Database, requiredPermissions: ["backup_policies.read"] },
      { label: "Backup Runs", labelKey: "menu.backupRuns", path: "/backup/runs", icon: PlayCircle, requiredPermissions: ["backup_runs.read"] },
      {
        label: "Monitoring",
        labelKey: "menu.monitoring",
        path: "/monitoring/metrics",
        icon: LineChart,
        requiredPermissions: ["monitoring.read"],
        featureFlag: "FEATURE_MONITORING",
      },
      {
        label: "Alerts",
        labelKey: "menu.alerts",
        path: "/monitoring/alerts",
        icon: Bell,
        requiredPermissions: ["monitoring.read"],
        featureFlag: "FEATURE_ALERTS",
      },
      {
        label: "DR Status",
        labelKey: "menu.drStatus",
        path: "/backup/dr-status",
        icon: RefreshCw,
        requiredPermissions: ["backup_runs.read"],
        featureFlag: "FEATURE_DR",
      },
      {
        label: "Replication",
        labelKey: "menu.replication",
        path: "/backup/replication",
        icon: ArrowLeftRight,
        requiredPermissions: ["backup_runs.read"],
        featureFlag: "FEATURE_REPLICATION",
      },
    ],
  },
  {
    label: "Customers",
    groupKey: "menu.group.customers",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Tenants", labelKey: "menu.tenants", path: "/customer/tenants", icon: Building2, roles: ["SYSTEM_ADMIN"], requiredPermissions: ["tenants.read"] },
      { label: "Companies", labelKey: "menu.companies", path: "/customer/companies", icon: Building2, requiredPermissions: ["companies.read"] },
      { label: "Projects", labelKey: "menu.projects", path: "/customer/projects", icon: FolderOpen, requiredPermissions: ["projects.read"] },
      { label: "Portal Users", labelKey: "menu.portalUsers", path: "/customer/portal-users", icon: UserCircle, requiredPermissions: ["portal_users.read"] },
      { label: "Contacts", labelKey: "menu.contacts", path: "/customer/contacts", icon: Contact, requiredPermissions: ["contacts.read"] },
      { label: "Contact Types", labelKey: "menu.contactTypes", path: "/customer/contact-types", icon: Tag, requiredPermissions: ["contact_types.read"] },
    ],
  },
  {
    label: "Integrations",
    groupKey: "menu.group.integrations",
    collapsible: true,
    defaultOpen: false,
    items: [
      {
        label: "Datacenters",
        labelKey: "menu.datacenters",
        path: "/customer/datacenters",
        icon: Server,
        requiredPermissions: ["datacenters.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Service Accesses",
        labelKey: "menu.serviceAccesses",
        path: "/admin/service-accesses",
        icon: Link,
        requiredPermissions: ["service_accesses.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Monitoring Providers",
        labelKey: "menu.monitoringProviders",
        path: "/admin/monitoring-providers",
        icon: Eye,
        requiredPermissions: ["monitoring.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Backup Providers",
        labelKey: "menu.backupProviders",
        path: "/admin/backup-providers",
        icon: Database,
        requiredPermissions: ["backup_reporters.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Network Providers",
        labelKey: "menu.networkProviders",
        path: "/admin/network-providers",
        icon: Network,
        requiredPermissions: ["datacenters.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Monitoring Accesses",
        labelKey: "menu.monitoringAccesses",
        path: "/admin/monitoring-accesses",
        icon: LineChart,
        requiredPermissions: ["monitoring.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Backup Reporters",
        labelKey: "menu.backupReporters",
        path: "/admin/backup-reporters",
        icon: FileBarChart,
        requiredPermissions: ["backup_reporters.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
      {
        label: "Notifications",
        labelKey: "menu.notifications",
        path: "/admin/notifications",
        icon: BellRing,
        requiredPermissions: ["notifications.read"],
        featureFlag: "FEATURE_INTEGRATIONS_HUB",
      },
    ],
  },
  {
    label: "Security & Access",
    groupKey: "menu.group.securityAccess",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Users", labelKey: "menu.users", path: "/identity/users", icon: Users, requiredPermissions: ["users.read"] },
      {
        label: "Admin Roles",
        labelKey: "menu.adminRoles",
        path: "/admin/iam/roles",
        icon: ShieldCheck,
        roles: ["SYSTEM_ADMIN", "PLATFORM_ADMIN"],
        requiredPermissions: ["platform.iam.roles.read", "iam.roles.read", "roles.read"],
      },
      { label: "Permissions", labelKey: "menu.permissions", path: "/identity/permissions", icon: Key, requiredPermissions: ["roles.read"] },
      { label: "Sessions", labelKey: "menu.sessions", path: "/identity/sessions", icon: Monitor, requiredPermissions: ["sessions.read"] },
      { label: "MFA / OTP Settings", labelKey: "menu.mfaOtpSettings", path: "/identity/mfa-settings", icon: Shield, requiredPermissions: ["preferences.write"] },
      { label: "IP Allowlist", labelKey: "menu.ipAllowlist", path: "/identity/ip-allowlist", icon: Globe, requiredPermissions: ["preferences.write"] },
    ],
  },
  {
    label: "Settings",
    groupKey: "menu.group.settings",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Branding", labelKey: "menu.branding", path: "/admin/settings", icon: Paintbrush, requiredPermissions: ["preferences.write"] },
      { label: "Quotas", labelKey: "menu.quotas", path: "/admin/quotas", icon: Gauge, requiredPermissions: ["quotas.read"] },
      { label: "Approval Policies", labelKey: "menu.approvalPolicies", path: "/admin/approval-policies", icon: CheckCircle, requiredPermissions: ["approvals.read"] },
      { label: "Notifications", labelKey: "menu.notifications", path: "/admin/notifications", icon: BellRing, requiredPermissions: ["notifications.read"] },
      { label: "Backup Reporters", labelKey: "menu.backupReporters", path: "/admin/backup-reporters", icon: FileBarChart, requiredPermissions: ["backup_reporters.read"] },
      { label: "Audit Logs", labelKey: "menu.auditLogs", path: "/monitoring/audit-logs", icon: FileText, requiredPermissions: ["audit_logs.read"] },
      { label: "Audit Export", labelKey: "menu.auditExport", path: "/admin/audit-export", icon: Download, requiredPermissions: ["audit_logs.read"] },
      { label: "General", labelKey: "menu.general", path: "/admin/general-settings", icon: Settings, requiredPermissions: ["preferences.write"] },
    ],
  },
];

const TENANT_USER_GROUPS: NavGroup[] = [
  {
    label: "My Workspace",
    groupKey: "menu.group.myWorkspace",
    collapsible: false,
    defaultOpen: true,
    items: [
      { label: "Dashboard", labelKey: "menu.dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "My Infrastructure", labelKey: "menu.myInfrastructure", path: "/my/overview", icon: Map, requiredPermissions: ["vms.read"] },
      { label: "My VMs", labelKey: "menu.myVMs", path: "/my/vms", icon: Monitor, requiredPermissions: ["vms.read"] },
      { label: "My Backups", labelKey: "menu.myBackups", path: "/my/backups", icon: Database, requiredPermissions: ["backup_runs.read"] },
      {
        label: "My Metrics",
        labelKey: "menu.myMetrics",
        path: "/my/metrics",
        icon: LineChart,
        requiredPermissions: ["monitoring.read"],
        featureFlag: "FEATURE_MONITORING",
      },
      { label: "My Network", labelKey: "menu.myNetwork", path: "/my/network", icon: Network, requiredPermissions: ["datacenters.read"] },
      { label: "My Activities", labelKey: "menu.myActivities", path: "/my/activities", icon: Activity, requiredPermissions: ["portal_activities.read"] },
    ],
  },
];

type RouteRule = Pick<NavItem, "path" | "requiredPermissions" | "featureFlag" | "roles">;

const EXTRA_ROUTE_RULES: RouteRule[] = [
  { path: "/infrastructure/vms/new", requiredPermissions: ["vms.write"] },
  { path: "/infrastructure/vms/:vmId", requiredPermissions: ["vms.read"] },
  { path: "/profile" },
  { path: "/dashboard" },
];

function normalizePath(pathname: string): string {
  const value = pathname.trim();
  if (!value.startsWith("/")) {
    return `/${value}`;
  }
  return value;
}

function roleAllowed(rule: Pick<NavItem, "roles">, role: Role): boolean {
  if (!rule.roles || rule.roles.length === 0) {
    return true;
  }
  return rule.roles.includes(role);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions?: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  const permissionSet = new Set(userPermissions);
  return requiredPermissions.some((permission) => permissionSet.has(permission));
}

function isItemVisible(item: NavItem, role: Role, userPermissions: string[]): boolean {
  if (!roleAllowed(item, role)) {
    return false;
  }
  if (!isFeatureEnabled(item.featureFlag)) {
    return false;
  }
  return hasAnyPermission(userPermissions, item.requiredPermissions);
}

function getSourceGroups(role: Role): NavGroup[] {
  if (role === "TENANT_USER") {
    return TENANT_USER_GROUPS;
  }
  return BASE_GROUPS;
}

export function getNavForRole(role: Role, userPermissions: string[] = []): NavGroup[] {
  const sourceGroups = getSourceGroups(role);
  return sourceGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isItemVisible(item, role, userPermissions)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAllNavItems(role: Role, userPermissions: string[] = []): NavItem[] {
  return getNavForRole(role, userPermissions).flatMap((group) => group.items);
}

function getAllRouteRules(role: Role): RouteRule[] {
  const groupRules = getSourceGroups(role).flatMap((group) =>
    group.items.map((item) => ({
      path: item.path,
      requiredPermissions: item.requiredPermissions,
      featureFlag: item.featureFlag,
      roles: item.roles,
    })),
  );
  return [...groupRules, ...EXTRA_ROUTE_RULES];
}

function matchesRoute(rulePath: string, pathname: string): boolean {
  if (rulePath.includes(":")) {
    const base = rulePath.split("/:")[0];
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname === rulePath || pathname.startsWith(`${rulePath}/`);
}

export function getRouteRuleForPath(pathname: string, role: Role): RouteRule | undefined {
  const normalized = normalizePath(pathname);
  return getAllRouteRules(role)
    .filter((rule) => matchesRoute(rule.path, normalized))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function getRequiredPermissionsForPath(pathname: string, role: Role): string[] | undefined {
  return getRouteRuleForPath(pathname, role)?.requiredPermissions;
}

export function canAccessPath(pathname: string, role: Role, userPermissions: string[] = []): boolean {
  const rule = getRouteRuleForPath(pathname, role);
  if (!rule) {
    return true;
  }
  if (!roleAllowed(rule, role)) {
    return false;
  }
  if (!isFeatureEnabled(rule.featureFlag)) {
    return false;
  }
  return hasAnyPermission(userPermissions, rule.requiredPermissions);
}
