export type AuthSession = {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  id_token?: string;
};

export type CurrentUser = {
  id: string;
  sub: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type StoredAuthSession = AuthSession & {
  stored_at: number;
};

const STORAGE_KEY = "yap.auth.session";
const USER_STORAGE_KEY = "yap.auth.user";
const EXPIRY_SKEW_SECONDS = 30;

export function getAuthApiBaseUrl(): string {
  return import.meta.env.VITE_AUTH_URL ?? "http://localhost:4001";
}

export function saveAuthSession(session: AuthSession) {
  const stored: StoredAuthSession = {
    ...session,
    stored_at: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function loadAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.expires_in !== "number" ||
      typeof parsed.token_type !== "string"
    ) {
      clearAuthState();
      return null;
    }

    const storedAt =
      typeof parsed.stored_at === "number" ? parsed.stored_at : Date.now();
    const expiresAt = storedAt + Math.max(0, parsed.expires_in - EXPIRY_SKEW_SECONDS) * 1000;

    if (Date.now() >= expiresAt) {
      clearAuthState();
      return null;
    }

    return {
      access_token: parsed.access_token,
      expires_in: parsed.expires_in,
      refresh_expires_in: parsed.refresh_expires_in,
      refresh_token: parsed.refresh_token,
      token_type: parsed.token_type,
      scope: parsed.scope,
      id_token: parsed.id_token,
    };
  } catch {
    clearAuthState();
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveCurrentUser(user: CurrentUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function loadCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CurrentUser>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.sub !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      clearCurrentUser();
      return null;
    }

    return {
      id: parsed.id,
      sub: parsed.sub,
      username: parsed.username,
      email: parsed.email,
      avatarUrl: parsed.avatarUrl ?? null,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    clearCurrentUser();
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearAuthState() {
  clearAuthSession();
  clearCurrentUser();
}