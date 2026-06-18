# CleanPath

Application web mobile de suivi d'abstinence avec comptes utilisateurs et synchronisation PostgreSQL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run dev:web` — run the Vite frontend (port 5173)
- `pnpm run build:production` — build the frontend and API for production
- `pnpm start` — start the unified production server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `APP_ORIGIN` / `CORS_ORIGIN` — accepted frontend origin in split development

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: email/password (scrypt), hashed session tokens, secure HttpOnly cookies
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend: `artifacts/cleanpath`
- API: `artifacts/api-server`
- Database schema: `lib/db/src/schema/index.ts`
- Authentication routes: `artifacts/api-server/src/routes/auth.ts`
- Account data synchronization: `artifacts/api-server/src/routes/data.ts`

## Architecture decisions

- Production uses one Express service for both API and the built Vite app.
- Authentication sessions use random bearer tokens in secure HttpOnly cookies; only token hashes are stored.
- Each account owns one JSON document containing its journal data, while structured auth data remains relational.
- Existing local data is imported into a newly created account when the remote account has no journal data yet.

## Product

- Create an account and sign in from multiple devices.
- Track abstinent days, consumptions, cravings, emotions, goals, contacts, and a safety plan.
- Synchronize the journal with PostgreSQL while retaining a local cache.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Provision `DATABASE_URL` before starting the API or running `pnpm --filter @workspace/db run push`.
- Replit Publishing needs a Production Database in addition to the development database.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
