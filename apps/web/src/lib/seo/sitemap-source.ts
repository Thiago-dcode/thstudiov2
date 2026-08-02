import "server-only";
import { APP_TOKEN_HEADER } from "@repo/common-lib/constants/constants";
import type {
  SitemapArtistItem,
  SitemapCounts,
  SitemapEntityItem,
} from "@repo/common-lib/types/sitemap";
import { serverEnv } from "@/env/server";

/** Child sitemaps are ISR-cached this long (seconds) instead of rebuilt per request. */
export const SITEMAP_REVALIDATE = 86400;

const EMPTY_COUNTS: SitemapCounts = {
  artists: 0,
  portfolios: 0,
  collections: 0,
  services: 0,
};

/**
 * Cap on each sitemap request. Static generation aborts a route after 60s, so an unreachable or
 * slow API must fail fast enough to fall back rather than burn the whole budget and fail the build.
 */
const SITEMAP_FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetch a sitemap endpoint and unwrap the API `{ data }` envelope. Failures degrade to `fallback`
 * so a transient API hiccup never hard-fails the build or a shard render.
 */
async function getData<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${serverEnv.API_V1_URL}${path}`, {
      next: { revalidate: SITEMAP_REVALIDATE },
      signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        [APP_TOKEN_HEADER]: serverEnv.APP_TOKEN,
      },
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { data?: T };
    return json?.data ?? fallback;
  } catch {
    return fallback;
  }
}

export function getSitemapCounts(): Promise<SitemapCounts> {
  return getData<SitemapCounts>("/sitemap/counts", EMPTY_COUNTS);
}

/**
 * URLs per child sitemap, per entity. Protocol max is 50k URLs / 50MB per file — image-bearing
 * entities (portfolios/collections carry gallery images) use smaller shards to bound file size, and
 * every size stays ≤ the API's `MAX_PER_PAGE` so one shard == one API page.
 */
export const SITEMAP_SHARD_SIZE = {
  artists: 5000,
  portfolios: 2000,
  collections: 2000,
  services: 5000,
} as const;

export type SitemapKind = keyof typeof SITEMAP_SHARD_SIZE;
// Artists first (paid users are ordered into the earliest artist shards by the API).
export const SITEMAP_KIND_ORDER: SitemapKind[] = [
  "artists",
  "portfolios",
  "collections",
  "services",
];

export type SitemapDescriptor =
  | { kind: "static" }
  | { kind: SitemapKind; page: number };

/**
 * The ordered list of child sitemaps; the array index IS the shard id. Shared by `sitemap.ts`
 * (to resolve a shard id → (kind, page)) and `robots.ts` (to advertise every child sitemap), so
 * the two can never disagree on how many shards exist or their order. Static shard is always id 0.
 */
export async function buildSitemapDescriptors(): Promise<SitemapDescriptor[]> {
  const counts = await getSitemapCounts();
  const list: SitemapDescriptor[] = [{ kind: "static" }];
  for (const kind of SITEMAP_KIND_ORDER) {
    const shards = Math.ceil((counts[kind] ?? 0) / SITEMAP_SHARD_SIZE[kind]);
    for (let page = 0; page < shards; page++) list.push({ kind, page });
  }
  return list;
}

/**
 * Child sitemap paths (`/sitemap/0.xml`, `/sitemap/1.xml`, …). Next's `generateSitemaps()` does
 * NOT emit a `/sitemap.xml` index, so robots.txt must list the children directly.
 */
export async function getSitemapChildPaths(): Promise<string[]> {
  const list = await buildSitemapDescriptors();
  return list.map((_, id) => `/sitemap/${id}.xml`);
}

export function getSitemapArtists(
  page: number,
  perPage: number,
): Promise<SitemapArtistItem[]> {
  return getData<SitemapArtistItem[]>(
    `/sitemap/artists?page=${page}&per_page=${perPage}`,
    [],
  );
}

export function getSitemapPortfolios(
  page: number,
  perPage: number,
): Promise<SitemapEntityItem[]> {
  return getData<SitemapEntityItem[]>(
    `/sitemap/portfolios?page=${page}&per_page=${perPage}`,
    [],
  );
}

export function getSitemapCollections(
  page: number,
  perPage: number,
): Promise<SitemapEntityItem[]> {
  return getData<SitemapEntityItem[]>(
    `/sitemap/collections?page=${page}&per_page=${perPage}`,
    [],
  );
}

export function getSitemapServices(
  page: number,
  perPage: number,
): Promise<SitemapEntityItem[]> {
  return getData<SitemapEntityItem[]>(
    `/sitemap/services?page=${page}&per_page=${perPage}`,
    [],
  );
}
