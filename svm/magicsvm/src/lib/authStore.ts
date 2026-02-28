import type { Role, User } from "@/types";
import type { MeResponse, TokenResponse } from "@/lib/apiClient";

const ACCESS_TOKEN_KEY = "auth.access_token";
const REFRESH_TOKEN_KEY = "auth.refresh_token";
const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

let meSnapshot: MeResponse | null = null;

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export function getStoredTokens(): StoredTokens {
  if (!canUseStorage()) {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function saveTokens(tokens: TokenResponse): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearTokens(): void {
  if (!canUseStorage()) {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setMeSnapshot(me: MeResponse | null): void {
  meSnapshot = me;
}

export function getMeSnapshot(): MeResponse | null {
  return meSnapshot;
}

function normalizeRole(me: MeResponse): Role {
  if (me.is_system_admin) {
    return "SYSTEM_ADMIN";
  }

  const knownRoles: Role[] = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "RESELLER_ADMIN", "TENANT_ADMIN", "TENANT_USER"];
  for (const role of me.roles) {
    if (knownRoles.includes(role as Role)) {
      return role as Role;
    }
  }
  return "TENANT_USER";
}

export function mapMeToUser(me: MeResponse, roleOverride?: Role): User {
  const role = roleOverride ?? normalizeRole(me);
  return {
    id: me.id,
    email: me.email,
    full_name: me.full_name,
    avatar_url: "",
    role,
    status: me.tenant_status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    tenant_id: me.tenant_id ?? undefined,
    roles: [...me.roles],
    permissions: [...me.permissions],
    language: me.language,
  };
}
