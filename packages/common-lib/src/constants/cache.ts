// ==================== CACHE KEYS ====================
// Plans
export const CACHE_KEY_PLANS = 'plans' as const;
export const CACHE_KEY_FREE_PLAN = 'free-plan' as const;
export const CACHE_KEY_ACTIVE_PLAN = (userId: number | string) => `active_plan_${userId}` as const;
export const CACHE_KEY_ACTIVE_PLANS_BASE = 'active-plans-base' as const;

// Subscriptions
export const CACHE_KEY_ACTIVE_SUBSCRIPTION = (userId: number | string) => `active_subscription_${userId}` as const;

// User extra data
export const CACHE_KEY_USER_EXTRA_DATA = (userId: number | string) => `user-extra-data-${userId}` as const;

// Profile status
export const CACHE_KEY_PROFILE_STATUS = (userId: number | string) =>
  `profile-status-${userId}` as const;

// Categories
export const CACHE_KEY_USER_CATEGORIES = (userId: number | string) => `user_categories_${userId}` as const;
/** All active categories as CategoryBase without thumbnail (canonical English names). */
export const CACHE_KEY_ACTIVE_CATEGORIES = 'active_categories' as const;

/** Per-entity SEO metadata cache (language is appended per request via `append_language`). */
export const CACHE_KEY_PORTFOLIO_SEO = (userId: number, slug: string) => `seo_portfolio_${userId}_${slug}` as const;
export const CACHE_KEY_COLLECTION_SEO = (userId: number, slug: string) => `seo_collection_${userId}_${slug}` as const;
export const CACHE_KEY_SERVICE_SEO = (userId: number, slug: string) => `seo_service_${userId}_${slug}` as const;
export const CACHE_KEY_MEDIA_SEO = (publicId: string) => `seo_media_${publicId}` as const;
/** SEO metadata is served to crawlers and changes rarely — cache a full day. */
export const SEO_METADATA_CACHE_TTL = 1000 * 60 * 60 * 24;
/**
 * Minimum days between AI SEO regenerations of the SAME entity. Content that has never been
 * generated is exempt, so new work is still written immediately; this only throttles rewrites.
 *
 * Rewriting on every edit costs tokens for near-identical copy and — because the SEO write bumps
 * `updated_at`, which the sitemap emits as `lastmod` — tells Google a page changed when it barely
 * did. Google discounts `lastmod` it finds unreliable, so the churn erodes a signal we depend on.
 */
export const SEO_REGENERATION_MIN_INTERVAL_DAYS = 3;
export const CACHE_KEY_CATEGORY_TRANSLATION = (
  categoryId: number | string,
  languageCode: string,
) => `category_translation_${categoryId}_${languageCode}` as const;
export const CACHE_KEY_USER_PUBLIC_ID = (userId: number | string) => `user_public_id_${userId}` as const;
export const CACHE_KEY_USERNAME_EXISTS = (username: string) => `username_exists_${username}` as const;

// Roles
export const CACHE_KEY_ROLES_ALL = 'roles_all' as const;
export const CACHE_KEY_ROLE_BY_NAME = (name: string) =>
  `role_name_${name}` as const;

// Layouts
export const CACHE_KEY_LAYOUTS_ALL = 'layouts_all' as const;
export const CACHE_KEY_LAYOUT_BY_NAME = (name: string) =>
  `layout_name_${name}` as const;
