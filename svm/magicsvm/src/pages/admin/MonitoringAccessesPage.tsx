import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, PlayCircle } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityPage } from "@/components/shared/EntityPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RowActions } from "@/components/shared/RowActions";
import { CrudDrawer, type FieldConfig } from "@/components/shared/CrudDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCrudState } from "@/components/shared/useCrudState";
import { useOperations } from "@/hooks/useOperations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ApiRequestError,
  createMonitoringAccess,
  deleteMonitoringAccess,
  exportMonitoringAccessesCsv,
  getMonitoringAccess,
  listMonitoringAccesses,
  listProjects,
  listServiceAccesses,
  testMonitoringAccess,
  updateMonitoringAccess,
  type MonitoringAccessApiItem,
  type ProjectApiItem,
  type ServiceAccessApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus } from "@/types";

interface MonitoringAccessRow {
  id: string;
  name: string;
  provider_id: string;
  provider_name: string;
  service_access_id: string;
  service_access_name: string;
  scope: "TENANT" | "PROJECT";
  project_id: string | null;
  project_name: string | null;
  status: EntityStatus;
  api_status: "ACTIVE" | "DISABLED";
  health: EntityStatus;
  api_health: "OK" | "WARNING" | "ERROR" | "UNKNOWN";
  last_test_at: string | null;
  last_test_message: string | null;
  created_at: string;
  updated_at: string;
}

interface UiErrorState {
  message: string;
  requestId?: string | null;
}

const PROJECT_NONE_VALUE = "__NONE__";

const emptyDefaults = {
  name: "",
  provider_id: "",
  service_access_id: "",
  scope: "TENANT",
  project_id: PROJECT_NONE_VALUE,
  status: "ACTIVE",
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function serviceAccessLabel(item: ServiceAccessApiItem): string {
  const metadata = asRecord(item.metadata);
  const name = asString(metadata.name, "");
  if (name) {
    return name;
  }
  if (item.base_url) {
    return `${item.service_type} | ${item.base_url}`;
  }
  return item.service_type;
}

function mapStatus(status: MonitoringAccessApiItem["status"]): EntityStatus {
  return status === "DISABLED" ? "INACTIVE" : "ACTIVE";
}

function mapHealth(health: MonitoringAccessApiItem["health"]): EntityStatus {
  if (health === "OK") {
    return "HEALTHY";
  }
  if (health === "ERROR") {
    return "DOWN";
  }
  return "WARNING";
}

function mapMonitoringAccess(item: MonitoringAccessApiItem): MonitoringAccessRow {
  return {
    id: item.id,
    name: item.name,
    provider_id: item.provider.id,
    provider_name: item.provider.name,
    service_access_id: item.service_access.id,
    service_access_name: item.service_access.name,
    scope: item.scope,
    project_id: item.project?.id ?? null,
    project_name: item.project?.name ?? null,
    status: mapStatus(item.status),
    api_status: item.status,
    health: mapHealth(item.health),
    api_health: item.health,
    last_test_at: item.last_test_at,
    last_test_message: item.last_test_message,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function extractError(error: unknown): UiErrorState {
  if (error instanceof ApiRequestError) {
    if (error.status === 422 && Array.isArray((error.details as { detail?: unknown[] } | undefined)?.detail)) {
      const first = (error.details as { detail: Array<{ msg?: string }> }).detail[0];
      return { message: first?.msg || error.message, requestId: error.requestId };
    }
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "Unexpected error" };
}

export default function MonitoringAccessesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crud = useCrudState<MonitoringAccessRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();

  const canWrite = hasAnyPermission(["monitoring_accesses.write"]);
  const canDelete = hasAnyPermission(["monitoring_accesses.delete"]);
  const canTest = hasAnyPermission(["monitoring_accesses.test"]);

  const [data, setData] = useState<MonitoringAccessRow[]>([]);
  const [providers, setProviders] = useState<ServiceAccessApiItem[]>([]);
  const [serviceAccesses, setServiceAccesses] = useState<ServiceAccessApiItem[]>([]);
  const [projects, setProjects] = useState<ProjectApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [pageError, setPageError] = useState<UiErrorState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("pages.monitoringAccesses.validation.nameRequired")),
        provider_id: z.string().uuid(t("pages.monitoringAccesses.validation.providerRequired")),
        service_access_id: z.string().uuid(t("pages.monitoringAccesses.validation.serviceAccessRequired")),
        scope: z.enum(["TENANT", "PROJECT"]),
        project_id: z.string().optional(),
        status: z.enum(["ACTIVE", "DISABLED"]),
      }),
    [t],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "name",
        label: t("pages.monitoringAccesses.fields.name"),
        type: "text",
        placeholder: t("pages.monitoringAccesses.fields.namePlaceholder"),
      },
      {
        name: "provider_id",
        label: t("pages.monitoringAccesses.fields.provider"),
        type: "select",
        searchable: true,
        searchPlaceholder: t("common.search"),
        emptyText: t("common.noData"),
        options: providers.map((item) => ({ label: serviceAccessLabel(item), value: item.id })),
      },
      {
        name: "service_access_id",
        label: t("pages.monitoringAccesses.fields.serviceAccess"),
        type: "select",
        searchable: true,
        searchPlaceholder: t("common.search"),
        emptyText: t("common.noData"),
        options: serviceAccesses.map((item) => ({ label: serviceAccessLabel(item), value: item.id })),
      },
      {
        name: "scope",
        label: t("pages.monitoringAccesses.fields.scope"),
        type: "select",
        options: [
          { label: t("pages.monitoringAccesses.scopes.TENANT"), value: "TENANT" },
          { label: t("pages.monitoringAccesses.scopes.PROJECT"), value: "PROJECT" },
        ],
      },
      {
        name: "project_id",
        label: t("pages.monitoringAccesses.fields.project"),
        type: "select",
        searchable: true,
        searchPlaceholder: t("common.search"),
        emptyText: t("common.noData"),
        options: [
          { label: t("pages.monitoringAccesses.fields.noProject"), value: PROJECT_NONE_VALUE },
          ...projects.map((item) => ({ label: item.name, value: item.id })),
        ],
      },
      {
        name: "status",
        label: t("pages.monitoringAccesses.fields.status"),
        type: "select",
        options: [
          { label: t("pages.monitoringAccesses.filters.active"), value: "ACTIVE" },
          { label: t("pages.monitoringAccesses.filters.disabled"), value: "DISABLED" },
        ],
      },
    ],
    [projects, providers, serviceAccesses, t],
  );

  const withRequestId = (message: string, requestId?: string | null) =>
    requestId ? `${message} (${t("common.requestId")}: ${requestId})` : message;

  const load = async () => {
    const token = getAccessToken();
    if (!token) {
      setData([]);
      return;
    }

    setLoading(true);
    setPageError(null);
    try {
      const [monitoringAccessResponse, monitoringServiceAccesses, projectsResponse] = await Promise.all([
        listMonitoringAccesses(token, {
          page: 1,
          pageSize: 100,
          q: query || undefined,
          providerId: providerFilter === "all" ? undefined : providerFilter,
          status: statusFilter === "all" ? undefined : (statusFilter as "ACTIVE" | "DISABLED"),
          scope: scopeFilter === "all" ? undefined : (scopeFilter as "TENANT" | "PROJECT"),
          sortBy: "created_at",
          sortDir: "desc",
        }),
        listServiceAccesses(token, {
          page: 1,
          pageSize: 100,
          serviceType: "MONITORING",
        }),
        listProjects(token),
      ]);

      setProviders(monitoringServiceAccesses.items);
      setServiceAccesses(monitoringServiceAccesses.items);
      setProjects(projectsResponse.items);
      setData(monitoringAccessResponse.items.map(mapMonitoringAccess));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) {
        navigate("/forbidden", { replace: true });
        return;
      }
      const parsed = extractError(error);
      setPageError(parsed);
      toast({
        title: t("pages.monitoringAccesses.toasts.loadFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [providerFilter, query, scopeFilter, statusFilter]);

  const columns: ColumnDef<MonitoringAccessRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("pages.monitoringAccesses.columns.name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: "provider_name", header: t("pages.monitoringAccesses.columns.provider") },
      { accessorKey: "service_access_name", header: t("pages.monitoringAccesses.columns.serviceAccess") },
      {
        accessorKey: "scope",
        header: t("pages.monitoringAccesses.columns.scope"),
        cell: ({ row }) => t(`pages.monitoringAccesses.scopes.${row.original.scope}`),
      },
      {
        accessorKey: "project_name",
        header: t("pages.monitoringAccesses.columns.project"),
        cell: ({ row }) => row.original.project_name ?? "-",
      },
      {
        accessorKey: "status",
        header: t("pages.monitoringAccesses.columns.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "health",
        header: t("pages.monitoringAccesses.columns.health"),
        cell: ({ row }) => <StatusBadge status={row.original.health} />,
      },
      {
        accessorKey: "last_test_at",
        header: t("pages.monitoringAccesses.columns.lastTest"),
        cell: ({ row }) => (row.original.last_test_at ? new Date(row.original.last_test_at).toLocaleString() : t("pages.monitoringAccesses.columns.never")),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 140,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {canTest && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={t("pages.monitoringAccesses.actions.test")}
                onClick={() => void handleTest(row.original)}
              >
                <PlayCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            <RowActions
              onView={() => void handleOpenDetail("view", row.original)}
              onEdit={canWrite ? () => void handleOpenDetail("edit", row.original) : undefined}
              onDelete={canDelete ? () => crud.openDelete(row.original) : undefined}
            />
          </div>
        ),
      },
    ],
    [canDelete, canTest, canWrite, crud, t],
  );

  const handleOpenDetail = async (mode: "view" | "edit", row: MonitoringAccessRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const latest = await getMonitoringAccess(token, row.id);
      const mapped = mapMonitoringAccess(latest);
      if (mode === "view") {
        crud.openView(mapped);
      } else {
        crud.openEdit(mapped);
      }
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.monitoringAccesses.toasts.getFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    }
  };

  const handleTest = async (row: MonitoringAccessRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const result = await testMonitoringAccess(token, row.id);
      addOperation("Test Monitoring Access", "Monitoring Access", row.name);
      toast({
        title: result.ok ? t("pages.monitoringAccesses.toasts.testOk") : t("pages.monitoringAccesses.toasts.testFailed"),
        description: result.latency_ms
          ? `${result.message} (${result.latency_ms} ms)`
          : result.message,
      });
      await load();
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.monitoringAccesses.toasts.testFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      await exportMonitoringAccessesCsv(token, {
        q: query || undefined,
        providerId: providerFilter === "all" ? undefined : providerFilter,
        status: statusFilter === "all" ? undefined : (statusFilter as "ACTIVE" | "DISABLED"),
        scope: scopeFilter === "all" ? undefined : (scopeFilter as "TENANT" | "PROJECT"),
      });
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.monitoringAccesses.toasts.exportFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    }
  };

  const defaultValues = crud.selectedItem
    ? {
        name: crud.selectedItem.name,
        provider_id: crud.selectedItem.provider_id,
        service_access_id: crud.selectedItem.service_access_id,
        scope: crud.selectedItem.scope,
        project_id: crud.selectedItem.project_id ?? PROJECT_NONE_VALUE,
        status: crud.selectedItem.api_status,
      }
    : emptyDefaults;

  return (
    <>
      {pageError && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{withRequestId(pageError.message, pageError.requestId)}</AlertDescription>
        </Alert>
      )}
      <EntityPage<MonitoringAccessRow>
        title={t("pages.monitoringAccesses.title")}
        columns={columns}
        data={data}
        loading={loading}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel={t("pages.monitoringAccesses.createLabel")}
        searchKey="name"
        searchPlaceholder={t("pages.monitoringAccesses.searchPlaceholder")}
        onRefresh={() => void load()}
        extraActions={
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => void handleExport()}>
            <Download className="h-3.5 w-3.5" />
            {t("common.export")}
          </Button>
        }
        toolbar={
          <div className="flex items-center gap-2">
            <Input
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder={t("pages.monitoringAccesses.searchPlaceholder")}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.monitoringAccesses.filters.allStatuses")}</SelectItem>
                <SelectItem value="ACTIVE">{t("pages.monitoringAccesses.filters.active")}</SelectItem>
                <SelectItem value="DISABLED">{t("pages.monitoringAccesses.filters.disabled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.monitoringAccesses.filters.allProviders")}</SelectItem>
                {providers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {serviceAccessLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.monitoringAccesses.filters.allScopes")}</SelectItem>
                <SelectItem value="TENANT">{t("pages.monitoringAccesses.scopes.TENANT")}</SelectItem>
                <SelectItem value="PROJECT">{t("pages.monitoringAccesses.scopes.PROJECT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <CrudDrawer
        open={crud.drawerOpen}
        onOpenChange={crud.setDrawerOpen}
        mode={crud.mode}
        title={t("pages.monitoringAccesses.drawerTitle")}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={submitting}
        onSubmit={async (values) => {
          const token = getAccessToken();
          if (!token) {
            return;
          }

          const projectId = values.scope === "PROJECT" && values.project_id !== PROJECT_NONE_VALUE ? values.project_id : null;
          if (values.scope === "PROJECT" && !projectId) {
            toast({
              title: t("pages.monitoringAccesses.toasts.saveFailed"),
              description: t("pages.monitoringAccesses.validation.projectRequired"),
              variant: "destructive",
            });
            return;
          }
          if (values.scope === "TENANT" && projectId) {
            toast({
              title: t("pages.monitoringAccesses.toasts.saveFailed"),
              description: t("pages.monitoringAccesses.validation.projectMustBeEmpty"),
              variant: "destructive",
            });
            return;
          }
          const payload = {
            name: String(values.name),
            provider_id: String(values.provider_id),
            service_access_id: String(values.service_access_id),
            scope: values.scope as "TENANT" | "PROJECT",
            project_id: projectId,
            status: values.status as "ACTIVE" | "DISABLED",
          };

          setSubmitting(true);
          try {
            if (crud.mode === "create") {
              await createMonitoringAccess(token, payload);
              addOperation("Create Monitoring Access", "Monitoring Access", payload.name);
            } else if (crud.mode === "edit" && crud.selectedItem) {
              await updateMonitoringAccess(token, crud.selectedItem.id, payload);
              addOperation("Update Monitoring Access", "Monitoring Access", payload.name);
            }
            crud.closeDrawer();
            await load();
          } catch (error) {
            if (error instanceof ApiRequestError && error.status === 403) {
              navigate("/forbidden", { replace: true });
              return;
            }
            const parsed = extractError(error);
            toast({
              title: t("pages.monitoringAccesses.toasts.saveFailed"),
              description: withRequestId(parsed.message, parsed.requestId),
              variant: "destructive",
            });
          } finally {
            setSubmitting(false);
          }
        }}
      />
      <ConfirmDialog
        open={crud.deleteOpen}
        onOpenChange={crud.setDeleteOpen}
        title={t("pages.monitoringAccesses.delete.title")}
        description={t("pages.monitoringAccesses.delete.description", { name: crud.deleteTarget?.name ?? "" })}
        variant="destructive"
        confirmLabel={t("common.delete")}
        onConfirm={async () => {
          const token = getAccessToken();
          if (!token || !crud.deleteTarget) {
            return;
          }
          try {
            await deleteMonitoringAccess(token, crud.deleteTarget.id);
            addOperation("Delete Monitoring Access", "Monitoring Access", crud.deleteTarget.name);
            crud.closeDelete();
            await load();
          } catch (error) {
            const parsed = extractError(error);
            toast({
              title: t("pages.monitoringAccesses.toasts.deleteFailed"),
              description: withRequestId(parsed.message, parsed.requestId),
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
