# Yap

Performant Discord alternative.

## CI / CD

GitHub Actions runs `pnpm build` on every pull request and push to `main`.

## Local infra

Start PostgreSQL, Redis, Typesense, and Keycloak:

```bash
pnpm dev:infra
```

Keycloak admin console: `http://localhost:8080/admin` (`admin` / `admin`).

## Environment

Create `.env` from `.env.example` and adjust values if needed:

```bash
cp .env.example .env
```

Required auth variables:

- `DATABASE_URL`
- `VITE_AUTH_URL`
- `KEYCLOAK_ISSUER`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`
- `CORS_ORIGIN`

## Database (Drizzle)

Generate migrations and apply them:

```bash
pnpm db:generate
pnpm db:migrate
```

This creates the `users` table in PostgreSQL from `packages/db/src/schema.ts`.

## Keycloak setup (OIDC)

1. Create realm `yap`.
2. Create a public client `yap-web`.
3. Enable `Standard flow` and `Direct access grants` on `yap-web`.
4. Set valid redirect URIs and web origins to `http://localhost:5173/*` and `http://localhost:5173`.
5. Create a confidential client `yap-admin` with service accounts enabled.
6. Give the `yap-admin` service account the `manage-users` and `view-users` realm-management roles.
7. Ensure access tokens include `sub`, `preferred_username` (or `name`), and `email`.

The auth form now sends credentials to the auth service, which talks to Keycloak on `/login` and `/register`, then verifies access tokens on `GET /me` and upserts users by Keycloak `sub`.

## Run services

```bash
pnpm dev
```

Auth service: `http://localhost:4001`.

## One-command startup

If you want everything in one go (infra + readiness wait + migrations + backend + frontend):

```bash
pnpm dev:boot
```

This command runs `dev:infra`, waits for PostgreSQL/Keycloak, applies `db:migrate`, then starts `dev:all`.