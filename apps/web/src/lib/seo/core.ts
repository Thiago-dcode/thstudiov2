import "server-only";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import { permanentRedirect } from "next/navigation";
import { serverEnv } from "@/env/server";
import {
  localePrefix,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/routing";
import usersService from "@/modules/users/users.service";

/**
 * Shared building blocks for every SEO surface (page metadata, JSON-LD, sitemap). Each of those used
 * to carry its own copy of the site name, the OG locale table and a URL builder — and the JSON-LD
 * copy had no locale at all, so `/es` pages described themselves with English URLs.
 */

export const SITE_NAME = "A11STUDIO";

/**
 * Open Graph locale per app language — read by WhatsApp / Facebook / LinkedIn / Telegram / Slack /
 * Discord (all consume Open Graph; there is no WhatsApp-specific tag).
 */
export const OG_LOCALE: Record<SupportedLocale, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
};

/** A request locale narrowed to a supported one (anything unknown is the default, English). */
export const resolveLocale = (locale?: string | null): SupportedLocale =>
  SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : "en";

/**
 * Absolute URL of `path` in `locale` — the exact form canonicals, hreflang, sitemap `<loc>` and
 * JSON-LD must all agree on. `path` is locale-agnostic with a leading slash; `/` is the home page and
 * never gains a trailing slash (the canonical is `https://a11studio.com`, not `…com/`).
 */
export const localizedUrl = (locale: string, path: string): string =>
  `${serverEnv.APP_URL}${localePrefix(resolveLocale(locale))}${path === "/" ? "" : path}`;

/**
 * 308s an artist URL to the artist's current one, keeping `subPath` (everything after the username):
 *
 * - A username that isn't lowercase (`/artists/THSWORLD/...`) goes to the lowercase URL. Usernames
 *   are case-insensitive, so every casing rendered the same page with a 200 and relied on the
 *   canonical alone to consolidate.
 * - A username its owner changed in the last `USERNAME_RESERVATION_DAYS` goes to the new one, so old
 *   links, bios and indexed URLs keep working. A live user always wins: the reservation lookup only
 *   runs once the name is known not to exist.
 *
 * Call it first in both `generateMetadata` and the page. Metadata resolves before the first byte,
 * so its redirect is a real 308 — but the page renders in parallel, and for a username with no live
 * owner the page's own `notFound()` wins unless the page redirects too. The fetches behind it are
 * memoized per request, so the second call costs nothing.
 *
 * Next sends the 308 with `no-store`, so browsers never cache it — the name can belong to someone
 * else once the reservation ends.
 */
export const redirectToCurrentUsername = async (
  locale: string,
  username: string,
  subPath = "",
  searchParams?: Promise<PageSearchParams>,
): Promise<void> => {
  const prefix = localePrefix(resolveLocale(locale));
  // The query string goes along: links in bios and campaigns carry `utm_*`/`igsh`, and dropping them
  // on the hop would lose the attribution of exactly the old links this redirect keeps alive.
  const target = async (name: string) =>
    `${prefix}/artists/${name}${subPath}${toQueryString(await searchParams)}`;
  const canonical = normalizeUsername(username);
  // Resolve the final name first, so `/artists/OLDNAME` is one hop rather than two.
  let current = canonical;
  // `false`, not falsy: an API error must fall through to the page's own handling, never redirect.
  const exists = await usersService.usernameExists(canonical);
  if (exists.data === false) {
    const renamed = (await usersService.usernameRedirect(canonical)).data;
    if (renamed) current = renamed.username;
  }
  if (current !== username) {
    permanentRedirect(await target(current));
  }
};

/** A page's resolved `searchParams` prop. */
export type PageSearchParams = Record<string, string | string[] | undefined>;

/** `?a=1&b=2` from a page's `searchParams` (repeated keys kept), or "" when there are none. */
const toQueryString = (searchParams?: PageSearchParams): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined) query.append(key, v);
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

/** hreflang map for `path`: every app locale plus `x-default` (English). */
export const languageAlternates = (path: string): Record<string, string> => {
  const languages: Record<string, string> = {
    "x-default": localizedUrl("en", path),
  };
  for (const l of SUPPORTED_LOCALES) languages[l] = localizedUrl(l, path);
  return languages;
};

/** Share-card dimensions: the 1.91:1 card every link-preview consumer renders full-width. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Static 1200×630 brand card, for pages with no image of their own. */
export const DEFAULT_OG_IMAGE_PATH = "/og/default.jpg";

/**
 * Open Graph image descriptor for a source image (CDN URL), or the brand card when there is none.
 *
 * Source images are never handed to scrapers directly: they are portrait WebP thumbnails, banners of
 * any size, and (for older uploads) extensionless `application/octet-stream` objects — WhatsApp in
 * particular drops previews for WebP, oversize or mistyped images, and then shows the bare link. The
 * `/og-image.jpg` route re-encodes any of them into a 1200×630 JPEG well under WhatsApp's size limit,
 * with the declared width/height/type below matching the bytes actually served.
 */
export const ogImage = (src: string | null | undefined, alt: string) => {
  const url = src
    ? `${serverEnv.APP_URL}/og-image.jpg?src=${encodeURIComponent(src)}`
    : `${serverEnv.APP_URL}${DEFAULT_OG_IMAGE_PATH}`;
  return {
    url,
    secureUrl: url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    type: "image/jpeg",
    alt,
  };
};

/**
 * Whether an API response means "this entity does not exist" (→ a real 404), as opposed to "the API
 * could not answer right now" (network error, 5xx, 429 — must NOT become a 404, or one bad minute
 * would tell Google to drop live pages).
 */
export const isMissingResponse = (res: ApiResponse<unknown>): boolean =>
  res.error ? res.error.status_code === 404 : res.data == null;
