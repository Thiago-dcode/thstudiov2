import "server-only";
import {
  REMEMBER_ME_COOKIE_NAME,
  USER_AUTH_COOKIE_EXPIRATION_DATE,
  USER_AUTH_COOKIE_NAME,
} from "@repo/common-lib/constants/cookies";
import { REDIRECT_TO_QUERY_PARAM } from "@repo/common-lib/constants/redirect-to";
import type { NextRequest } from "next/server";
import { isIndexableEnv } from "@/lib/seo/indexability";
import { isDisciplineLandingKey } from "@/modules/landings/discipline-landings";

/**
 * Edge (Cloudflare) TTL for anonymous public HTML. Browsers never see it: `proxy.ts` sends it as
 * the internal `x-edge-cache-control` header, and `pro.nginx` turns that into `CDN-Cache-Control`
 * only for a 200 `text/html` response without Set-Cookie. Next's own
 * `Cache-Control: private, no-store` stays on the response for browsers.
 *
 * 300 s + 60 s SWR is the most an anonymous visitor can lag behind a ban, deactivation, rename or
 * content edit on an artist page (≤ 360 s), and behind a copy change on the marketing pages. Every
 * prod deploy purges the zone, so a cached page never references a previous build's chunks. See
 * the staleness table in `docs/infrastructure.md` ("Edge HTML cache").
 */
export const EDGE_HTML_CACHE_CONTROL = "max-age=300, stale-while-revalidate=60";

/** Internal marker header between the proxy and nginx. nginx always hides it from clients. */
export const EDGE_CACHE_CONTROL_HEADER = "x-edge-cache-control";

/**
 * Request headers the App Router sends on RSC, prefetch and server-action requests. Next strips
 * the flight headers (`rsc`, `next-router-*`) and the `_rsc` query from the request it hands the
 * proxy (`FLIGHT_HEADERS` in `next/dist/server/web/adapter.js`), so these checks only fire if that
 * normalisation is ever turned off. The working signal is `Sec-Fetch-Dest` below; nginx's
 * `text/html` check is the backstop for clients that don't send it.
 */
const RSC_REQUEST_HEADERS = [
  "rsc",
  "next-router-prefetch",
  "next-router-state-tree",
  "next-router-segment-prefetch",
  "next-action",
] as const;

/** Any of these means the visitor may be signed in. Presence is enough, validity is irrelevant. */
const AUTH_COOKIE_NAMES = [
  USER_AUTH_COOKIE_NAME,
  USER_AUTH_COOKIE_EXPIRATION_DATE,
  REMEMBER_ME_COOKIE_NAME,
] as const;

/** `/es` and `/pt` prefixes. `/en/*` is always a 308 to the unprefixed URL, so it never qualifies. */
const LOCALE_PREFIX = /^\/(?:es|pt)(?=\/|$)/;

const STATIC_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/faqs",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/notice",
]);

// Usernames are stored lowercase: an uppercase one is a 308 to the canonical form, which keeps
// today's cookies by not matching here. Later segments (slugs, media ids) only need to be free of
// dots, so file-like paths never qualify.
const ARTIST_PATH = /^\/artists\/[a-z0-9_-]+(?:\/[^/.]+)*$/;
const DISCIPLINE_PATH = /^\/for\/([^/.]+)$/;

/**
 * Whether `pathname` is one of the public pages whose anonymous render is identical for every
 * visitor: home, the discipline landings, about, FAQs, legal pages and artist pages, unprefixed
 * (English) or under `/es` / `/pt`. Unknown disciplines are excluded so their 404 keeps today's
 * cookies; other 404s and redirects are filtered by nginx on status.
 */
export const isEdgeCacheablePath = (pathname: string): boolean => {
  const unprefixed = pathname.replace(LOCALE_PREFIX, "") || "/";
  if (STATIC_PATHS.has(unprefixed)) return true;
  if (ARTIST_PATH.test(unprefixed)) return true;
  const discipline = DISCIPLINE_PATH.exec(unprefixed)?.[1];
  return discipline !== undefined && isDisciplineLandingKey(discipline);
};

/**
 * Whether the proxy may mark this request's response as edge-cacheable: an anonymous document
 * GET/HEAD of an allowlisted public path, on the canonical production host only.
 *
 * This is the privacy gate, so every check fails closed. Auth cookies are matched by the
 * `common-lib` names, so renaming one can never let a signed-in render through. Callers must still
 * rule out redirects issued by the proxy itself.
 */
export const isEdgeCacheableRequest = (req: NextRequest): boolean => {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (RSC_REQUEST_HEADERS.some((name) => req.headers.has(name))) return false;
  // Browsers send `Sec-Fetch-Dest: document` on navigations and `empty` on the router's RSC
  // fetches. Absent (curl, crawlers) counts as a document request. next-intl's own locale-cookie
  // sync uses the same signal.
  const fetchDest = req.headers.get("sec-fetch-dest");
  if (fetchDest !== null && fetchDest !== "document") return false;

  const { searchParams, pathname } = req.nextUrl;
  if (searchParams.has("_rsc") || searchParams.has(REDIRECT_TO_QUERY_PARAM)) {
    return false;
  }
  if (AUTH_COOKIE_NAMES.some((name) => req.cookies.has(name))) return false;
  if (!isEdgeCacheablePath(pathname)) return false;

  return isIndexableEnv();
};
