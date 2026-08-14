import { serverEnv } from "@/env/server";
import { SOCIAL } from "@/lib/social";
import { version } from "../../package.json";

export const config = {
  encryption_secret: serverEnv.ENCRYPTION_SECRET,
  app_url: serverEnv.APP_URL,
  api_v1_url: serverEnv.API_V1_URL,
  geoapi_url: serverEnv.GEOAPIFY_URL,
  geoapi_key: serverEnv.GEOAPIFY_KEY,
  app_name: "a11studio",
  app_version: version,
};

/**
 * A11STUDIO's own official social/profile URLs → emitted as `Organization.sameAs`
 * (brand entity disambiguation for Google knowledge panel + AI answer engines).
 * Derived from the single {@link SOCIAL} source so it always matches the footer.
 */
export const ORGANIZATION_SAME_AS: string[] = Object.values(SOCIAL);

/**
 * Fallback Open Graph / Twitter image for pages that would otherwise have none — the imageless
 * marketing/utility pages (landing, about, faqs, legal, support, search) and artists with no
 * banner/avatar. Root-relative on purpose: Next resolves it to an absolute URL via the root
 * layout's `metadataBase`, so share previews are never blank.
 */
export const DEFAULT_OG_IMAGE = "/logo/logo_bg_white.png";

/**
 * How long (seconds) the public landing page data stays cached: hero asset, value-pillar media,
 * featured portfolio, featured artists.
 *
 * These were fetched fresh on every render, so a single page view cost four API calls and the
 * site rate-limited itself under ordinary traffic. All four are admin-curated and change rarely,
 * so a 30-minute window is invisible to visitors.
 *
 * Do not raise this past an hour without checking `CDN_URL`: production serves permanent CDN URLs,
 * but environments without it (dev) fall back to S3 URLs signed for `STORAGE_SIGNED_URL_EXPIRATION`
 * (3600s), and caching a response for longer than that would serve dead image links.
 */
export const LANDING_REVALIDATE = 1800;

/**
 * Cache config for a public landing-page fetch, tagged so it can be invalidated on demand later
 * (nothing calls `revalidateTag` for these yet — the time window is what keeps them fresh today).
 *
 * Always `next.revalidate`, never `cache: "force-cache"`: with no revalidate Next resolves
 * force-cache to a one-year TTL. Never pass both — Next treats that as conflicting and silently
 * discards both, leaving the request uncached.
 */
export const landingCache = (tag: string) => ({
  next: { revalidate: LANDING_REVALIDATE, tags: [tag] },
});
