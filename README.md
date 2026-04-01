# Yap Starter Monorepo

This is a Phase 1 starter based on your roadmap:

- pnpm workspace with `backend/*`, `frontend`, and `packages/*`
- local infra with Postgres, Redis, Typesense
- starter services for auth/chat/presence/voice
- shared protocol package for WS opcodes
- SolidJS frontend scaffold

## 1) Install

```bash
pnpm install
```

## 2) Start local infra

```bash
pnpm dev:infra
```

## 3) Start services (separate terminals)

```bash
pnpm dev:auth
pnpm dev:chat
pnpm dev:presence
pnpm dev:voice
pnpm dev:frontend
```

## 3b) Or start backend services in one terminal

```bash
pnpm dev
```

This starts auth, chat, presence, and voice together. Start frontend separately with `pnpm dev:frontend`.

## Health endpoints

- auth: http://localhost:4001/health
- chat: http://localhost:4002/health
- presence: http://localhost:4004/health
- voice: http://localhost:4005/health
- frontend: http://localhost:5173

## Immediate next steps

1. Add `@fastify/cookie` and implement auth routes with refresh token rotation.
2. Add Drizzle in `packages/db` and create first migration.
3. Add `ws` gateway server with `HELLO`, `IDENTIFY`, `HEARTBEAT`.
4. Replace web placeholder with Discord-like shell layout.
