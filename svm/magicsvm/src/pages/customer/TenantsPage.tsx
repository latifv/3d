import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
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
  createTenant,
  deactivateTenant,
  listTenants,
  updateTenant,
  type TenantApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus } from "@/types";

interface TenantRow {
  id: string;
  name: string;
  status: EntityStatus;
  created_at: string;
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "PASSIVE"]),
});

const fields: FieldConfig[] = [
  { name: "name", label: "Tenant Name", type: "text", placeholder: "Enter tenant name" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Passive", value: "PASSIVE" },
    ],
  },
];

const emptyDefaults = { name: "", status: "ACTIVE" };

function normalizeStatus(value: string): EntityStatus {
  if (value === "PASSIVE") {
    return "INACTIVE";
  }
  return (value || "ACTIVE") as EntityStatus;
}

function mapTenant(item: TenantApiItem): TenantRow {
  return {
    id: item.id,
    name: item.name,
    status: normalizeStatus(item.status),
    created_at: item.created_at,
  };
}

function extractError(error: unknown): { message: string; requestId?: string | null } {
  if (error instanceof ApiRequestError) {
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "Unexpected error" };
}

export default function TenantsPage() {
  const [data, setData] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const crud = useCrudState<TenantRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["tenants.write"]);

  const load = async () => {
    const token = getAccessToken();
    if (!token) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listTenants(token);
      setData(response.items.map(mapTenant));
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: "Tenants could not be loaded",
        description: parsed.requestId ? `${parsed.message} (Request ID: ${parsed.requestId})` : parsed.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const columns: ColumnDef<TenantRow, unknown>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "id", header: "Tenant ID" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 100,
        cell: ({ row }) => (
          <RowActions
            onView={() => crud.openView(row.original)}
            onEdit={canWrite ? () => crud.openEdit(row.original) : undefined}
            onDelete={canWrite ? () => crud.openDelete(row.original) : undefined}
          />
        ),
      },
    ],
    [canWrite, crud],
  );

  const defaultValues = crud.selectedItem
    ? {
        name: crud.selectedItem.name,
        status: crud.selectedItem.status === "INACTIVE" ? "PASSIVE" : crud.selectedItem.status,
      }
    : emptyDefaults;

  return (
    <>
      <EntityPage<TenantRow>
        title="Tenants"
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search tenants..."
        loading={loading}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel="New Tenant"
      />
      <CrudDrawer
        open={crud.drawerOpen}
        onOpenChange={crud.setDrawerOpen}
        mode={crud.mode}
        title="Tenant"
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={submitting}
        onSubmit={(values) => {
          const token = getAccessToken();
          if (!token) {
            toast({
              title: "Session expired",
              description: "Please login again.",
              variant: "destructive",
            });
            return;
          }
          setSubmitting(true);
          void (async () => {
            try {
              if (crud.mode === "create") {
                await createTenant(token, {
                  name: String(values.name),
                  status: String(values.status),
                });
                addOperation("Create Tenant", "Tenant", String(values.name));
              } else if (crud.selectedItem) {
                await updateTenant(token, crud.selectedItem.id, {
                  name: String(values.name),
                  status: String(values.status),
                });
                addOperation("Update Tenant", "Tenant", String(values.name));
              }
              crud.closeDrawer();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              toast({
                title: "Tenant save failed",
                description: parsed.requestId ? `${parsed.message} (Request ID: ${parsed.requestId})` : parsed.message,
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
        title="Deactivate Tenant"
        description={`"${crud.deleteTarget?.name}" tenant kaydını PASSIVE yapmak istiyor musunuz?`}
        variant="destructive"
        confirmLabel="Deactivate"
        onConfirm={() => {
          const token = getAccessToken();
          const target = crud.deleteTarget;
          if (!token || !target) {
            crud.closeDelete();
            return;
          }
          setSubmitting(true);
          void (async () => {
            try {
              await deactivateTenant(token, target.id);
              addOperation("Deactivate Tenant", "Tenant", target.name);
              crud.closeDelete();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              toast({
                title: "Tenant deactivate failed",
                description: parsed.requestId ? `${parsed.message} (Request ID: ${parsed.requestId})` : parsed.message,
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
