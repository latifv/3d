import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  createServiceAccess,
  deleteServiceAccess,
  getServiceAccess,
  listDatacenters,
  listServiceAccesses,
  updateServiceAccess,
  type DatacenterApiItem,
  type ServiceAccessApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus } from "@/types";

interface ServiceAccessRow {
  id: string;
  name: string;
  service_type: "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING";
  base_url: string;
  credential_ref: string;
  datacenter_id: string;
  datacenter_name: string;
  status: EntityStatus;
  api_status: "ACTIVE" | "PASSIVE";
  health_status: EntityStatus;
  api_health_status: "UNKNOWN" | "UP" | "DOWN";
  timeout_seconds: number;
  notes: string;
  created_at: string;
  updated_at: string;
  last_health_check_at: string | null;
}

interface UiErrorState {
  message: string;
  requestId?: string | null;
}

const emptyDefaults = {
  name: "",
  service_type: "VCENTER",
  base_url: "",
  credential_ref: "",
  datacenter_id: "",
  status: "ACTIVE",
  timeout_seconds: 30,
  notes: "",
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

function mapHealthStatus(status: ServiceAccessApiItem["health_status"]): EntityStatus {
  if (status === "UP") {
    return "HEALTHY";
  }
  if (status === "DOWN") {
    return "DOWN";
  }
  return "WARNING";
}

function mapServiceAccess(item: ServiceAccessApiItem, datacenterMap: Map<string, string>): ServiceAccessRow {
  const metadata = asRecord(item.metadata);
  return {
    id: item.id,
    name: asString(metadata.name, `${item.service_type}-${item.datacenter_id.slice(0, 8)}`),
    service_type: item.service_type,
    base_url: item.base_url,
    credential_ref: item.credential_ref,
    datacenter_id: item.datacenter_id,
    datacenter_name: datacenterMap.get(item.datacenter_id) ?? "-",
    status: item.status === "PASSIVE" ? "INACTIVE" : "ACTIVE",
    api_status: item.status,
    health_status: mapHealthStatus(item.health_status),
    api_health_status: item.health_status,
    timeout_seconds: item.timeout_seconds,
    notes: asString(metadata.notes, ""),
    created_at: item.created_at,
    updated_at: item.updated_at,
    last_health_check_at: item.last_health_check_at,
  };
}

function extractError(error: unknown): UiErrorState {
  if (error instanceof ApiRequestError) {
    if (error.status === 422 && Array.isArray((error.details as { detail?: unknown[] } | undefined)?.detail)) {
      const first = (error.details as { detail: Array<{ msg?: string }> }).detail[0];
      return {
        message: first?.msg || error.message,
        requestId: error.requestId,
      };
    }
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "Unexpected error" };
}

export default function ServiceAccessesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crud = useCrudState<ServiceAccessRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["service_accesses.write"]);

  const [data, setData] = useState<ServiceAccessRow[]>([]);
  const [datacenters, setDatacenters] = useState<DatacenterApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pageError, setPageError] = useState<UiErrorState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("pages.serviceAccesses.validation.nameRequired")),
        service_type: z.enum(["VCENTER", "NUTANIX", "NETBACKUP", "MONITORING"]),
        base_url: z.string().url(t("pages.serviceAccesses.validation.urlInvalid")),
        credential_ref: z.string().min(1, t("pages.serviceAccesses.validation.credentialRequired")),
        datacenter_id: z.string().uuid(t("pages.serviceAccesses.validation.datacenterRequired")),
        status: z.enum(["ACTIVE", "PASSIVE"]),
        timeout_seconds: z.coerce.number().int().min(1, t("pages.serviceAccesses.validation.timeoutInvalid")),
        notes: z.string().optional(),
      }),
    [t],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "name",
        label: t("pages.serviceAccesses.fields.name"),
        type: "text",
        placeholder: t("pages.serviceAccesses.fields.namePlaceholder"),
      },
      {
        name: "service_type",
        label: t("pages.serviceAccesses.fields.type"),
        type: "select",
        options: [
          { label: t("pages.serviceAccesses.types.VCENTER"), value: "VCENTER" },
          { label: t("pages.serviceAccesses.types.NUTANIX"), value: "NUTANIX" },
          { label: t("pages.serviceAccesses.types.NETBACKUP"), value: "NETBACKUP" },
          { label: t("pages.serviceAccesses.types.MONITORING"), value: "MONITORING" },
        ],
      },
      {
        name: "base_url",
        label: t("pages.serviceAccesses.fields.url"),
        type: "text",
        placeholder: "https://example.local",
      },
      {
        name: "credential_ref",
        label: t("pages.serviceAccesses.fields.credentialRef"),
        type: "text",
        placeholder: t("pages.serviceAccesses.fields.credentialRefPlaceholder"),
      },
      {
        name: "datacenter_id",
        label: t("pages.serviceAccesses.fields.datacenter"),
        type: "select",
        searchable: true,
        searchPlaceholder: t("common.search"),
        emptyText: t("common.noData"),
        options: datacenters.map((item) => ({ label: item.code, value: item.id })),
      },
      {
        name: "status",
        label: t("pages.serviceAccesses.fields.status"),
        type: "select",
        options: [
          { label: t("pages.serviceAccesses.filters.active"), value: "ACTIVE" },
          { label: t("pages.serviceAccesses.filters.passive"), value: "PASSIVE" },
        ],
      },
      {
        name: "timeout_seconds",
        label: t("pages.serviceAccesses.fields.timeoutSeconds"),
        type: "number",
        placeholder: "30",
      },
      {
        name: "notes",
        label: t("pages.serviceAccesses.fields.notes"),
        type: "textarea",
        placeholder: t("pages.serviceAccesses.fields.notesPlaceholder"),
      },
    ],
    [datacenters, t],
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
      const [datacenterResponse, serviceAccessResponse] = await Promise.all([
        listDatacenters(token, { page: 1, pageSize: 100, sortBy: "code", sortDir: "asc" }),
        listServiceAccesses(token, {
          page: 1,
          pageSize: 100,
          q: query || undefined,
          status: statusFilter === "all" ? undefined : (statusFilter as "ACTIVE" | "PASSIVE"),
          serviceType:
            typeFilter === "all" ? undefined : (typeFilter as "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING"),
        }),
      ]);

      const dcMap = new Map(datacenterResponse.items.map((item) => [item.id, item.code]));
      setDatacenters(datacenterResponse.items);
      setData(serviceAccessResponse.items.map((item) => mapServiceAccess(item, dcMap)));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) {
        navigate("/forbidden", { replace: true });
        return;
      }
      const parsed = extractError(error);
      setPageError(parsed);
      toast({
        title: t("pages.serviceAccesses.toasts.loadFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [query, statusFilter, typeFilter]);

  const columns: ColumnDef<ServiceAccessRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("pages.serviceAccesses.columns.name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: "service_type", header: t("pages.serviceAccesses.columns.type") },
      {
        accessorKey: "base_url",
        header: t("pages.serviceAccesses.columns.url"),
        cell: ({ row }) => (
          <span className="block max-w-[220px] truncate font-mono text-xs" title={row.original.base_url}>
            {row.original.base_url}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("pages.serviceAccesses.columns.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "health_status",
        header: t("pages.serviceAccesses.columns.health"),
        cell: ({ row }) => <StatusBadge status={row.original.health_status} />,
      },
      { accessorKey: "credential_ref", header: t("pages.serviceAccesses.columns.credentialRef") },
      { accessorKey: "datacenter_name", header: t("pages.serviceAccesses.columns.datacenter") },
      {
        accessorKey: "last_health_check_at",
        header: t("pages.serviceAccesses.columns.lastHealthCheck"),
        cell: ({ row }) =>
          row.original.last_health_check_at
            ? new Date(row.original.last_health_check_at).toLocaleString()
            : t("pages.serviceAccesses.columns.never"),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 100,
        cell: ({ row }) => (
          <RowActions
            onView={() => void handleOpenDetail("view", row.original)}
            onEdit={canWrite ? () => void handleOpenDetail("edit", row.original) : undefined}
            onDelete={canWrite ? () => crud.openDelete(row.original) : undefined}
          />
        ),
      },
    ],
    [canWrite, crud, t],
  );

  const handleOpenDetail = async (mode: "view" | "edit", row: ServiceAccessRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const latest = await getServiceAccess(token, row.id);
      const dcMap = new Map(datacenters.map((item) => [item.id, item.code]));
      const mapped = mapServiceAccess(latest, dcMap);
      if (mode === "view") {
        crud.openView(mapped);
      } else {
        crud.openEdit(mapped);
      }
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.serviceAccesses.toasts.getFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    }
  };

  const defaultValues = crud.selectedItem
    ? {
        name: crud.selectedItem.name,
        service_type: crud.selectedItem.service_type,
        base_url: crud.selectedItem.base_url,
        credential_ref: crud.selectedItem.credential_ref,
        datacenter_id: crud.selectedItem.datacenter_id,
        status: crud.selectedItem.api_status,
        timeout_seconds: crud.selectedItem.timeout_seconds,
        notes: crud.selectedItem.notes,
      }
    : emptyDefaults;

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-[240px]"
        placeholder={t("pages.serviceAccesses.searchPlaceholder")}
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.serviceAccesses.filters.allStatuses")}</SelectItem>
          <SelectItem value="ACTIVE">{t("pages.serviceAccesses.filters.active")}</SelectItem>
          <SelectItem value="PASSIVE">{t("pages.serviceAccesses.filters.passive")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="h-9 w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.serviceAccesses.filters.allTypes")}</SelectItem>
          <SelectItem value="VCENTER">{t("pages.serviceAccesses.types.VCENTER")}</SelectItem>
          <SelectItem value="NUTANIX">{t("pages.serviceAccesses.types.NUTANIX")}</SelectItem>
          <SelectItem value="NETBACKUP">{t("pages.serviceAccesses.types.NETBACKUP")}</SelectItem>
          <SelectItem value="MONITORING">{t("pages.serviceAccesses.types.MONITORING")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      {pageError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{withRequestId(pageError.message, pageError.requestId)}</AlertDescription>
        </Alert>
      )}

      <EntityPage<ServiceAccessRow>
        title={t("pages.serviceAccesses.title")}
        breadcrumbs={[
          { label: t("menu.dashboard"), href: "/" },
          { label: t("nav.adminSettings"), href: "/admin" },
          { label: t("pages.serviceAccesses.title") },
        ]}
        columns={columns}
        data={data}
        loading={loading}
        toolbar={toolbar}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel={t("pages.serviceAccesses.createLabel")}
        onRefresh={() => void load()}
      />

      <CrudDrawer
        open={crud.drawerOpen}
        onOpenChange={crud.setDrawerOpen}
        mode={crud.mode}
        title={t("pages.serviceAccesses.drawerTitle")}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={submitting}
        onSubmit={(values) => {
          const token = getAccessToken();
          if (!token) {
            return;
          }
          setSubmitting(true);
          setPageError(null);
          void (async () => {
            try {
              const payload = {
                datacenter_id: String(values.datacenter_id),
                service_type: String(values.service_type) as "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING",
                base_url: String(values.base_url),
                credential_ref: String(values.credential_ref),
                status: String(values.status) as "ACTIVE" | "PASSIVE",
                timeout_seconds: Number(values.timeout_seconds),
                metadata: {
                  name: String(values.name),
                  notes: values.notes ? String(values.notes) : null,
                },
              };

              if (crud.mode === "create") {
                await createServiceAccess(token, payload);
                addOperation(
                  t("pages.serviceAccesses.operations.create"),
                  t("pages.serviceAccesses.drawerTitle"),
                  payload.service_type,
                );
              } else if (crud.selectedItem) {
                await updateServiceAccess(token, crud.selectedItem.id, payload);
                addOperation(
                  t("pages.serviceAccesses.operations.update"),
                  t("pages.serviceAccesses.drawerTitle"),
                  payload.service_type,
                );
              }
              crud.closeDrawer();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              setPageError(parsed);
              toast({
                title: t("pages.serviceAccesses.toasts.saveFailed"),
                description: withRequestId(parsed.message, parsed.requestId),
                variant: "destructive",
              });
            } finally {
              setSubmitting(false);
            }
          })();
        }}
      />

      <ConfirmDialog
        open={crud.deleteOpen}
        onOpenChange={crud.setDeleteOpen}
        title={t("pages.serviceAccesses.delete.title")}
        description={t("pages.serviceAccesses.delete.description", { name: crud.deleteTarget?.name ?? "-" })}
        variant="destructive"
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          const token = getAccessToken();
          const target = crud.deleteTarget;
          if (!token || !target) {
            crud.closeDelete();
            return;
          }
          setSubmitting(true);
          setPageError(null);
          void (async () => {
            try {
              await deleteServiceAccess(token, target.id);
              addOperation(
                t("pages.serviceAccesses.operations.delete"),
                t("pages.serviceAccesses.drawerTitle"),
                target.name,
              );
              crud.closeDelete();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              setPageError(parsed);
              toast({
                title: t("pages.serviceAccesses.toasts.deleteFailed"),
                description: withRequestId(parsed.message, parsed.requestId),
                variant: "destructive",
              });
            } finally {
              setSubmitting(false);
            }
          })();
        }}
      />
    </>
  );
}
