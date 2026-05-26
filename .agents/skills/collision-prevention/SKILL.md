---
name: collision-prevention
description: SQL column collision prevention guide for multi-table joins. Use when creating or modifying joined schemas, PROFILE_COLUMNS, FULL_COLUMNS, or formatters that aggregate rows from multiple tables.
---

# SQL Column Collision Prevention Guide

## The Problem

When joining multiple tables in SQL, column name collisions occur when different tables have columns with the same name (e.g. `id`, `created_at`, `user_id`).

## Rules to Follow

1. **Main table gets NO prefix** — its columns use original names.
2. **ONLY prefix columns that actually collide** between tables.
3. **Use short, memorable prefixes** (2-4 chars): `uad_`, `pp_`, `po_`, `pt_`, `a_`, `uc_`, `c_`, `m_`.
4. **NEVER use schema intersection** (`&`) for joined tables with colliding columns — define the complete type explicitly.
5. **Select only the columns you need** — don't select entire tables.
6. **Output type must match selected columns** — use `Pick<>` to narrow.

## Correct Pattern

### 1. Define explicit schema with prefixed keys

```typescript
export type UserSessionSchemaWithUserAuthDevice = {
  id: number;         // main table
  token: string;
  user_id: number;
  // ...
  uad_id: number;     // COLLISION: both have 'id'
  uad_user_id: number;
  uad_created_at: Date;
  user_agent: string; // no collision, no prefix
};
```

### 2. Select columns with proper aliasing

```typescript
'user_auth_devices.id as uad_id',
'user_auth_devices.user_id as uad_user_id',
'user_auth_devices.user_agent',  // no alias needed
```

### 3. Use prefixed names in formatter

```typescript
user_auth_device: {
  id: userSession.uad_id,
  user_agent: userSession.user_agent,
}
```

## Naming Convention

| Tables Joined | Main Table | Joined Prefix (collisions only) |
|---------------|------------|----------------------------------|
| user_sessions + user_auth_devices | user_sessions | `uad_` |
| plans + plan_prices | plans | `pp_` |
| plans + plan_offers | plans | `po_` |
| users + addresses + user_categories + categories | users | `a_` / `uc_` / `c_` |
| portfolios + media | portfolios | `m_` |

## Common Mistakes to Avoid

- Using `&` to merge schemas with duplicate keys
- Prefixing ALL columns from joined tables (only prefix collisions!)
- Not selecting `created_at`/`updated_at` to avoid collisions (alias them instead!)
