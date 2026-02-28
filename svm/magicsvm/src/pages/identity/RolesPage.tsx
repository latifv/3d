import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EntityPage } from "@/components/shared/EntityPage";
import { RowActions } from "@/components/shared/RowActions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ApiRequestError,
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
  type PermissionApiItem,
  type RoleApiItem,
  type RoleCreateInput,
} from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authStore";
import { useAuth } from "@/hooks/useAuth";

type DrawerMode = "create" | "edit" | "view";
type RoleStatus = "ACTIVE" | "DISABLED";

type RoleScope = "GLOBAL" | "TENANT" | "DISABLED";

interface RoleRow {
  id: string;
  name: string;
  roleKey: string;
  status: RoleStatus;
  scope: RoleScope;
  createdAt: string;
  updatedAt: string;
  permissionKeys: string[];
  isSystemRole: boolean;
}

interface RoleFormState {
  name: string;
  description: string;
  status: RoleStatus;
  permissionKeys: string[];
}

interface PermissionGroup {
  key: string;
  label: string;
  items: PermissionApiItem[];
}

const SYSTEM_ROLE_KEYS = new Set([
  "SYSTEM_ADMIN",
  "PLATFORM_ADMIN",
  "RESELLER_ADMIN",
  "TENANT_ADMIN",
  "TENANT_USER",
]);

function deriveRoleKey(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapScopeToStatus(scope: string): RoleStatus {
  return scope.toUpperCase() === "DISABLED" ? "DISABLED" : "ACTIVE";
}

function mapScope(scope: string): RoleScope {
  const normalized = scope.toUpperCase();
  if (normalized === "DISABLED") {
    return "DISABLED";
  }
  if (normalized === "TENANT") {
    return "TENANT";
  }
  return "GLOBAL";
}

function mapRole(item: RoleApiItem): RoleRow {
  const roleKey = deriveRoleKey(item.name);
  const scope = mapScope(item.scope);
  return {
    id: item.id,
    name: item.name,
    roleKey,
    status: mapScopeToStatus(item.scope),
    scope,
    createdAt: item.created_at,
    updatedAt: item.created_at,
    permissionKeys: item.permission_keys ?? [],
    isSystemRole: SYSTEM_ROLE_KEYS.has(roleKey),
  };
}

function extractError(error: unknown): { message: string; requestId?: string | null } {
  if (error instanceof ApiRequestError) {
    return { message: error.message, requestId: error.requestId };
  }
  return { message: "Unexpected error" };
}

function getPermissionGroupKey(permissionKey: string): string {
  if (permissionKey.includes(".")) {
    return permissionKey.split(".")[0].toLowerCase();
  }
  if (permissionKey.includes("_")) {
    return permissionKey.split("_")[0].toLowerCase();
  }
  return "general";
}

export default function RolesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hasAnyPermission } = useAuth();
  const canWrite = hasAnyPermission(["platform.iam.roles.write", "iam.roles.write", "roles.write"]);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("view");
  const [activeTab, setActiveTab] = useState<"details" | "permissions" | "audit">("details");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const [form, setForm] = useState<RoleFormState>({
    name: "",
    description: "",
    status: "ACTIVE",
    permissionKeys: [],
  });

  const withRequestId = (message: string, requestId?: string | null) =>
    requestId ? `${message} (${t("common.requestId")}: ${requestId})` : message;

  const groupedPermissions = useMemo<PermissionGroup[]>(() => {
    const filtered = permissions.filter((item) => {
      if (!permissionQuery.trim()) {
        return true;
      }
      return item.key.toLowerCase().includes(permissionQuery.trim().toLowerCase());
    });

    const groups = new Map<string, PermissionApiItem[]>();
    for (const item of filtered) {
      const key = getPermissionGroupKey(item.key);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupKey, items]) => ({
        key: groupKey,
        label: t(`pages.roles.permissionGroups.${groupKey}`, groupKey.toUpperCase()),
        items: [...items].sort((a, b) => a.key.localeCompare(b.key)),
      }));
  }, [permissionQuery, permissions, t]);

  const selectedCount = form.permissionKeys.length;
  const isView = drawerMode === "view";
  const roleKeyValue = useMemo(() => deriveRoleKey(form.name), [form.name]);
  const isSystemRole = selectedRole?.isSystemRole ?? false;

  const load = async () => {
    const token = getAccessToken();
    if (!token) {
      setRoles([]);
      setPermissions([]);
      return;
    }

    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        listRoles(token, 1, 100),
        listPermissions(token, 1, 100),
      ]);
      setRoles((rolesResponse.items ?? []).map(mapRole));
      setPermissions(permissionsResponse.items ?? []);
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.roles.toasts.loadFailed"),
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

  const openDrawer = (mode: DrawerMode, role?: RoleRow) => {
    setDrawerMode(mode);
    setActiveTab("details");
    setPermissionQuery("");
    setDirty(false);

    if (role) {
      setSelectedRole(role);
      setForm({
        name: role.name,
        description: "",
        status: role.status,
        permissionKeys: [...role.permissionKeys],
      });
    } else {
      setSelectedRole(null);
      setForm({
        name: "",
        description: "",
        status: "ACTIVE",
        permissionKeys: [],
      });
    }
    setDrawerOpen(true);
  };

  const onDrawerOpenChange = (open: boolean) => {
    if (!open && dirty && !isView) {
      const accepted = window.confirm(t("pages.roles.confirmDiscard"));
      if (!accepted) {
        return;
      }
    }
    setDrawerOpen(open);
    if (!open) {
      setActiveTab("details");
      setDirty(false);
    }
  };

  const setFormPartial = (partial: Partial<RoleFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    if (!isView) {
      setDirty(true);
    }
  };

  const togglePermission = (key: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...form.permissionKeys, key])]
      : form.permissionKeys.filter((item) => item !== key);
    setFormPartial({ permissionKeys: next });
  };

  const togglePermissionGroup = (group: PermissionGroup, checked: boolean) => {
    if (checked) {
      const next = [...new Set([...form.permissionKeys, ...group.items.map((item) => item.key)])];
      setFormPartial({ permissionKeys: next });
      return;
    }
    const next = form.permissionKeys.filter((key) => !group.items.some((item) => item.key === key));
    setFormPartial({ permissionKeys: next });
  };

  const saveRole = async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast({
        title: t("pages.roles.validation.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (isSystemRole && drawerMode === "edit" && selectedRole) {
      setForm((prev) => ({ ...prev, name: selectedRole.name }));
    }

    const payload: RoleCreateInput = {
      name: isSystemRole && selectedRole ? selectedRole.name : trimmedName,
      scope: form.status === "DISABLED" ? "DISABLED" : selectedRole?.scope ?? "GLOBAL",
      permission_keys: form.permissionKeys,
    };

    setSaving(true);
    try {
      if (drawerMode === "create") {
        await createRole(token, payload);
      } else if (selectedRole) {
        await updateRole(token, selectedRole.id, payload);
      }
      toast({
        title: t("pages.roles.toasts.saveSuccess"),
      });
      setDrawerOpen(false);
      setDirty(false);
      await load();
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.roles.toasts.saveFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const token = getAccessToken();
    if (!token || !deleteTarget) {
      setDeleteTarget(null);
      return;
    }

    if (deleteTarget.isSystemRole) {
      toast({
        title: t("pages.roles.toasts.systemRoleProtected"),
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }

    setSaving(true);
    try {
      await deleteRole(token, deleteTarget.id);
      toast({
        title: t("pages.roles.toasts.deleteSuccess"),
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      const parsed = extractError(error);
      toast({
        title: t("pages.roles.toasts.deleteFailed"),
        description: withRequestId(parsed.message, parsed.requestId),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<RoleRow, unknown>[]>(
    () => [
      { accessorKey: "name", header: t("pages.roles.columns.name") },
      {
        accessorKey: "roleKey",
        header: t("pages.roles.columns.key"),
        cell: ({ row }) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.roleKey}</code>,
      },
      {
        accessorKey: "status",
        header: t("pages.roles.columns.status"),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
            {row.original.status === "ACTIVE" ? t("pages.roles.status.active") : t("pages.roles.status.disabled")}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("pages.roles.columns.createdAt"),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
      {
        accessorKey: "updatedAt",
        header: t("pages.roles.columns.updatedAt"),
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 100,
        cell: ({ row }) => (
          <RowActions
            onView={() => openDrawer("view", row.original)}
            onEdit={canWrite ? () => openDrawer("edit", row.original) : undefined}
            onDelete={canWrite && !row.original.isSystemRole ? () => setDeleteTarget(row.original) : undefined}
          />
        ),
      },
    ],
    [canWrite, t],
  );

  const drawerTitle =
    drawerMode === "create"
      ? t("pages.roles.drawer.createTitle")
      : drawerMode === "edit"
      ? t("pages.roles.drawer.editTitle")
      : t("pages.roles.drawer.viewTitle");

  const permissionAuditEvents = useMemo(() => {
    if (!selectedRole) {
      return [] as Array<{ id: string; title: string; at: string }>;
    }
    return [
      {
        id: `${selectedRole.id}-created`,
        title: t("pages.roles.audit.events.created"),
        at: selectedRole.createdAt,
      },
      {
        id: `${selectedRole.id}-permissions`,
        title: t("pages.roles.audit.events.permissionsUpdated"),
        at: selectedRole.updatedAt,
      },
    ];
  }, [selectedRole, t]);

  return (
    <>
      <EntityPage<RoleRow>
        title={t("pages.roles.title")}
        breadcrumbs={[
          { label: t("menu.dashboard"), href: "/dashboard" },
          { label: t("menu.group.securityAccess") },
          { label: t("pages.roles.title") },
        ]}
        columns={columns}
        data={roles}
        searchKey="name"
        searchPlaceholder={t("pages.roles.searchPlaceholder")}
        loading={loading}
        onRowClick={(row) => openDrawer("view", row)}
        onCreate={canWrite ? () => openDrawer("create") : undefined}
        createLabel={t("pages.roles.new")}
        onRefresh={() => void load()}
      />

      <Sheet open={drawerOpen} onOpenChange={onDrawerOpenChange}>
        <SheetContent className="w-full p-0 sm:max-w-[520px]">
          <SheetHeader className="px-6 py-5">
            <SheetTitle>{drawerTitle}</SheetTitle>
          </SheetHeader>
          <Separator />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "details" | "permissions" | "audit")}
            className="flex h-[calc(100%-132px)] flex-col"
          >
            <TabsList className="mx-6 mt-4 grid grid-cols-3">
              <TabsTrigger value="details">{t("pages.roles.tabs.details")}</TabsTrigger>
              <TabsTrigger value="permissions">{t("pages.roles.tabs.permissions")}</TabsTrigger>
              <TabsTrigger value="audit">{t("pages.roles.tabs.audit")}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">{t("pages.roles.fields.name")}</Label>
                    <Input
                      id="role-name"
                      value={form.name}
                      onChange={(event) => setFormPartial({ name: event.target.value })}
                      placeholder={t("pages.roles.fields.namePlaceholder")}
                      disabled={isView || (drawerMode === "edit" && isSystemRole)}
                    />
                    {drawerMode === "edit" && isSystemRole && (
                      <p className="text-xs text-muted-foreground">{t("pages.roles.systemRoleRenameDisabled")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-key">{t("pages.roles.fields.key")}</Label>
                    <Input id="role-key" value={roleKeyValue} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description">{t("pages.roles.fields.description")}</Label>
                    <Input
                      id="role-description"
                      value={form.description}
                      onChange={(event) => setFormPartial({ description: event.target.value })}
                      placeholder={t("pages.roles.fields.descriptionPlaceholder")}
                      disabled={isView}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t("pages.roles.fields.status")}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.status === "ACTIVE" ? t("pages.roles.status.active") : t("pages.roles.status.disabled")}
                      </p>
                    </div>
                    <Switch
                      checked={form.status === "ACTIVE"}
                      disabled={isView}
                      onCheckedChange={(checked) => setFormPartial({ status: checked ? "ACTIVE" : "DISABLED" })}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="permissions" className="mt-0 flex-1 overflow-hidden">
              <div className="px-6 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{t("permissions.title")}</p>
                  <Badge variant="secondary">
                    {t("permissions.selectedCount", { count: selectedCount })}
                  </Badge>
                </div>

                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={permissionQuery}
                    onChange={(event) => setPermissionQuery(event.target.value)}
                    placeholder={t("permissions.search")}
                    className="pl-9"
                    disabled={isView}
                  />
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-112px)] px-6 pb-4">
                {groupedPermissions.length === 0 ? (
                  <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("permissions.empty")}
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {groupedPermissions.map((group) => {
                      const groupSelectedCount = group.items.filter((item) =>
                        form.permissionKeys.includes(item.key),
                      ).length;

                      return (
                        <AccordionItem key={group.key} value={group.key}>
                          <div className="flex items-center justify-between gap-2 py-2">
                            <AccordionTrigger className="py-0 text-sm font-medium">{group.label}</AccordionTrigger>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={isView}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                togglePermissionGroup(group, groupSelectedCount !== group.items.length);
                              }}
                            >
                              {t("permissions.selectAllInGroup")}
                            </Button>
                          </div>
                          <AccordionContent className="space-y-2 pt-1">
                            {group.items.map((permission) => {
                              const checked = form.permissionKeys.includes(permission.key);
                              return (
                                <label
                                  key={permission.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(next) => togglePermission(permission.key, !!next)}
                                    disabled={isView}
                                  />
                                  <span className="font-mono text-xs">{permission.key}</span>
                                </label>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="audit" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("pages.roles.audit.createdAt")}</p>
                        <p>{selectedRole ? new Date(selectedRole.createdAt).toLocaleString() : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("pages.roles.audit.updatedAt")}</p>
                        <p>{selectedRole ? new Date(selectedRole.updatedAt).toLocaleString() : "-"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("pages.roles.audit.createdBy")}</p>
                      <p>-</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">{t("pages.roles.audit.recentEvents")}</p>
                    {permissionAuditEvents.length === 0 ? (
                      <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                        {t("pages.roles.audit.noEvents")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {permissionAuditEvents.slice(0, 10).map((event) => (
                          <div key={event.id} className="rounded-md border px-3 py-2 text-sm">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {!isView && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-2 px-6 py-4">
                <Button variant="outline" onClick={() => onDrawerOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={() => void saveRole()} disabled={saving}>
                  {saving ? t("common.loading") : t("common.save")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={t("pages.roles.delete.title")}
        description={
          deleteTarget
            ? t("pages.roles.delete.description", { name: deleteTarget.name })
            : t("pages.roles.delete.descriptionFallback")
        }
        variant="destructive"
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </>
  );
}
