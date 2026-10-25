/**
 * Debounce window of an artist's edge purge: every trigger for the same artist within it collapses
 * into one Cloudflare request, sent once the artist has been quiet for this long.
 */
export const EDGE_PURGE_DEBOUNCE_MS = 5_000;

/**
 * How long Cloudflare may serve an artist page without a purge. Must equal `max-age` +
 * `stale-while-revalidate` of `EDGE_HTML_CACHE_CONTROL` in `apps/web/src/lib/edge-cache.ts`
 * (300 s + 60 s). A purge job older than this is pointless: the TTL has already refreshed the pages.
 */
export const EDGE_HTML_MAX_STALE_MS = 360_000;

/** Every public page exists unprefixed (English), under `/es` and under `/pt`. Never `/en`. */
export const EDGE_PURGE_LOCALE_PREFIXES = ['', '/es', '/pt'] as const;
