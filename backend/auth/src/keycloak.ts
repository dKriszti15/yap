import type {
  AdminUserPayload,
  KeycloakAdminUser,
  RegisterResult,
  TokenResponse,
} from "./types/keycloak.js";

async function clearUserRequiredActions(
  serverOrigin: string,
  realm: string,
  userId: string,
  accessToken: string,
) {
  const response = await fetch(
    `${serverOrigin}/admin/realms/${realm}/users/${userId}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        enabled: true,
        emailVerified: true,
        requiredActions: [],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `User update failed with status ${response.status}`);
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeIssuer(issuer: string): string {
  return issuer.replace(/\/$/, "");
}

function getRealmFromIssuer(issuer: string): string {
  const url = new URL(normalizeIssuer(issuer));
  const parts = url.pathname.split("/").filter(Boolean);
  const realm = parts.at(-1);

  if (!realm) {
    throw new Error("KEYCLOAK_ISSUER must include a realm path like /realms/yap");
  }

  return realm;
}

function getServerOriginFromIssuer(issuer: string): string {
  const url = new URL(normalizeIssuer(issuer));
  return url.origin;
}

function getTokenEndpoint(issuer: string): string {
  return `${normalizeIssuer(issuer)}/protocol/openid-connect/token`;
}

function getAdminUsersEndpoint(issuer: string): string {
  const serverOrigin = getServerOriginFromIssuer(issuer);
  const realm = getRealmFromIssuer(issuer);
  return `${serverOrigin}/admin/realms/${realm}/users`;
}

async function fetchJson<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function requestPasswordToken(username: string, password: string) {
  const issuer = requiredEnv("KEYCLOAK_ISSUER");
  const clientId = requiredEnv("KEYCLOAK_CLIENT_ID");

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
  });

  return fetchJson<TokenResponse>(getTokenEndpoint(issuer), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

async function findUserByUsername(
  serverOrigin: string,
  realm: string,
  username: string,
  accessToken: string,
) {
  const url = new URL(`${serverOrigin}/admin/realms/${realm}/users`);
  url.searchParams.set("username", username);
  url.searchParams.set("exact", "true");

  const users = await fetchJson<KeycloakAdminUser[]>(url.toString(), {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  return users.find((user) => user.username === username) ?? null;
}

async function normalizeUserForPasswordGrant(username: string) {
  const issuer = requiredEnv("KEYCLOAK_ISSUER");
  const accessToken = await getAdminAccessToken();
  const serverOrigin = getServerOriginFromIssuer(issuer);
  const realm = getRealmFromIssuer(issuer);
  const user = await findUserByUsername(serverOrigin, realm, username, accessToken);

  if (!user) {
    return;
  }

  const response = await fetch(`${serverOrigin}/admin/realms/${realm}/users/${user.id}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      enabled: true,
      emailVerified: true,
      requiredActions: [],
      firstName: user.firstName ?? username,
      lastName: user.lastName ?? "User",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `User normalization failed with status ${response.status}`);
  }
}

export async function loginWithPassword(username: string, password: string) {
  try {
    return await requestPasswordToken(username, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isSetupError = message.includes("Account is not fully set up");

    if (!isSetupError) {
      throw error;
    }

    await normalizeUserForPasswordGrant(username);
    return requestPasswordToken(username, password);
  }
}

async function getAdminAccessToken() {
  const issuer = requiredEnv("KEYCLOAK_ISSUER");
  const clientId = requiredEnv("KEYCLOAK_ADMIN_CLIENT_ID");
  const clientSecret = requiredEnv("KEYCLOAK_ADMIN_CLIENT_SECRET");

  if (clientSecret === "replace-me") {
    throw new Error("KEYCLOAK_ADMIN_CLIENT_SECRET is still set to replace-me");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetchJson<TokenResponse>(getTokenEndpoint(issuer), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return response.access_token;
}

export async function registerKeycloakUser(payload: AdminUserPayload): Promise<RegisterResult> {
  const issuer = requiredEnv("KEYCLOAK_ISSUER");
  const accessToken = await getAdminAccessToken();
  const serverOrigin = getServerOriginFromIssuer(issuer);
  const realm = getRealmFromIssuer(issuer);

  const createResponse = await fetch(getAdminUsersEndpoint(issuer), {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username,
      firstName: payload.username,
      lastName: "User",
      email: payload.email,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
      credentials: [],
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(errorText || `User creation failed with status ${createResponse.status}`);
  }

  const location = createResponse.headers.get("location");
  const userId = location?.split("/").at(-1);

  if (!userId) {
    throw new Error("Keycloak did not return a created user id");
  }

  const resetPasswordResponse = await fetch(
    `${serverOrigin}/admin/realms/${realm}/users/${userId}/reset-password`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "password",
        value: payload.password,
        temporary: false,
      }),
    },
  );

  if (!resetPasswordResponse.ok) {
    const errorText = await resetPasswordResponse.text();
    throw new Error(errorText || `Password update failed with status ${resetPasswordResponse.status}`);
  }

  await clearUserRequiredActions(serverOrigin, realm, userId, accessToken);

  return {
    created: true,
    username: payload.username,
    email: payload.email,
  };
}