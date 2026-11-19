/**
 * Every channel a logger may write to. A closed, compile-time set is what makes `channel` safe as
 * a Loki label: a dynamic or id-bearing channel can't compile.
 *
 * Rule: the owning module/folder name (`apps/api/src/v1/modules/<x>` -> `<x>`), `api.*` for the
 * HTTP core, the service name for backend-lib services. `.` separates a sub-channel; it is never a
 * path, because every line of a process goes to `<service>/<date>.log`.
 */
export const LOG_CHANNELS = [
    'about-page',
    'account-deletion',
    'addresses',
    'ai',
    'ai-media',
    'api',
    'api.access',
    'api.bootstrap',
    'api.error',
    'assets',
    'auth',
    'backup',
    'benefits',
    'categories',
    'collections',
    'content-reports',
    'edge-cache',
    'email-preferences',
    'failed-job',
    'health',
    'indexnow',
    'invitation-links',
    'layouts',
    'locations',
    'mail',
    'media',
    'paypal',
    'plan-prices',
    'plan-subscriptions',
    'plans',
    'portfolios',
    'profile-status',
    'queue',
    'queue-health',
    'roles',
    'services',
    'storage',
    'stripe',
    'system',
    'user-auth-devices',
    'user-benefit',
    'user-contacts',
    'user-extra-data',
    'user-notifications',
    'user-oauth-providers',
    'user-sessions',
    'user-storage-requests',
    'users',
    'wait-list',
    // The Next.js server (apps/web server actions), not an api module.
    'web',
    'webhooks',
] as const;

/** Lowercase kebab segments, at most one `.` sub-channel. No `/`: a channel is not a path. */
export const LOG_CHANNEL_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)?$/;
