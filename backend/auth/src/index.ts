import cors from "@fastify/cors";
import Fastify from "fastify";
import { config as loadEnv } from "dotenv";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";

import { db, users } from "@yap/db";
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
const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

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

const app = Fastify({ logger: true });

app.register(cors, { origin: allowedOrigin, credentials: true });

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
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return reply.code(401).send({
      ok: false,
      error: "Missing Bearer token",
    });
  }

  try {
    const claims = await verifyKeycloakToken(token);
    const user = await upsertUser(claims);

    return {
      ok: true,
      user,
    };
  } catch (error) {
    if (error instanceof errors.JOSEError || error instanceof TokenValidationError) {
      return reply.code(401).send({
        ok: false,
        error: "Invalid or expired token",
      });
    }

    request.log.error(error);
    return reply.code(500).send({ ok: false, error: "Authentication failed" });
  }
});

app.listen({ port: 4001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
