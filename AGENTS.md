# AGENTS.md — Table Tennis Aggregator

## Project Overview

A Postgres-maximalist ETL pipeline that scrapes UK table tennis league websites (TT Leagues, TT365), aggregates results, and serves them via a Fastify API.

## Architecture

- **Monorepo:** pnpm workspaces
- **Language:** TypeScript (strict mode), Node.js 18+
- **Database:** PostgreSQL 15 (single source of truth — data, job queue, scheduling)
- **Query Builder:** Kysely (type-safe SQL, no ORM)
- **Job Queue:** Graphile Worker (Postgres-native, `LISTEN/NOTIFY`)
- **API:** Fastify
- **Frontend:** React + Vite + TanStack Query + Tailwind CSS

## Workspace Structure

```
apps/api/        → Fastify REST API (reads clean data)
apps/worker/     → Graphile Worker (ETL scraping + parsing jobs)
packages/db/     → Shared Kysely database layer, migrations, types
```

## Key Commands

```bash
docker compose up -d           # Start PostgreSQL 15
pnpm db:migrate                # Run all Kysely migrations
pnpm db:migrate:down           # Roll back one migration
pnpm test                      # Run Vitest integration tests
```

## Database

- **Schema:** See `docs/schema.md` for full table/enum definitions
- **Migrations:** `packages/db/src/migrations/` — numbered TypeScript files
- **Types:** `packages/db/src/types.ts` — exported Kysely interfaces + enum unions
- **Connection:** Configured via `DATABASE_URL` env var (loaded with dotenv)

## Coding Conventions

- All database interactions use **Kysely** (no raw SQL except in migrations for enums/partial indexes)
- Bulk writes use **UPSERT** (`INSERT ... ON CONFLICT DO UPDATE`) wrapped in transactions
- Every table with external data has a `UNIQUE(parent_id, external_id)` constraint for deduplication
- Soft deletes via nullable `deleted_at` columns
- UUIDs for all primary keys (`gen_random_uuid()`)

## TDD Approach

Tests are written **before** implementation code. Integration tests run against a real Postgres instance (Docker), not mocks. The test suite creates/drops a `tt_players_test` database automatically.
