---
name: architecture
description: Strict architecture boundaries, package responsibilities, and import rules. Use when adding imports, creating new modules, or when the user asks about package boundaries or dependency direction.
---

# Architecture Boundaries (STRICT)

## apps/api

- **NO imports from**: `apps/web`, `packages/frontend-lib`, `packages/ui`
- **Can import**: `packages/database`, `packages/common-lib`, `packages/backend-lib`

## apps/web

- **NO imports from**: `apps/api`, `packages/backend-lib`
- **Can import**: `packages/ui`, `packages/common-lib`, `packages/frontend-lib`

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

- **backend-lib**: Services, domain logic. No direct DB access.
- **frontend-lib**: Hooks, formatters, state helpers. No API route definitions.
