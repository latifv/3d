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

export interface MfaPolicyApiResponse {
  tenant_id: string;
  mfa_enabled: boolean;
  mfa_methods: string[];
  mfa_required_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface MfaPolicyUpdateInput {
  mfa_enabled?: boolean;
  mfa_methods?: string[];
  mfa_required_roles?: string[];
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

export interface DatacenterApiItem {
  id: string;
  code: string;
  notes: string | null;
  status: "ACTIVE" | "PASSIVE";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DatacenterListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "ACTIVE" | "PASSIVE";
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface DatacenterCreateInput {
  code: string;
  notes?: string | null;
  status?: "ACTIVE" | "PASSIVE";
  metadata?: Record<string, unknown> | null;
}

export interface DatacenterUpdateInput {
  code?: string;
  notes?: string | null;
  status?: "ACTIVE" | "PASSIVE";
  metadata?: Record<string, unknown> | null;
}

export interface ServiceAccessApiItem {
  id: string;
  datacenter_id: string;
  service_type: "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING";
  base_url: string;
  credential_ref: string;
  status: "ACTIVE" | "PASSIVE";
  health_status: "UNKNOWN" | "UP" | "DOWN";
  last_health_check_at: string | null;
  timeout_seconds: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceAccessListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "ACTIVE" | "PASSIVE";
  serviceType?: "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING";
  datacenterId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface ServiceAccessCreateInput {
  datacenter_id: string;
  service_type: "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING";
  base_url: string;
  credential_ref: string;
  status?: "ACTIVE" | "PASSIVE";
  timeout_seconds?: number;
  metadata?: Record<string, unknown> | null;
}

export interface ServiceAccessUpdateInput {
  datacenter_id?: string;
  service_type?: "VCENTER" | "NUTANIX" | "NETBACKUP" | "MONITORING";
  base_url?: string;
  credential_ref?: string;
  status?: "ACTIVE" | "PASSIVE";
  timeout_seconds?: number;
  metadata?: Record<string, unknown> | null;
}

export interface NetworkProviderApiItem {
  id: string;
  name: string;
  vendor: string;
  endpoint: string;
  datacenter_id: string | null;
  datacenter_name?: string | null;
  status: "ACTIVE" | "PASSIVE";
  health_status?: "UNKNOWN" | "UP" | "DOWN";
  last_health_check_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NetworkProviderListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "ACTIVE" | "PASSIVE";
  vendor?: string;
  datacenterId?: string;
}

export interface NetworkProviderCreateInput {
  name: string;
  vendor: string;
  endpoint: string;
  datacenter_id?: string | null;
  status?: "ACTIVE" | "PASSIVE";
  notes?: string | null;
}

export interface NetworkProviderUpdateInput {
  name?: string;
  vendor?: string;
  endpoint?: string;
  datacenter_id?: string | null;
  status?: "ACTIVE" | "PASSIVE";
  notes?: string | null;
}

export interface ProviderHealthTestResponse {
  ok: boolean;
  message: string;
  latency_ms?: number | null;
}

export interface MonitoringAccessApiRef {
  id: string;
  name: string;
}

export interface MonitoringAccessProjectRef {
  id: string;
  name: string;
}

export interface MonitoringAccessApiItem {
  id: string;
  name: string;
  provider: MonitoringAccessApiRef;
  service_access: MonitoringAccessApiRef;
  scope: "TENANT" | "PROJECT";
  project: MonitoringAccessProjectRef | null;
  status: "ACTIVE" | "DISABLED";
  health: "OK" | "WARNING" | "ERROR" | "UNKNOWN";
  last_test_at: string | null;
  last_test_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoringAccessListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  providerId?: string;
  serviceAccessId?: string;
  status?: "ACTIVE" | "DISABLED";
  scope?: "TENANT" | "PROJECT";
  projectId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface MonitoringAccessCreateInput {
  name: string;
  provider_id: string;
  service_access_id: string;
  scope: "TENANT" | "PROJECT";
  project_id?: string | null;
  status?: "ACTIVE" | "DISABLED";
}

export interface MonitoringAccessUpdateInput {
  name?: string;
  provider_id?: string;
  service_access_id?: string;
  scope?: "TENANT" | "PROJECT";
  project_id?: string | null;
  status?: "ACTIVE" | "DISABLED";
}

export interface PortalUserCompanyRef {
  id: string;
  name: string;
}

export interface PortalUserApiItem {
  id: string;
  tenant_id: string;
  company_id: string | null;
  company: PortalUserCompanyRef | null;
  auth_user_id: string | null;
  username: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role_key: string | null;
  status: string;
  last_seen_at: string | null;
  last_login_at: string | null;
  login_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PortalUserListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  role?: string;
  companyId?: string;
}

export interface PortalUserCreateInput {
  tenant_id?: string | null;
  username?: string | null;
  full_name: string;
  email?: string | null;
  company_id: string;
  role_key: string;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
}

export interface PortalUserUpdateInput {
  username?: string | null;
  full_name?: string;
  email?: string | null;
  company_id?: string;
  role_key?: string;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
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

export interface ContactTypeApiItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactTypeListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  isActive?: boolean;
}

export interface ContactTypeCreateInput {
  tenant_id?: string | null;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ContactTypeUpdateInput {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ContactApiItem {
  id: string;
  tenant_id: string;
  company_id: string;
  contact_type_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  companyId?: string;
  contactTypeId?: string;
}

export interface ContactCreateInput {
  tenant_id?: string | null;
  company_id: string;
  contact_type_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_primary?: boolean;
}

export interface ContactUpdateInput {
  company_id?: string;
  contact_type_id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_primary?: boolean;
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

export async function fetchApiLiveStatus(timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl("/health/live"), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return false;
    }

    const payload = await parseJson(response);
    const status =
      typeof payload === "object" &&
      payload !== null &&
      "status" in payload &&
      typeof (payload as { status?: unknown }).status === "string"
        ? (payload as { status: string }).status
        : "";
    return status.toLowerCase() === "ok";
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getMfaPolicy(
  accessToken: string,
  params: { tenantId?: string } = {},
): Promise<MfaPolicyApiResponse> {
  const query = new URLSearchParams();
  if (params.tenantId) {
    query.set("tenant_id", params.tenantId);
  }
  const qs = query.toString();
  return request<MfaPolicyApiResponse>(`/api/v1/settings/security/mfa-policy${qs ? `?${qs}` : ""}`, {
    token: accessToken,
  });
}

export async function updateMfaPolicy(
  accessToken: string,
  payload: MfaPolicyUpdateInput,
  params: { tenantId?: string } = {},
): Promise<MfaPolicyApiResponse> {
  const query = new URLSearchParams();
  if (params.tenantId) {
    query.set("tenant_id", params.tenantId);
  }
  const qs = query.toString();
  return request<MfaPolicyApiResponse>(`/api/v1/settings/security/mfa-policy${qs ? `?${qs}` : ""}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
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

export async function listDatacenters(
  accessToken: string,
  params: DatacenterListParams = {},
): Promise<PaginatedResponse<DatacenterApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.sortBy) {
    query.set("sort_by", params.sortBy);
  }
  if (params.sortDir) {
    query.set("sort_dir", params.sortDir);
  }
  return request<PaginatedResponse<DatacenterApiItem>>(`/api/v1/datacenters?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getDatacenter(accessToken: string, datacenterId: string): Promise<DatacenterApiItem> {
  return request<DatacenterApiItem>(`/api/v1/datacenters/${datacenterId}`, {
    token: accessToken,
  });
}

export async function createDatacenter(
  accessToken: string,
  payload: DatacenterCreateInput,
): Promise<DatacenterApiItem> {
  return request<DatacenterApiItem>("/api/v1/datacenters", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateDatacenter(
  accessToken: string,
  datacenterId: string,
  payload: DatacenterUpdateInput,
): Promise<DatacenterApiItem> {
  return request<DatacenterApiItem>(`/api/v1/datacenters/${datacenterId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteDatacenter(accessToken: string, datacenterId: string): Promise<void> {
  await request<null>(`/api/v1/datacenters/${datacenterId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function listServiceAccesses(
  accessToken: string,
  params: ServiceAccessListParams = {},
): Promise<PaginatedResponse<ServiceAccessApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.serviceType) {
    query.set("service_type", params.serviceType);
  }
  if (params.datacenterId) {
    query.set("datacenter_id", params.datacenterId);
  }
  if (params.sortBy) {
    query.set("sort_by", params.sortBy);
  }
  if (params.sortDir) {
    query.set("sort_dir", params.sortDir);
  }
  return request<PaginatedResponse<ServiceAccessApiItem>>(`/api/v1/service-accesses?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getServiceAccess(accessToken: string, serviceAccessId: string): Promise<ServiceAccessApiItem> {
  return request<ServiceAccessApiItem>(`/api/v1/service-accesses/${serviceAccessId}`, {
    token: accessToken,
  });
}

export async function createServiceAccess(
  accessToken: string,
  payload: ServiceAccessCreateInput,
): Promise<ServiceAccessApiItem> {
  return request<ServiceAccessApiItem>("/api/v1/service-accesses", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateServiceAccess(
  accessToken: string,
  serviceAccessId: string,
  payload: ServiceAccessUpdateInput,
): Promise<ServiceAccessApiItem> {
  return request<ServiceAccessApiItem>(`/api/v1/service-accesses/${serviceAccessId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteServiceAccess(accessToken: string, serviceAccessId: string): Promise<void> {
  await request<null>(`/api/v1/service-accesses/${serviceAccessId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function healthCheckServiceAccess(
  accessToken: string,
  serviceAccessId: string,
): Promise<ServiceAccessApiItem> {
  return request<ServiceAccessApiItem>(`/api/v1/service-accesses/${serviceAccessId}/health-check`, {
    method: "POST",
    token: accessToken,
  });
}

export async function listNetworkProviders(
  accessToken: string,
  params: NetworkProviderListParams = {},
): Promise<PaginatedResponse<NetworkProviderApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.vendor) {
    query.set("vendor", params.vendor);
  }
  if (params.datacenterId) {
    query.set("datacenter_id", params.datacenterId);
  }
  return request<PaginatedResponse<NetworkProviderApiItem>>(`/api/v1/providers/network-providers?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getNetworkProvider(
  accessToken: string,
  networkProviderId: string,
): Promise<NetworkProviderApiItem> {
  return request<NetworkProviderApiItem>(`/api/v1/providers/network-providers/${networkProviderId}`, {
    token: accessToken,
  });
}

export async function createNetworkProvider(
  accessToken: string,
  payload: NetworkProviderCreateInput,
): Promise<NetworkProviderApiItem> {
  return request<NetworkProviderApiItem>("/api/v1/providers/network-providers", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateNetworkProvider(
  accessToken: string,
  networkProviderId: string,
  payload: NetworkProviderUpdateInput,
): Promise<NetworkProviderApiItem> {
  return request<NetworkProviderApiItem>(`/api/v1/providers/network-providers/${networkProviderId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteNetworkProvider(accessToken: string, networkProviderId: string): Promise<void> {
  await request<null>(`/api/v1/providers/network-providers/${networkProviderId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function testNetworkProvider(
  accessToken: string,
  networkProviderId: string,
): Promise<ProviderHealthTestResponse> {
  return request<ProviderHealthTestResponse>(`/api/v1/providers/network-providers/${networkProviderId}:test`, {
    method: "POST",
    token: accessToken,
  });
}

export async function exportNetworkProvidersCsv(
  accessToken: string,
  params: Omit<NetworkProviderListParams, "page" | "pageSize"> = {},
): Promise<void> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.vendor) {
    query.set("vendor", params.vendor);
  }
  if (params.datacenterId) {
    query.set("datacenter_id", params.datacenterId);
  }

  const response = await fetch(buildUrl(`/api/v1/providers/network-providers/export?${query.toString()}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw normalizeError(response.status, payload, response.headers.get("x-request-id"));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "network-providers.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function listMonitoringAccesses(
  accessToken: string,
  params: MonitoringAccessListParams = {},
): Promise<PaginatedResponse<MonitoringAccessApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.providerId) {
    query.set("provider_id", params.providerId);
  }
  if (params.serviceAccessId) {
    query.set("service_access_id", params.serviceAccessId);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.scope) {
    query.set("scope", params.scope);
  }
  if (params.projectId) {
    query.set("project_id", params.projectId);
  }
  if (params.sortBy) {
    query.set("sort_by", params.sortBy);
  }
  if (params.sortDir) {
    query.set("sort_dir", params.sortDir);
  }
  return request<PaginatedResponse<MonitoringAccessApiItem>>(
    `/api/v1/providers/monitoring-accesses?${query.toString()}`,
    {
      token: accessToken,
    },
  );
}

export async function getMonitoringAccess(
  accessToken: string,
  monitoringAccessId: string,
): Promise<MonitoringAccessApiItem> {
  return request<MonitoringAccessApiItem>(`/api/v1/providers/monitoring-accesses/${monitoringAccessId}`, {
    token: accessToken,
  });
}

export async function createMonitoringAccess(
  accessToken: string,
  payload: MonitoringAccessCreateInput,
): Promise<MonitoringAccessApiItem> {
  return request<MonitoringAccessApiItem>("/api/v1/providers/monitoring-accesses", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateMonitoringAccess(
  accessToken: string,
  monitoringAccessId: string,
  payload: MonitoringAccessUpdateInput,
): Promise<MonitoringAccessApiItem> {
  return request<MonitoringAccessApiItem>(`/api/v1/providers/monitoring-accesses/${monitoringAccessId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteMonitoringAccess(accessToken: string, monitoringAccessId: string): Promise<void> {
  await request<null>(`/api/v1/providers/monitoring-accesses/${monitoringAccessId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function testMonitoringAccess(
  accessToken: string,
  monitoringAccessId: string,
): Promise<ProviderHealthTestResponse> {
  return request<ProviderHealthTestResponse>(`/api/v1/providers/monitoring-accesses/${monitoringAccessId}:test`, {
    method: "POST",
    token: accessToken,
  });
}

export async function exportMonitoringAccessesCsv(
  accessToken: string,
  params: Omit<MonitoringAccessListParams, "page" | "pageSize"> = {},
): Promise<void> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.providerId) {
    query.set("provider_id", params.providerId);
  }
  if (params.serviceAccessId) {
    query.set("service_access_id", params.serviceAccessId);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.scope) {
    query.set("scope", params.scope);
  }
  if (params.projectId) {
    query.set("project_id", params.projectId);
  }

  const response = await fetch(buildUrl(`/api/v1/providers/monitoring-accesses/export?${query.toString()}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw normalizeError(response.status, payload, response.headers.get("x-request-id"));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "monitoring-accesses.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
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

export async function listPortalUsers(
  accessToken: string,
  params: PortalUserListParams = {},
): Promise<PaginatedResponse<PortalUserApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.role) {
    query.set("role", params.role);
  }
  if (params.companyId) {
    query.set("company_id", params.companyId);
  }
  return request<PaginatedResponse<PortalUserApiItem>>(`/api/v1/portal-users?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getPortalUser(accessToken: string, portalUserId: string): Promise<PortalUserApiItem> {
  return request<PortalUserApiItem>(`/api/v1/portal-users/${portalUserId}`, {
    token: accessToken,
  });
}

export async function createPortalUser(
  accessToken: string,
  payload: PortalUserCreateInput,
): Promise<PortalUserApiItem> {
  return request<PortalUserApiItem>("/api/v1/portal-users", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updatePortalUser(
  accessToken: string,
  portalUserId: string,
  payload: PortalUserUpdateInput,
): Promise<PortalUserApiItem> {
  return request<PortalUserApiItem>(`/api/v1/portal-users/${portalUserId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function suspendPortalUser(accessToken: string, portalUserId: string): Promise<PortalUserApiItem> {
  return request<PortalUserApiItem>(`/api/v1/portal-users/${portalUserId}:suspend`, {
    method: "POST",
    token: accessToken,
  });
}

export async function activatePortalUser(accessToken: string, portalUserId: string): Promise<PortalUserApiItem> {
  return request<PortalUserApiItem>(`/api/v1/portal-users/${portalUserId}:activate`, {
    method: "POST",
    token: accessToken,
  });
}

export async function exportPortalUsersCsv(
  accessToken: string,
  params: Omit<PortalUserListParams, "page" | "pageSize"> = {},
): Promise<void> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.role) {
    query.set("role", params.role);
  }
  if (params.companyId) {
    query.set("company_id", params.companyId);
  }

  const response = await fetch(buildUrl(`/api/v1/portal-users/export?${query.toString()}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw normalizeError(response.status, payload, response.headers.get("x-request-id"));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "portal-users.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
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

export async function listContactTypes(
  accessToken: string,
  params: ContactTypeListParams = {},
): Promise<PaginatedResponse<ContactTypeApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (typeof params.isActive === "boolean") {
    query.set("is_active", String(params.isActive));
  }
  return request<PaginatedResponse<ContactTypeApiItem>>(`/api/v1/contact-types?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getContactType(accessToken: string, contactTypeId: string): Promise<ContactTypeApiItem> {
  return request<ContactTypeApiItem>(`/api/v1/contact-types/${contactTypeId}`, {
    token: accessToken,
  });
}

export async function createContactType(
  accessToken: string,
  payload: ContactTypeCreateInput,
): Promise<ContactTypeApiItem> {
  return request<ContactTypeApiItem>("/api/v1/contact-types", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateContactType(
  accessToken: string,
  contactTypeId: string,
  payload: ContactTypeUpdateInput,
): Promise<ContactTypeApiItem> {
  return request<ContactTypeApiItem>(`/api/v1/contact-types/${contactTypeId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteContactType(accessToken: string, contactTypeId: string): Promise<void> {
  await request<null>(`/api/v1/contact-types/${contactTypeId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function exportContactTypesCsv(
  accessToken: string,
  params: Omit<ContactTypeListParams, "page" | "pageSize"> = {},
): Promise<void> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (typeof params.isActive === "boolean") {
    query.set("is_active", String(params.isActive));
  }

  const response = await fetch(buildUrl(`/api/v1/contact-types/export?${query.toString()}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/csv",
    },
  });
  if (!response.ok) {
    const payload = await parseJson(response);
    throw normalizeError(response.status, payload, response.headers.get("x-request-id"));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "contact-types.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function listContacts(
  accessToken: string,
  params: ContactListParams = {},
): Promise<PaginatedResponse<ContactApiItem>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.companyId) {
    query.set("company_id", params.companyId);
  }
  if (params.contactTypeId) {
    query.set("contact_type_id", params.contactTypeId);
  }
  return request<PaginatedResponse<ContactApiItem>>(`/api/v1/contacts?${query.toString()}`, {
    token: accessToken,
  });
}

export async function getContact(accessToken: string, contactId: string): Promise<ContactApiItem> {
  return request<ContactApiItem>(`/api/v1/contacts/${contactId}`, {
    token: accessToken,
  });
}

export async function createContact(accessToken: string, payload: ContactCreateInput): Promise<ContactApiItem> {
  return request<ContactApiItem>("/api/v1/contacts", {
    method: "POST",
    token: accessToken,
    body: payload,
  });
}

export async function updateContact(
  accessToken: string,
  contactId: string,
  payload: ContactUpdateInput,
): Promise<ContactApiItem> {
  return request<ContactApiItem>(`/api/v1/contacts/${contactId}`, {
    method: "PATCH",
    token: accessToken,
    body: payload,
  });
}

export async function deleteContact(accessToken: string, contactId: string): Promise<void> {
  await request<null>(`/api/v1/contacts/${contactId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function exportContactsCsv(
  accessToken: string,
  params: Omit<ContactListParams, "page" | "pageSize"> = {},
): Promise<void> {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.companyId) {
    query.set("company_id", params.companyId);
  }
  if (params.contactTypeId) {
    query.set("contact_type_id", params.contactTypeId);
  }

  const response = await fetch(buildUrl(`/api/v1/contacts/export?${query.toString()}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/csv",
    },
  });
  if (!response.ok) {
    const payload = await parseJson(response);
    throw normalizeError(response.status, payload, response.headers.get("x-request-id"));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "contacts.csv";
  anchor.click();
  window.URL.revokeObjectURL(url);
}
