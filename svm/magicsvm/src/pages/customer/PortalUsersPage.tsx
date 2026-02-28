import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  activatePortalUser,
  ApiRequestError,
  createPortalUser,
  exportPortalUsersCsv,
  getPortalUser,
  listCompanies,
  listPortalUsers,
  listRoles,
  suspendPortalUser,
  updatePortalUser,
  type CompanyApiItem,
  type PortalUserApiItem,
  type RoleApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus, Role } from "@/types";

interface PortalUserRow {
  id: string;
  username: string;
  full_name: string;
  email: string;
  company_id: string;
  company_name: string;
  role: Role;
  status: EntityStatus;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

interface UiErrorState {
  message: string;
  requestId?: string | null;
}

const emptyDefaults = {
  username: "",
  full_name: "",
  email: "",
  company_id: "",
  role_key: "TENANT_USER",
  status: "PENDING",
};

function mapPortalUser(item: PortalUserApiItem): PortalUserRow {
  return {
    id: item.id,
    username: item.username ?? "",
    full_name: item.full_name,
    email: item.email ?? "",
    company_id: item.company_id ?? "",
    company_name: item.company?.name ?? "",
    role: (item.role_key ?? "TENANT_USER") as Role,
    status: (item.status || "PENDING") as EntityStatus,
    last_login: item.last_login_at ?? item.last_seen_at ?? null,
    login_count: Number(item.login_count ?? 0),
    created_at: item.created_at,
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

export default function PortalUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crud = useCrudState<PortalUserRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["portal_users.write"]);
  const canStatus = hasAnyPermission(["portal_users.status", "portal_users.write"]);

  const [data, setData] = useState<PortalUserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [roles, setRoles] = useState<RoleApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pageError, setPageError] = useState<UiErrorState | null>(null);
  const [deleteIntent, setDeleteIntent] = useState<"suspend" | "activate">("suspend");

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(2, t("pages.portalUsers.validation.usernameRequired")),
        full_name: z.string().min(2, t("pages.portalUsers.validation.fullNameRequired")),
        email: z.string().email(t("pages.portalUsers.validation.emailInvalid")),
        company_id: z.string().uuid(t("pages.portalUsers.validation.companyRequired")),
        role_key: z.string().min(1, t("pages.portalUsers.validation.roleRequired")),
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
      }),
    [t],
  );

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: role.name,
        value: role.name,
      })),
    [roles],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "username",
        label: t("pages.portalUsers.fields.username"),
        type: "text",
        placeholder: t("pages.portalUsers.fields.username"),
      },
      {
        name: "full_name",
        label: t("pages.portalUsers.fields.fullName"),
        type: "text",
        placeholder: t("pages.portalUsers.fields.fullName"),
      },
      {
        name: "email",
        label: t("pages.portalUsers.fields.email"),
        type: "email",
        placeholder: "user@company.com",
      },
      {
        name: "company_id",
        label: t("pages.portalUsers.fields.company"),
        type: "select",
        options: companies.map((company) => ({ label: company.name, value: company.id })),
      },
      {
        name: "role_key",
        label: t("pages.portalUsers.fields.role"),
        type: "select",
        options:
          roleOptions.length > 0
            ? roleOptions
            : [
                { label: "TENANT_ADMIN", value: "TENANT_ADMIN" },
                { label: "TENANT_USER", value: "TENANT_USER" },
              ],
      },
      {
        name: "status",
        label: t("pages.portalUsers.fields.status"),
        type: "select",
        options: [
          { label: "PENDING", value: "PENDING" },
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "SUSPENDED", value: "SUSPENDED" },
        ],
      },
    ],
    [companies, roleOptions, t],
  );

  const withRequestId = (message: string, requestId?: string | null) =>
    requestId ? `${message} (${t("common.requestId")}: ${requestId})` : message;

  const loadLookups = async (token: string) => {
    const [companyResponse, roleResponse] = await Promise.all([listCompanies(token), listRoles(token, 1, 200)]);
    setCompanies(companyResponse.items);
    setRoles(roleResponse.items);
  };

  const load = async () => {
    const token = getAccessToken();
    if (!token) {
      setData([]);
      return;
    }

    setLoading(true);
    setPageError(null);
    try {
      await loadLookups(token);
      const response = await listPortalUsers(token, {
        page: 1,
        pageSize: 100,
        q: query || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      setData(response.items.map(mapPortalUser));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) {
        navigate("/forbidden", { replace: true });
        return;
      }
      const parsed = extractError(error);
      setPageError(parsed);
      toast({
        title: t("common.error"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reloadWithFilters = () => {
    void load();
  };

  const columns: ColumnDef<PortalUserRow, unknown>[] = useMemo(
    () => [
      { accessorKey: "username", header: t("pages.portalUsers.fields.username") },
      { accessorKey: "full_name", header: t("pages.portalUsers.fields.fullName") },
      { accessorKey: "email", header: t("pages.portalUsers.fields.email") },
      { accessorKey: "company_name", header: t("pages.portalUsers.fields.company") },
      {
        accessorKey: "role",
        header: t("pages.portalUsers.fields.role"),
      },
      {
        accessorKey: "status",
        header: t("pages.portalUsers.fields.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "last_login",
        header: t("pages.portalUsers.fields.lastLogin"),
        cell: ({ row }) =>
          row.original.last_login ? new Date(row.original.last_login).toLocaleString() : "-",
      },
      { accessorKey: "login_count", header: t("pages.portalUsers.fields.loginCount") },
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
            onDelete={
              canStatus
                ? () => {
                    setDeleteIntent(row.original.status === "SUSPENDED" ? "activate" : "suspend");
                    crud.openDelete(row.original);
                  }
                : undefined
            }
          />
        ),
      },
    ],
    [canStatus, canWrite, crud, t],
  );

  const handleOpenDetail = async (mode: "view" | "edit", row: PortalUserRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const latest = await getPortalUser(token, row.id);
      const mapped = mapPortalUser(latest);
      if (mode === "view") {
        crud.openView(mapped);
      } else {
        crud.openEdit(mapped);
      }
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("common.error"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    }
  };

  const defaultValues = crud.selectedItem
    ? {
        username: crud.selectedItem.username,
        full_name: crud.selectedItem.full_name,
        email: crud.selectedItem.email,
        company_id: crud.selectedItem.company_id,
        role_key: crud.selectedItem.role,
        status: crud.selectedItem.status,
      }
    : emptyDefaults;

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-[220px]"
        placeholder={t("pages.portalUsers.searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.portalUsers.filters.allStatuses")}</SelectItem>
          <SelectItem value="PENDING">PENDING</SelectItem>
          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
        </SelectContent>
      </Select>
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.portalUsers.filters.allRoles")}</SelectItem>
          {roleOptions.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        className="h-9 rounded-md border px-3 text-sm"
        onClick={reloadWithFilters}
      >
        {t("common.filter")}
      </button>
    </div>
  );

  return (
    <>
      {pageError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{withRequestId(pageError.message, pageError.requestId)}</AlertDescription>
        </Alert>
      )}

      <EntityPage<PortalUserRow>
        title={t("pages.portalUsers.title")}
        breadcrumbs={[
          { label: t("menu.dashboard"), href: "/" },
          { label: t("nav.customer"), href: "/customer" },
          { label: t("pages.portalUsers.title") },
        ]}
        columns={columns}
        data={data}
        loading={loading}
        toolbar={toolbar}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel={t("pages.portalUsers.createLabel")}
        onRefresh={() => void load()}
        extraActions={
          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm"
            onClick={async () => {
              const token = getAccessToken();
              if (!token) {
                return;
              }
              try {
                await exportPortalUsersCsv(token, {
                  q: query || undefined,
                  status: statusFilter === "all" ? undefined : statusFilter,
                  role: roleFilter === "all" ? undefined : roleFilter,
                });
              } catch (error) {
                const parsed = extractError(error);
                toast({
                  title: t("common.error"),
                  description: withRequestId(parsed.message, parsed.requestId),
                  variant: "destructive",
                });
              }
            }}
          >
            {t("common.export")}
          </button>
        }
      />

      <CrudDrawer
        open={crud.drawerOpen}
        onOpenChange={crud.setDrawerOpen}
        mode={crud.mode}
        title={t("pages.portalUsers.drawerTitle")}
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
                username: String(values.username),
                full_name: String(values.full_name),
                email: String(values.email),
                company_id: String(values.company_id),
                role_key: String(values.role_key),
                status: String(values.status) as "PENDING" | "ACTIVE" | "SUSPENDED",
                tenant_id: companies.find((company) => company.id === String(values.company_id))?.tenant_id ?? null,
              };
              if (crud.mode === "create") {
                await createPortalUser(token, payload);
                addOperation("Create Portal User", "Portal User", payload.username);
              } else if (crud.selectedItem) {
                await updatePortalUser(token, crud.selectedItem.id, payload);
                addOperation("Update Portal User", "Portal User", payload.username);
              }
              crud.closeDrawer();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              setPageError(parsed);
              toast({
                title: t("common.error"),
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
        title={
          deleteIntent === "suspend"
            ? t("pages.portalUsers.actions.suspendTitle")
            : t("pages.portalUsers.actions.activateTitle")
        }
        description={
          deleteIntent === "suspend"
            ? t("pages.portalUsers.actions.suspendDescription", { username: crud.deleteTarget?.username ?? "-" })
            : t("pages.portalUsers.actions.activateDescription", { username: crud.deleteTarget?.username ?? "-" })
        }
        variant={deleteIntent === "suspend" ? "destructive" : "default"}
        confirmLabel={
          deleteIntent === "suspend"
            ? t("pages.portalUsers.actions.suspend")
            : t("pages.portalUsers.actions.activate")
        }
        onConfirm={() => {
          const token = getAccessToken();
          const target = crud.deleteTarget;
          if (!token || !target) {
            crud.closeDelete();
            return;
          }
          setRowActionLoading(true);
          setPageError(null);
          void (async () => {
            try {
              if (deleteIntent === "suspend") {
                await suspendPortalUser(token, target.id);
                addOperation("Suspend Portal User", "Portal User", target.username);
              } else {
                await activatePortalUser(token, target.id);
                addOperation("Activate Portal User", "Portal User", target.username);
              }
              crud.closeDelete();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              setPageError(parsed);
              toast({
                title: t("common.error"),
                description: withRequestId(parsed.message, parsed.requestId),
                variant: "destructive",
              });
            } finally {
              setRowActionLoading(false);
            }
          })();
        }}
      />
      {rowActionLoading && <div className="sr-only">{t("common.loading")}</div>}
    </>
  );
}
