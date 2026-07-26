import "server-only";
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
 * Fetch a sitemap endpoint and unwrap the API `{ data }` envelope. Failures degrade to `fallback`
 * so a transient API hiccup never hard-fails the build or a shard render.
 */
async function getData<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${serverEnv.API_V1_URL}${path}`, {
      next: { revalidate: SITEMAP_REVALIDATE },
      headers: { Accept: "application/json" },
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
