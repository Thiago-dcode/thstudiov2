---
name: tech-stack
description: High-level tech stack, project structure, and core principles. Use when starting work, onboarding, or when the user asks about project structure or tech choices.
---

# Tech Stack & Structure

## Project Structure

- `apps/api` → NestJS backend
- `apps/web` → Next.js frontend
- `packages/ui` → Reusable UI components (design system)
- `packages/database` → Custom ORM & database entry point
- `packages/common-lib` → Shared cross-platform utilities
- `packages/backend-lib` → Backend-only shared logic
- `packages/frontend-lib` → Frontend-only shared logic

## Core Principles

- **Clean Architecture Monorepo**: Every layer has a responsibility. Every package has a boundary.
- **Consistency**: UI, naming, and code style must be consistent.
- **No Shortcuts**: Prefer domain separation over convenience. Clean architecture > speed.
