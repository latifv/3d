const DEFAULT_API_BASE_URL = "http://127.0.0.1:9999";

export type MfaMethod = "totp" | "email" | "sms";

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface MfaChallengeResponse {
  challenge_id: string;
  enabled_methods: MfaMethod[];
  expires_in: number;
}

export interface MeResponse {
  id: string;
  tenant_id: string | null;
  email: string;
  full_name: string;
  is_system_admin: boolean;
  tenant_name: string | null;
  tenant_status: string | null;
  roles: string[];
  permissions: string[];
  language: string;
  timezone: string | null;
}

export interface I18nMessagesResponse {
  lang: string;
  messages: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface TenantApiItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface TenantCreateInput {
  name: string;
  status: string;
}

export interface TenantUpdateInput {
  name?: string;
  status?: string;
}

export interface CompanyApiItem {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  legal_name: string | null;
  tax_number: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreateInput {
  code: string;
  name: string;
  legal_name?: string | null;
  tax_number?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface CompanyUpdateInput {
  code?: string;
  name?: string;
  legal_name?: string | null;
  tax_number?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProjectApiItem {
  id: string;
  tenant_id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  tenant_id?: string | null;
  company_id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
}

export interface ProjectUpdateInput {
  company_id?: string;
  code?: string;
  name?: string;
  description?: string | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
}

export interface RoleApiItem {
  id: string;
  name: string;
  scope: string;
  created_at: string;
  permission_keys: string[];
}

export interface RoleCreateInput {
  name: string;
  scope: string;
  permission_keys: string[];
}

export interface RoleUpdateInput {
  name?: string;
  scope?: string;
  permission_keys?: string[];
}

export interface PermissionApiItem {
  id: string;
  key: string;
}

export interface PermissionCatalogApiItem {
  key: string;
  groupKey: string;
  labelKey: string;
  descriptionKey: string;
  risk?: "LOW" | "MEDIUM" | "HIGH" | null;
  deprecated?: boolean | null;
}

type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  details: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    requestId?: string | null;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiRequestError";
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId ?? null;
    this.details = params.details;
  }
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/+$/, "") : DEFAULT_API_BASE_URL;
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeError(
  status: number,
  payload: unknown,
  requestId: string | null,
): ApiRequestError {
  const defaultMessage = status >= 500 ? "Server error" : "Request failed";
  const details = payload as
    | {
        code?: string;
        detail?: string | { code?: string; message?: string };
        message?: string;
      }
    | undefined;

  const detailObj = typeof details?.detail === "object" && details?.detail !== null ? details.detail : null;
  const message =
    (detailObj && typeof detailObj.message === "string" && detailObj.message) ||
    (typeof details?.message === "string" && details.message) ||
    (typeof details?.detail === "string" && details.detail) ||
    defaultMessage;

  const code =
    (detailObj && typeof detailObj.code === "string" && detailObj.code) ||
    (typeof details?.code === "string" && details.code) ||
    `HTTP_${status}`;

  const payloadRequestId =
    typeof payload === "object" &&
    payload !== null &&
    "request_id" in payload &&
    typeof (payload as { request_id?: unknown }).request_id === "string"
      ? ((payload as { request_id: string }).request_id ?? null)
      : null;

  return new ApiRequestError({
    status,
    code,
    message,
    requestId: requestId ?? payloadRequestId,
    details: payload,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch (error) {
    throw new ApiRequestError({
      status: 0,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
      requestId: null,
    });
  }

  const payload = await parseJson(response);
  const requestId = response.headers.get("x-request-id");

  if (!response.ok) {
    throw normalizeError(response.status, payload, requestId);
  }

  return payload as T;
}

export async function loginWithPassword(params: {
  email: string;
  password: string;
}): Promise<{ type: "token"; data: TokenResponse } | { type: "challenge"; data: MfaChallengeResponse }> {
  const payload = await request<TokenResponse | MfaChallengeResponse>("/api/v1/auth/login", {
    method: "POST",
    body: params,
  });

  if ("challenge_id" in payload) {
    return { type: "challenge", data: payload };
  }
  return { type: "token", data: payload };
}

export async function verifyMfaChallenge(params: {
  challengeId: string;
  method: MfaMethod;
  code: string;
}): Promise<TokenResponse> {
  return request<TokenResponse>("/api/v1/auth/mfa/verify", {
    method: "POST",
    body: {
      challenge_id: params.challengeId,
      method: params.method,
      code: params.code,
    },
  });
}

export async function sendMfaCode(params: {
  challengeId: string;
  method: Extract<MfaMethod, "email" | "sms">;
}): Promise<void> {
  await request<null>("/api/v1/auth/mfa/send", {
    method: "POST",
    body: {
      challenge_id: params.challengeId,
      method: params.method,
    },
  });
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  return request<MeResponse>("/api/v1/me", {
    token: accessToken,
  });
}

export async function fetchI18nMessages(lang: string): Promise<I18nMessagesResponse> {
  return request<I18nMessagesResponse>(`/api/v1/i18n/messages?lang=${encodeURIComponent(lang)}`);
}

export async function listTenants(accessToken: string): Promise<PaginatedResponse<TenantApiItem>> {
  return request<PaginatedResponse<TenantApiItem>>("/api/v1/tenants?page=1&page_size=100", {
    token: accessToken,
  });
}

export async function createTenant(accessToken: string, payload: TenantCreateInput): Promise<TenantApiItem> {
  return request<TenantApiItem>("/api/v1/tenants", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateTenant(
  accessToken: string,
  tenantId: string,
  payload: TenantUpdateInput,
): Promise<TenantApiItem> {
  return request<TenantApiItem>(`/api/v1/tenants/${tenantId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deactivateTenant(accessToken: string, tenantId: string): Promise<TenantApiItem> {
  return updateTenant(accessToken, tenantId, { status: "PASSIVE" });
}

export async function listCompanies(accessToken: string): Promise<PaginatedResponse<CompanyApiItem>> {
  return request<PaginatedResponse<CompanyApiItem>>("/api/v1/companies?page=1&page_size=100", {
    token: accessToken,
  });
}

export async function createCompany(accessToken: string, payload: CompanyCreateInput): Promise<CompanyApiItem> {
  return request<CompanyApiItem>("/api/v1/companies", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateCompany(
  accessToken: string,
  companyId: string,
  payload: CompanyUpdateInput,
): Promise<CompanyApiItem> {
  return request<CompanyApiItem>(`/api/v1/companies/${companyId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deactivateCompany(accessToken: string, companyId: string): Promise<CompanyApiItem> {
  return updateCompany(accessToken, companyId, { status: "PASSIVE" });
}

export async function listProjects(accessToken: string): Promise<PaginatedResponse<ProjectApiItem>> {
  return request<PaginatedResponse<ProjectApiItem>>("/api/v1/projects?page=1&page_size=100", {
    token: accessToken,
  });
}

export async function createProject(accessToken: string, payload: ProjectCreateInput): Promise<ProjectApiItem> {
  return request<ProjectApiItem>("/api/v1/projects", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateProject(
  accessToken: string,
  projectId: string,
  payload: ProjectUpdateInput,
): Promise<ProjectApiItem> {
  return request<ProjectApiItem>(`/api/v1/projects/${projectId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteProject(accessToken: string, projectId: string): Promise<void> {
  await request<null>(`/api/v1/projects/${projectId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function listRoles(
  accessToken: string,
  page = 1,
  pageSize = 100,
): Promise<PaginatedResponse<RoleApiItem>> {
  return request<PaginatedResponse<RoleApiItem>>(
    `/api/v1/roles?page=${page}&page_size=${pageSize}`,
    {
      token: accessToken,
    },
  );
}

export async function createRole(accessToken: string, payload: RoleCreateInput): Promise<RoleApiItem> {
  return request<RoleApiItem>("/api/v1/roles", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateRole(
  accessToken: string,
  roleId: string,
  payload: RoleUpdateInput,
): Promise<RoleApiItem> {
  return request<RoleApiItem>(`/api/v1/roles/${roleId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteRole(accessToken: string, roleId: string): Promise<void> {
  await request<null>(`/api/v1/roles/${roleId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function listPermissions(
  accessToken: string,
  page = 1,
  pageSize = 100,
): Promise<PaginatedResponse<PermissionApiItem>> {
  return request<PaginatedResponse<PermissionApiItem>>(
    `/api/v1/permissions?page=${page}&page_size=${pageSize}`,
    {
      token: accessToken,
    },
  );
}

export async function listAdminPermissionCatalog(
  accessToken: string,
  page = 1,
  pageSize = 100,
): Promise<PaginatedResponse<PermissionCatalogApiItem>> {
  return request<PaginatedResponse<PermissionCatalogApiItem>>(
    `/api/v1/admin/iam/permissions?page=${page}&page_size=${pageSize}`,
    {
      token: accessToken,
    },
  );
}
