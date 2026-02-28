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
  createProject,
  deleteProject,
  listCompanies,
  listProjects,
  updateProject,
  type CompanyApiItem,
  type ProjectApiItem,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import type { EntityStatus } from "@/types";

interface ProjectRow {
  id: string;
  name: string;
  code: string;
  company_id: string;
  company_name: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
  description: string;
}

const schema = z.object({
  company_id: z.string().uuid("Company is required"),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "PASSIVE"]),
});

function normalizeStatus(value: string): EntityStatus {
  if (value === "PASSIVE") {
    return "INACTIVE";
  }
  return (value || "ACTIVE") as EntityStatus;
}

function mapProject(item: ProjectApiItem, companyMap: Map<string, string>): ProjectRow {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    company_id: item.company_id,
    company_name: companyMap.get(item.company_id) ?? item.company_id,
    status: normalizeStatus(item.status),
    created_at: item.created_at,
    updated_at: item.updated_at,
    description: item.description ?? "",
  };
}

function extractError(error: unknown): { message: string; requestId?: string | null } {
  if (error instanceof ApiRequestError) {
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "Unexpected error" };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const crud = useCrudState<ProjectRow>();
  const { addOperation } = useOperations();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["projects.write"]);

  const companyOptions = useMemo(
    () => companies.map((company) => ({ label: company.name, value: company.id })),
    [companies],
  );

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "company_id",
        label: "Company",
        type: "select",
        options: companyOptions,
      },
      { name: "code", label: "Code", type: "text", placeholder: "project-code" },
      { name: "name", label: "Project Name", type: "text", placeholder: "Enter project name" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "ACTIVE" },
          { label: "Passive", value: "PASSIVE" },
        ],
      },
    ],
    [companyOptions],
  );

  const load = async () => {
    const token = getAccessToken();
    if (!token) {
      setProjects([]);
      setCompanies([]);
      return;
    }
    setLoading(true);
    try {
      const [projectResponse, companyResponse] = await Promise.all([
        listProjects(token),
        listCompanies(token),
      ]);
      const map = new Map(companyResponse.items.map((company) => [company.id, company.name]));
      setCompanies(companyResponse.items);
      setProjects(projectResponse.items.map((item) => mapProject(item, map)));
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: "Projects could not be loaded",
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

  const columns: ColumnDef<ProjectRow, unknown>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "code", header: "Code" },
      { accessorKey: "company_name", header: "Company" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ row }) => new Date(row.original.updated_at).toLocaleDateString(),
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
        company_id: crud.selectedItem.company_id,
        code: crud.selectedItem.code,
        name: crud.selectedItem.name,
        description: crud.selectedItem.description ?? "",
        status: crud.selectedItem.status === "INACTIVE" ? "PASSIVE" : crud.selectedItem.status,
      }
    : {
        company_id: companyOptions[0]?.value ?? "",
        code: "",
        name: "",
        description: "",
        status: "ACTIVE",
      };

  return (
    <>
      <EntityPage<ProjectRow>
        title="Projects"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customer", href: "/customer" },
          { label: "Projects" },
        ]}
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Search by name..."
        loading={loading}
        onCreate={canWrite ? crud.openCreate : undefined}
        createLabel="New Project"
      />

      <CrudDrawer
        open={crud.drawerOpen}
        onOpenChange={crud.setDrawerOpen}
        mode={crud.mode}
        title="Project"
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
              const payload = {
                company_id: String(values.company_id),
                code: String(values.code),
                name: String(values.name),
                description: String(values.description ?? "").trim() || null,
                status: String(values.status),
              };
              if (crud.mode === "create") {
                await createProject(token, payload);
                addOperation("Create Project", "Project", payload.name);
              } else if (crud.selectedItem) {
                await updateProject(token, crud.selectedItem.id, payload);
                addOperation("Update Project", "Project", payload.name);
              }
              crud.closeDrawer();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              toast({
                title: "Project save failed",
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
        title="Delete Project"
        description={`Are you sure you want to delete "${crud.deleteTarget?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
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
              await deleteProject(token, target.id);
              addOperation("Delete Project", "Project", target.name);
              crud.closeDelete();
              await load();
            } catch (error) {
              const parsed = extractError(error);
              toast({
                title: "Project delete failed",
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
