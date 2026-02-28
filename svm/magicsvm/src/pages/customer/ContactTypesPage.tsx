import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityPage } from "@/components/shared/EntityPage";
import { RowActions } from "@/components/shared/RowActions";
import { CrudDrawer, type FieldConfig } from "@/components/shared/CrudDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCrudState } from "@/components/shared/useCrudState";
import { useOperations } from "@/hooks/useOperations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ApiRequestError,
  createContactType,
  deleteContactType,
  exportContactTypesCsv,
  getContactType,
  listContactTypes,
  updateContactType,
  type ContactTypeApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";

interface ContactTypeRow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UiErrorState {
  message: string;
  requestId?: string | null;
}

const emptyDefaults = {
  name: "",
  description: "",
  is_active: true,
};

function mapContactType(item: ContactTypeApiItem): ContactTypeRow {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
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

export default function ContactTypesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crud = useCrudState<ContactTypeRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["contact_types.write"]);
  const canDelete = hasAnyPermission(["contact_types.delete"]);

  const [data, setData] = useState<ContactTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
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
        name: z.string().min(2, t("pages.contactTypes.validation.nameRequired")),
        description: z.string().optional(),
        is_active: z.boolean().default(true),
      }),
    [t],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "name",
        label: t("pages.contactTypes.fields.name"),
        type: "text",
        placeholder: t("pages.contactTypes.fields.name"),
      },
      {
        name: "description",
        label: t("pages.contactTypes.fields.description"),
        type: "textarea",
        placeholder: t("pages.contactTypes.fields.description"),
      },
      {
        name: "is_active",
        label: t("pages.contactTypes.fields.isActive"),
        type: "switch",
      },
    ],
    [t],
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
      const response = await listContactTypes(token, {
        page: 1,
        pageSize: 100,
        q: query || undefined,
        isActive: activeFilter === "all" ? undefined : activeFilter === "active",
      });
      setData(response.items.map(mapContactType));
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
  }, [query, activeFilter]);

  const columns: ColumnDef<ContactTypeRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("pages.contactTypes.columns.name"),
      },
      {
        accessorKey: "description",
        header: t("pages.contactTypes.columns.description"),
      },
      {
        accessorKey: "created_at",
        header: t("pages.contactTypes.columns.createdAt"),
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
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
            onDelete={canDelete ? () => crud.openDelete(row.original) : undefined}
          />
        ),
      },
    ],
    [canDelete, canWrite, crud, t],
  );

  const handleOpenDetail = async (mode: "view" | "edit", row: ContactTypeRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const latest = await getContactType(token, row.id);
      const mapped = mapContactType(latest);
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
        name: crud.selectedItem.name,
        description: crud.selectedItem.description,
        is_active: crud.selectedItem.is_active,
      }
    : emptyDefaults;

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-[240px]"
        placeholder={t("pages.contactTypes.searchPlaceholder")}
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
      />
      <Select value={activeFilter} onValueChange={setActiveFilter}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.contactTypes.filters.all")}</SelectItem>
          <SelectItem value="active">{t("pages.contactTypes.filters.active")}</SelectItem>
          <SelectItem value="inactive">{t("pages.contactTypes.filters.inactive")}</SelectItem>
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

      <EntityPage<ContactTypeRow>
        title={t("pages.contactTypes.title")}
        breadcrumbs={[
          { label: t("menu.dashboard"), href: "/" },
          { label: t("nav.customer"), href: "/customer" },
          { label: t("pages.contactTypes.title") },
        ]}
        columns={columns}
        data={data}
        loading={loading}
        toolbar={toolbar}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel={t("pages.contactTypes.createLabel")}
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
                await exportContactTypesCsv(token, {
                  q: query || undefined,
                  isActive: activeFilter === "all" ? undefined : activeFilter === "active",
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
        title={t("pages.contactTypes.drawerTitle")}
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
                name: String(values.name),
                description: values.description ? String(values.description) : null,
                is_active: Boolean(values.is_active),
              };
              if (crud.mode === "create") {
                await createContactType(token, payload);
                addOperation("Create Contact Type", "ContactType", payload.name);
              } else if (crud.selectedItem) {
                await updateContactType(token, crud.selectedItem.id, payload);
                addOperation("Update Contact Type", "ContactType", payload.name);
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
        title={t("pages.contactTypes.delete.title")}
        description={t("pages.contactTypes.delete.description", { name: crud.deleteTarget?.name ?? "-" })}
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
              await deleteContactType(token, target.id);
              addOperation("Delete Contact Type", "ContactType", target.name);
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
              setSubmitting(false);
            }
          })();
        }}
      />
    </>
  );
}
