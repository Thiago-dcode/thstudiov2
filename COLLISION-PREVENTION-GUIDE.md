# SQL Column Collision Prevention Guide

## ⚠️ The Problem

When joining multiple tables in SQL, you get column name collisions when different tables have columns with the same name:

### Example: UserSession + UserAuthDevice
- Both have: `id`, `user_id`, `created_at`, `updated_at`
- Without aliases, SQL returns ambiguous results

### Example: Plans + PlanPrices + PlanOffers + PlanTranslations
- All have: `id`, `created_at`, `updated_at`
- Plans, PlanOffers, PlanTranslations all have: `name`, `description`
- Plans and PlanOffers both have: `is_active`
- PlanPrices, PlanOffers, PlanTranslations all have: `plan_id`

## ❌ WRONG Approach (What NOT to Do)

```typescript
// ❌ BAD: Schema intersection creates ambiguous types
export type UserSessionWithDevice = 
  UserSessionSchema & UserAuthDeviceSchema;
// Problem: 'id' exists in both - which one do you get?
// TypeScript will merge them as 'number & number' = 'number'
// But loses information about which table's 'id' it is!

// ❌ BAD: Missing columns to "avoid" collisions
const COLUMNS = [
  'user_sessions.id',          // Which id? Ambiguous!
  'user_auth_devices.user_agent',
  // Missing: created_at, updated_at from both tables!
];
```

## ✅ CORRECT Solution

### 1. Define Explicit Schema with Prefixed Keys

```typescript
// ✅ GOOD: Only prefix columns that collide
export type UserSessionSchemaWithUserAuthDevice = {
  // From user_sessions (main table)
  id: number;
  token: string;
  user_id: number;
  user_auth_device_id: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  
  // From user_auth_devices (only colliding columns prefixed with 'uad_')
  uad_id: number;              // COLLISION: both have 'id'
  uad_user_id: number;         // COLLISION: both have 'user_id'
  uad_created_at: Date;        // COLLISION: both have 'created_at'
  uad_updated_at: Date;        // COLLISION: both have 'updated_at'
  // Non-colliding columns (no prefix needed)
  user_agent: string;
  ip_address: string;
  disabled: boolean;
  blocked: boolean;
};
```

### 2. Select Columns with Proper Aliasing

```typescript
// ✅ GOOD: Only colliding columns are aliased
private readonly COLUMNS = [
  // Main table (no aliases needed)
  'user_sessions.id',
  'user_sessions.token',
  'user_sessions.user_id',
  'user_sessions.user_auth_device_id',
  'user_sessions.expires_at',
  'user_sessions.created_at',
  'user_sessions.updated_at',
  
  // Joined table (only colliding columns aliased)
  'user_auth_devices.id as uad_id',                    // COLLISION
  'user_auth_devices.user_id as uad_user_id',          // COLLISION
  'user_auth_devices.created_at as uad_created_at',    // COLLISION
  'user_auth_devices.updated_at as uad_updated_at',    // COLLISION
  // Non-colliding columns (no alias needed)
  'user_auth_devices.user_agent',
  'user_auth_devices.ip_address',
  'user_auth_devices.disabled',
  'user_auth_devices.blocked',
] as const;
```

### 3. Use Prefixes for Formatter

```typescript
private formatUserSession(
  userSession: UserSessionSchemaWithUserAuthDevice
): UserSession {
  return {
    id: userSession.id,                           // Main table
    token: userSession.token,                     // Main table
    user_id: userSession.user_id,                 // Main table
    user_auth_device_id: userSession.user_auth_device_id,
    expires_at: userSession.expires_at,
    user_auth_device: {
      id: userSession.uad_id,                     // ✅ Prefixed (collision)
      user_agent: userSession.user_agent,         // ✅ No prefix needed
      ip_address: userSession.ip_address,         // ✅ No prefix needed
      disabled: userSession.disabled,             // ✅ No prefix needed
      blocked: userSession.blocked,               // ✅ No prefix needed
      user_id: userSession.uad_user_id,           // ✅ Prefixed (collision)
    },
  };
}
```

## 📋 Naming Convention

| Tables Joined | Main Table | Joined Table Prefix (for collisions only) |
|---------------|-----------|---------------------|
| user_sessions + user_auth_devices | user_sessions (no prefix) | `uad_` |
| plans + plan_prices | plans (no prefix) | `pp_` |
| plans + plan_offers | plans (no prefix) | `po_` |
| plans + plan_translations | plans (no prefix) | `pt_` |
| users + addresses | users (no prefix) | `addr_` |

## 🎯 Rules to Follow

1. **Main table gets NO prefix** - its columns use original names
2. **ONLY prefix columns that actually collide** between tables
   - Keeps code cleaner and more maintainable
   - Easier to understand which columns conflict
3. **Use short, memorable prefixes** (2-4 chars)
4. **Document collisions in comments** next to prefixed columns
5. **NEVER use schema intersection** (`&`) for joined tables with colliding columns
   - Use intersection only when tables have NO overlapping column names
   - Otherwise, define the complete type explicitly

## 🔍 How to Verify No Collisions

Run this check on your schema type:

```typescript
type Keys = keyof UserSessionSchemaWithUserAuthDevice;
// Should show ALL unique keys with no duplicates

// To find duplicates programmatically:
type ExtractDuplicates<T> = {
  [K in keyof T]: K extends keyof Omit<T, K> ? K : never
}[keyof T];

type Duplicates = ExtractDuplicates<UserSessionSchemaWithUserAuthDevice>;
// Should be 'never' if no duplicates exist
```

## 📝 Example: 4-Table Join (Plans Full Schema)

```typescript
export type FullPlanSchema = PlanWithPricesSchema & {
  // From plan_offers (only colliding columns prefixed with 'po_')
  po_id: number;                   // COLLISION: all 4 tables have 'id'
  po_name: string;                 // COLLISION: plans, plan_offers, plan_translations have 'name'
  po_description: string;          // COLLISION: plans, plan_offers, plan_translations have 'description'
  po_is_active: boolean;           // COLLISION: plans, plan_offers have 'is_active'
  po_plan_id: number;              // COLLISION: plan_prices, plan_offers, plan_translations have 'plan_id'
  po_created_at: Date;             // COLLISION: all tables have 'created_at'
  po_updated_at: Date;             // COLLISION: all tables have 'updated_at'
  // Non-colliding columns from plan_offers (no prefix needed)
  discount: number;
  type: EnumType<'PLAN_OFFERS_TYPE'>;
  start_date: Date;
  end_date: Date;
  plan_price_id: number | null;
  
  // From plan_translations (only colliding columns prefixed with 'pt_')
  pt_id: number;                   // COLLISION: all 4 tables have 'id'
  pt_name: string;                 // COLLISION: plans, plan_offers, plan_translations have 'name'
  pt_description: string;          // COLLISION: plans, plan_offers, plan_translations have 'description'
  pt_plan_id: number;              // COLLISION: plan_prices, plan_offers, plan_translations have 'plan_id'
  // Non-colliding columns from plan_translations (no prefix needed)
  language_code: EnumType<'LANGUAGE_CODE'>;
};
```

**Collisions prevented:**
- 4 different `id` columns → `id`, `pp_id`, `po_id`, `pt_id`
- 3 different `name` columns → `name`, `po_name`, `pt_name`
- 3 different `description` columns → `description`, `po_description`, `pt_description`
- 2 different `is_active` columns → `is_active`, `po_is_active`
- 3 different `plan_id` columns → `plan_id`, `po_plan_id`, `pt_plan_id`
- 4 different `created_at` columns → `created_at`, `pp_created_at`, `po_created_at`, (pt has none)
- 4 different `updated_at` columns → `updated_at`, `pp_updated_at`, `po_updated_at`, (pt has none)

**Non-colliding columns (no prefix):**
- `discount`, `type`, `start_date`, `end_date`, `plan_price_id`, `language_code`, `price`, `billing_type`, etc.

## ✨ Benefits

1. **Type Safety**: TypeScript knows exactly which field comes from which table
2. **No Ambiguity**: Each property name is unique
3. **Self-Documenting**: Prefixes indicate source table
4. **Future-Proof**: Adding more tables won't cause new collisions
5. **Explicit**: Clear intent about what data you're selecting

## 🚫 Common Mistakes to Avoid

1. ❌ Using `&` to merge schemas with duplicate keys
2. ❌ Prefixing ALL columns from joined tables (only prefix collisions!)
3. ❌ Using inconsistent prefixes across the codebase
4. ❌ Forgetting to update formatter when adding new columns
5. ❌ Not selecting `created_at`/`updated_at` to avoid collisions (alias them instead!)
6. ❌ Forgetting to mark which columns have collisions in comments

