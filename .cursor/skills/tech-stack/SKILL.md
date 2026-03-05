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

## Package Manager

- **pnpm**: used for monorepo management and package resolution.

## Styling & UI

- **Global Styles**: Always use CSS variables and theme tokens defined in `@packages/ui/src/styles/globals.css`.
- **Screen Sizes**: Use standard breakpoints (e.g., `phone`, `tablet`, `laptop`, `desktop`) for responsive design.
- **Colors**: Use semantic color variables like `--color-bg`, `--color-text`, `--color-accent`, etc., instead of hardcoded hex/rgb values.
- **Spacing & Sizes**: Maintain consistency by using CSS variables for spacing (padding, margin) and component sizes.
- **Layout Stability**: Avoid UI shifting (Cumulative Layout Shift) by using skeleton loaders, fixed-size containers for dynamic content, and proper `next/image` usage.

## Core Principles

- **Clean Architecture Monorepo**: Every layer has a responsibility. Every package has a boundary.
- **Consistency**: UI, naming, and code style must be consistent.
- **No Shortcuts**: Prefer domain separation over convenience. Clean architecture > speed.
