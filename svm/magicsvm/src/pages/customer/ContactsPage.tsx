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
  createContact,
  deleteContact,
  exportContactsCsv,
  getContact,
  listCompanies,
  listContacts,
  listContactTypes,
  updateContact,
  type CompanyApiItem,
  type ContactApiItem,
  type ContactTypeApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus } from "@/types";

interface ContactRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_id: string;
  company_name: string;
  contact_type_id: string;
  contact_type_name: string;
  notes: string;
  status: EntityStatus;
  created_at: string;
}

interface UiErrorState {
  message: string;
  requestId?: string | null;
}

const emptyDefaults = {
  full_name: "",
  email: "",
  phone: "",
  company_id: "",
  contact_type_id: "",
  status: "ACTIVE",
  notes: "",
};

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

export default function ContactsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crud = useCrudState<ContactRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["contacts.write"]);
  const canDelete = hasAnyPermission(["contacts.delete"]);

  const [data, setData] = useState<ContactRow[]>([]);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactTypeApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
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
        full_name: z.string().min(2, t("pages.contacts.validation.fullNameRequired")),
        email: z.string().email(t("pages.contacts.validation.emailInvalid")),
        phone: z.string().min(1, t("pages.contacts.validation.phoneRequired")),
        company_id: z.string().uuid(t("pages.contacts.validation.companyRequired")),
        contact_type_id: z.string().uuid(t("pages.contacts.validation.contactTypeRequired")),
        status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]),
        notes: z.string().optional(),
      }),
    [t],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "full_name",
        label: t("pages.contacts.fields.fullName"),
        type: "text",
        placeholder: t("pages.contacts.fields.fullName"),
      },
      {
        name: "email",
        label: t("pages.contacts.fields.email"),
        type: "email",
        placeholder: "contact@company.com",
      },
      {
        name: "phone",
        label: t("pages.contacts.fields.phone"),
        type: "text",
        placeholder: "+90 555 000 0000",
      },
      {
        name: "company_id",
        label: t("pages.contacts.fields.company"),
        type: "select",
        options: companies.map((company) => ({ label: company.name, value: company.id })),
      },
      {
        name: "contact_type_id",
        label: t("pages.contacts.fields.contactType"),
        type: "select",
        options: contactTypes.map((item) => ({ label: item.name, value: item.id })),
      },
      {
        name: "status",
        label: t("pages.contacts.fields.status"),
        type: "select",
        options: [
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "PENDING", value: "PENDING" },
          { label: "SUSPENDED", value: "SUSPENDED" },
        ],
      },
      {
        name: "notes",
        label: t("pages.contacts.fields.notes"),
        type: "textarea",
        placeholder: t("pages.contacts.fields.notes"),
      },
    ],
    [companies, contactTypes, t],
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
      const [companiesResponse, typesResponse, contactsResponse] = await Promise.all([
        listCompanies(token),
        listContactTypes(token, { page: 1, pageSize: 100 }),
        listContacts(token, {
          page: 1,
          pageSize: 100,
          q: query || undefined,
          companyId: companyFilter === "all" ? undefined : companyFilter,
          contactTypeId: typeFilter === "all" ? undefined : typeFilter,
        }),
      ]);

      const companyById = new Map(companiesResponse.items.map((company) => [company.id, company.name]));
      const typeById = new Map(typesResponse.items.map((item) => [item.id, item.name]));

      setCompanies(companiesResponse.items);
      setContactTypes(typesResponse.items);
      setData(
        contactsResponse.items.map((item: ContactApiItem) => ({
          id: item.id,
          full_name: item.name,
          email: item.email ?? "",
          phone: item.phone ?? "",
          company_id: item.company_id,
          company_name: companyById.get(item.company_id) ?? "-",
          contact_type_id: item.contact_type_id,
          contact_type_name: typeById.get(item.contact_type_id) ?? "-",
          notes: item.notes ?? "",
          status: item.is_primary ? "ACTIVE" : "PENDING",
          created_at: item.created_at,
        })),
      );
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
  }, [query, companyFilter, typeFilter]);

  const columns: ColumnDef<ContactRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: t("pages.contacts.columns.fullName"),
      },
      {
        accessorKey: "email",
        header: t("pages.contacts.columns.email"),
      },
      {
        accessorKey: "phone",
        header: t("pages.contacts.columns.phone"),
      },
      {
        accessorKey: "company_name",
        header: t("pages.contacts.columns.company"),
      },
      {
        accessorKey: "contact_type_name",
        header: t("pages.contacts.columns.contactType"),
      },
      {
        accessorKey: "status",
        header: t("pages.contacts.columns.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "created_at",
        header: t("pages.contacts.columns.createdAt"),
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

  const handleOpenDetail = async (mode: "view" | "edit", row: ContactRow) => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const latest = await getContact(token, row.id);
      const mapped: ContactRow = {
        id: latest.id,
        full_name: latest.name,
        email: latest.email ?? "",
        phone: latest.phone ?? "",
        company_id: latest.company_id,
        company_name: companies.find((company) => company.id === latest.company_id)?.name ?? "-",
        contact_type_id: latest.contact_type_id,
        contact_type_name: contactTypes.find((item) => item.id === latest.contact_type_id)?.name ?? "-",
        notes: latest.notes ?? "",
        status: latest.is_primary ? "ACTIVE" : "PENDING",
        created_at: latest.created_at,
      };
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
        full_name: crud.selectedItem.full_name,
        email: crud.selectedItem.email,
        phone: crud.selectedItem.phone,
        company_id: crud.selectedItem.company_id,
        contact_type_id: crud.selectedItem.contact_type_id,
        status: crud.selectedItem.status,
        notes: crud.selectedItem.notes,
      }
    : emptyDefaults;

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-[240px]"
        placeholder={t("pages.contacts.searchPlaceholder")}
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
      />
      <Select value={companyFilter} onValueChange={setCompanyFilter}>
        <SelectTrigger className="h-9 w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.contacts.filters.allCompanies")}</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="h-9 w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("pages.contacts.filters.allTypes")}</SelectItem>
          {contactTypes.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
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

      <EntityPage<ContactRow>
        title={t("pages.contacts.title")}
        breadcrumbs={[
          { label: t("menu.dashboard"), href: "/" },
          { label: t("nav.customer"), href: "/customer" },
          { label: t("pages.contacts.title") },
        ]}
        columns={columns}
        data={data}
        loading={loading}
        toolbar={toolbar}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel={t("pages.contacts.createLabel")}
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
                await exportContactsCsv(token, {
                  q: query || undefined,
                  companyId: companyFilter === "all" ? undefined : companyFilter,
                  contactTypeId: typeFilter === "all" ? undefined : typeFilter,
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
        title={t("pages.contacts.drawerTitle")}
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
                name: String(values.full_name),
                email: String(values.email),
                phone: String(values.phone),
                company_id: String(values.company_id),
                contact_type_id: String(values.contact_type_id),
                notes: values.notes ? String(values.notes) : null,
                is_primary: String(values.status) === "ACTIVE",
              };
              if (crud.mode === "create") {
                await createContact(token, payload);
                addOperation("Create Contact", "Contact", payload.name);
              } else if (crud.selectedItem) {
                await updateContact(token, crud.selectedItem.id, payload);
                addOperation("Update Contact", "Contact", payload.name);
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
        title={t("pages.contacts.delete.title")}
        description={t("pages.contacts.delete.description", { name: crud.deleteTarget?.full_name ?? "-" })}
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
              await deleteContact(token, target.id);
              addOperation("Delete Contact", "Contact", target.full_name);
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
