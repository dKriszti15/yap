import cors from "@fastify/cors";
import Fastify from "fastify";
import { config as loadEnv } from "dotenv";
import { eq, ilike } from "drizzle-orm";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";

import { db, friendships, groupMembers, groups, users } from "@yap/db";
import { loginWithPassword, registerKeycloakUser } from "./keycloak.js";
import type {
  KeycloakClaims,
  LoginRequestBody,
  RegisterRequestBody,
} from "./types/auth.js";

loadEnv({ path: "../../.env" });
loadEnv();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const keycloakIssuer = requiredEnv("KEYCLOAK_ISSUER").replace(/\/$/, "");
const keycloakAudience = requiredEnv("KEYCLOAK_CLIENT_ID");
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin || origin === "null") {
    return true;
  }

  if (allowedOrigins.length === 0) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }

  return allowedOrigins.includes(origin);
}

const jwks = createRemoteJWKSet(
  new URL(`${keycloakIssuer}/protocol/openid-connect/certs`),
);

class TokenValidationError extends Error {}

function hasExpectedAudience(audClaim: unknown, expectedAudience: string): boolean {
  if (typeof audClaim === "string") {
    return audClaim === expectedAudience;
  }

  if (Array.isArray(audClaim)) {
    return audClaim.includes(expectedAudience);
  }

  return false;
}

async function verifyKeycloakToken(token: string): Promise<KeycloakClaims> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: keycloakIssuer,
  });

  const audienceMatches = hasExpectedAudience(payload.aud, keycloakAudience);
  const authorizedParty =
    typeof payload.azp === "string" ? payload.azp : undefined;

  if (!audienceMatches && authorizedParty !== keycloakAudience) {
    throw new TokenValidationError("Token audience does not match configured client");
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new TokenValidationError("Token is missing sub claim");
  }

  return {
    sub: payload.sub,
    preferred_username:
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

async function upsertUser(claims: KeycloakClaims) {
  const username = claims.preferred_username ?? claims.name ?? "user";
  const email = claims.email ?? `${claims.sub}@keycloak.local`;

  const [user] = await db
    .insert(users)
    .values({
      sub: claims.sub,
      username,
      email,
      avatarUrl: claims.picture ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.sub,
      set: {
        username,
        email,
        avatarUrl: claims.picture ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

async function getAuthenticatedUser(request: {
  headers: {
    authorization?: string;
  };
}) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return {
      ok: false as const,
      statusCode: 401,
      error: "Missing Bearer token",
    };
  }

  try {
    const claims = await verifyKeycloakToken(token);
    const user = await upsertUser(claims);

    return {
      ok: true as const,
      user,
    };
  } catch (error) {
    if (error instanceof errors.JOSEError || error instanceof TokenValidationError) {
      return {
        ok: false as const,
        statusCode: 401,
        error: "Invalid or expired token",
      };
    }

    throw error;
  }
}

const app = Fastify({ logger: true });

app.register(cors, {
  origin(origin, callback) {
    callback(null, isAllowedCorsOrigin(origin));
  },
  credentials: true,
});

app.get("/health", async () => ({ ok: true, service: "auth" }));

app.post("/login", async (request, reply) => {
  const body = request.body as LoginRequestBody;
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return reply.code(400).send({ ok: false, error: "Username and password are required" });
  }

  try {
    const tokenResponse = await loginWithPassword(username, password);
    return { ok: true, ...tokenResponse };
  } catch (error) {
    request.log.error(error);
    const message = error instanceof Error ? error.message : "Invalid username or password";
    return reply.code(401).send({ ok: false, error: message });
  }
});

app.post("/register", async (request, reply) => {
  const body = request.body as RegisterRequestBody;

  const username = body.username?.trim();
  const email = body.email?.trim();
  const password = body.password;

  if (!username || !email || !password) {
    return reply.code(400).send({ ok: false, error: "Username, email, and password are required" });
  }

  try {
    const createdUser = await registerKeycloakUser({ username, email, password });
    return {
      ok: true,
      accountCreated: true,
      user: createdUser,
      message: "Account created. Please sign in.",
    };
  } catch (error) {
    request.log.error(error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return reply.code(400).send({ ok: false, error: message });
  }
});

app.get("/me", async (request, reply) => {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.ok) {
      return reply.code(auth.statusCode).send({
        ok: false,
        error: auth.error,
      });
    }

    return {
      ok: true,
      user: auth.user,
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ ok: false, error: "Authentication failed" });
  }
});

app.get("/social/overview", async (request, reply) => {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.ok) {
      return reply.code(auth.statusCode).send({
        ok: false,
        error: auth.error,
      });
    }

    const friendRows = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.friendId))
      .where(eq(friendships.userId, auth.user.id));

    const groupRows = await db
      .select({
        id: groups.id,
        name: groups.name,
        role: groupMembers.role,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, auth.user.id));

    const memberCountsRaw = await db
      .select({
        groupId: groupMembers.groupId,
      })
      .from(groupMembers);

    const memberCountByGroup = new Map<string, number>();
    for (const row of memberCountsRaw) {
      const previousCount = memberCountByGroup.get(row.groupId) ?? 0;
      memberCountByGroup.set(row.groupId, previousCount + 1);
    }

    return {
      ok: true,
      friends: friendRows.map((row) => ({
        id: row.id,
        username: row.username,
        status: "offline",
      })),
      groups: groupRows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        memberCount: memberCountByGroup.get(row.id) ?? 0,
      })),
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ ok: false, error: "Failed to load social overview" });
  }
});

app.post("/social/friends", async (request, reply) => {
  const body = request.body as { username?: string };
  const username = body.username?.trim();

  if (!username) {
    return reply.code(400).send({ ok: false, error: "Friend username is required" });
  }

  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.ok) {
      return reply.code(auth.statusCode).send({
        ok: false,
        error: auth.error,
      });
    }

    const [friendUser] = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(ilike(users.username, username))
      .limit(1);

    if (!friendUser) {
      return reply.code(404).send({ ok: false, error: "User not found" });
    }

    if (friendUser.id === auth.user.id) {
      return reply.code(400).send({ ok: false, error: "You cannot add yourself" });
    }

    await db
      .insert(friendships)
      .values([
        {
          userId: auth.user.id,
          friendId: friendUser.id,
        },
        {
          userId: friendUser.id,
          friendId: auth.user.id,
        },
      ])
      .onConflictDoNothing({ target: [friendships.userId, friendships.friendId] });

    return {
      ok: true,
      friend: {
        id: friendUser.id,
        username: friendUser.username,
        status: "offline",
      },
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ ok: false, error: "Failed to add friend" });
  }
});

app.post("/social/groups/join", async (request, reply) => {
  const body = request.body as { name?: string };
  const groupName = body.name?.trim();

  if (!groupName) {
    return reply.code(400).send({ ok: false, error: "Group name is required" });
  }

  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.ok) {
      return reply.code(auth.statusCode).send({
        ok: false,
        error: auth.error,
      });
    }

    let [groupRow] = await db
      .select({
        id: groups.id,
        name: groups.name,
      })
      .from(groups)
      .where(ilike(groups.name, groupName))
      .limit(1);

    if (!groupRow) {
      [groupRow] = await db
        .insert(groups)
        .values({ name: groupName })
        .returning({ id: groups.id, name: groups.name });
    }

    await db
      .insert(groupMembers)
      .values({
        groupId: groupRow.id,
        userId: auth.user.id,
        role: "member",
      })
      .onConflictDoNothing({ target: [groupMembers.groupId, groupMembers.userId] });

    const members = await db
      .select({
        userId: groupMembers.userId,
      })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupRow.id));

    return {
      ok: true,
      group: {
        id: groupRow.id,
        name: groupRow.name,
        role: "member",
        memberCount: members.length,
      },
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ ok: false, error: "Failed to join group" });
  }
});

app.listen({ port: 4001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
