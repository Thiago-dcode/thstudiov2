import "server-only";
import { APP_TOKEN_HEADER } from "@repo/common-lib/constants/headers";
import type {
  SitemapArtistItem,
  SitemapCounts,
  SitemapEntityItem,
  SitemapMediaItem,
} from "@repo/common-lib/types/sitemap";
import { serverEnv } from "@/env/server";
import { isIndexableEnv } from "@/lib/seo/indexability";

/**
 * Child sitemaps are ISR-cached this long (seconds) instead of rebuilt per request. Kept short
 * (1h) because a shard body is prerendered at build time against the *currently deployed* API:
 * anything that changes between build and serve is stale until this elapses.
 */
export const SITEMAP_REVALIDATE = 3600;

const EMPTY_COUNTS: SitemapCounts = {
  artists: 0,
  portfolios: 0,
  collections: 0,
  services: 0,
  media: 0,
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
  media: 2000,
} as const;

export type SitemapKind = keyof typeof SITEMAP_SHARD_SIZE;
/**
 * Artists first (paid users are ordered into the earliest artist shards by the API).
 *
 * ⚠️ APPEND ONLY. A kind's shard-id block is derived from its position here, so inserting or
 * reordering re-maps every later id — the §A.2a failure where a stale build-time prerender served
 * one kind's content under another kind's URL. New kinds go at the end.
 */
export const SITEMAP_KIND_ORDER: SitemapKind[] = [
  "artists",
  "portfolios",
  "collections",
  "services",
  "media",
];

export type SitemapDescriptor =
  | { kind: "static" }
  | { kind: SitemapKind; page: number };

/**
 * Ids reserved per entity kind. Shard ids MUST NOT depend on how many entities exist: a shard body
 * is prerendered into the image at build time (against the counts of the *previously deployed*
 * API), so if ids were packed consecutively, the first artist to appear would shift every later id
 * by one and each stale prerender would then serve another kind's content under its URL — the
 * profile shard vanishing while a portfolio shard was served twice. A fixed block per kind means an
 * id always denotes the same (kind, page); the worst case degrades to stale-but-correct-kind until
 * `SITEMAP_REVALIDATE`. Blocks are sparse on purpose — robots.txt only advertises ids that have
 * content, so the gaps are never visible.
 */
export const SITEMAP_ID_BLOCK = 50;

/** First id of a kind's block. Id 0 is always the static shard. */
function blockStart(kind: SitemapKind): number {
  return 1 + SITEMAP_KIND_ORDER.indexOf(kind) * SITEMAP_ID_BLOCK;
}

/**
 * How many shards a kind currently needs (0 when it has no entities). Capped at the block size —
 * at the smallest shard size that is 100k entities of one kind, far past the point where the block
 * size should be raised.
 */
function shardCount(counts: SitemapCounts, kind: SitemapKind): number {
  return Math.min(
    Math.ceil((counts[kind] ?? 0) / SITEMAP_SHARD_SIZE[kind]),
    SITEMAP_ID_BLOCK,
  );
}

/**
 * Resolve a shard id → (kind, page) by fixed arithmetic, then validate the page against live
 * counts so an id inside a kind's block but past its data returns `null` (empty shard → 404)
 * instead of an out-of-range page.
 */
export async function resolveSitemapShard(
  id: number,
): Promise<SitemapDescriptor | null> {
  // A non-canonical deployment publishes no sitemap at all: it would otherwise hand out a
  // discovery map of URLs identical to production's.
  if (!isIndexableEnv()) return null;
  if (!Number.isInteger(id) || id < 0) return null;
  if (id === 0) return { kind: "static" };

  const counts = await getSitemapCounts();
  for (const kind of SITEMAP_KIND_ORDER) {
    const start = blockStart(kind);
    if (id < start || id >= start + SITEMAP_ID_BLOCK) continue;
    const page = id - start;
    return page < shardCount(counts, kind) ? { kind, page } : null;
  }
  return null;
}

/** Every shard id that currently has content, in crawl-priority order (static first). */
export async function getSitemapShardIds(): Promise<number[]> {
  // Mirrors resolveSitemapShard: nothing is advertised off the canonical origin, so
  // generateSitemaps() prerenders no shards and robots.txt lists no Sitemap: lines.
  if (!isIndexableEnv()) return [];
  const counts = await getSitemapCounts();
  const ids = [0];
  for (const kind of SITEMAP_KIND_ORDER) {
    const start = blockStart(kind);
    for (let page = 0; page < shardCount(counts, kind); page++) {
      ids.push(start + page);
    }
  }
  return ids;
}

/**
 * Child sitemap paths (`/sitemap/0.xml`, `/sitemap/1.xml`, …). Next's `generateSitemaps()` does
 * NOT emit a `/sitemap.xml` index, so robots.txt must list the children directly.
 */
export async function getSitemapChildPaths(): Promise<string[]> {
  const ids = await getSitemapShardIds();
  return ids.map((id) => `/sitemap/${id}.xml`);
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

export function getSitemapMedia(
  page: number,
  perPage: number,
): Promise<SitemapMediaItem[]> {
  return getData<SitemapMediaItem[]>(
    `/sitemap/media?page=${page}&per_page=${perPage}`,
    [],
  );
}
