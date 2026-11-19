---
name: architecture
description: Strict architecture boundaries, package responsibilities, and import rules. Use when adding imports, creating new modules, or when the user asks about package boundaries or dependency direction.
---

# Architecture Boundaries (STRICT)

## apps/api

- **NO imports from**: `apps/web`, `packages/frontend-lib`, `packages/ui`
- **Can import**: `packages/database`, `packages/common-lib`, `packages/backend-lib`

## apps/web

- **NO imports from**: `apps/api`
- **Can import**: `packages/ui`, `packages/common-lib`, `packages/frontend-lib`
- **Server-side only**: `packages/backend-lib`. Allowed in code that never reaches the browser: server actions (`"use server"`), Route Handlers, Server Components, `instrumentation.ts`, and modules starting with `import "server-only"`. **Never** from a Client Component (`"use client"`) or anything it imports, and never from `proxy.ts` (Edge runtime).
  - Prefer a `server-only` wrapper in `apps/web/src/lib/` over importing backend-lib all over the app (e.g. logging goes through `@/lib/logging/logger`, never `logService` from backend-lib directly).
  - Turbopack **bundles** backend-lib (even if listed in `serverExternalPackages`) and may put a separate copy in each server bundle. Never rely on module state being shared between, say, `instrumentation.ts` and a server action: a wrapper that needs setup does it itself at module load (see `@/lib/logging/logger`). State that must be shared across bundle copies lives on `globalThis` under a `Symbol.for` key or in Redis (the log buffer is the Redis list `logs:pending`).
  - Anything backend-lib runs **at import time** must work in the web image, which ships without `pnpm-workspace.yaml` or a source tree: no `utils/paths` (it resolves the monorepo root on import), no eager env/filesystem reads.

## packages/ui

- **Pure UI only**. No business logic, API calls, DB access, or env access.
- Must be reusable and follow global design system.
- **Check before creating**: Always check if a component exists here first.

## packages/database

- **Single source of truth** for database access.
- All DB logic lives here. `apps/api` must **not** bypass this layer.

## packages/common-lib

- Cross-platform pure utilities. No framework-specific code.
- **Shared Types Source**:
  - Types/Interfaces → `src/types/`
  - Schemas → `src/schemas/`
  - Constants/Enums → `src/constants/`
- Avoid duplicating "web-only" vs "api-only" types; use `Pick`/`Omit`.

## packages/backend-lib / frontend-lib

- **backend-lib**: Services, domain logic. No direct DB access. **Server-side only**: Node APIs are fine (fs, crypto, Redis), but it is imported by api, worker *and* the web server, so keep import-time side effects out of modules the web app loads.
- **frontend-lib**: Hooks, formatters, state helpers. No API route definitions.
