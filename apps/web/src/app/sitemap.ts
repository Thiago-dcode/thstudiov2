import type { MetadataRoute } from "next";
import { serverEnv } from "@/env/server";
import {
  getSitemapArtists,
  getSitemapCollections,
  getSitemapPortfolios,
  getSitemapServices,
  getSitemapShardIds,
  resolveSitemapShard,
  SITEMAP_SHARD_SIZE as SHARD_SIZE,
} from "@/lib/seo/sitemap-source";

// Child sitemaps are ISR-cached (not rebuilt per request). Must be a numeric literal — Next cannot
// statically analyze imported constants for segment config — so keep it in step with
// SITEMAP_REVALIDATE. Short (1h) because shards are prerendered at build time against the
// previously deployed API, so anything newer than the build is stale until this elapses.
export const revalidate = 3600;

const SUPPORTED = ["en", "es", "pt"] as const;
// localePrefix is "as-needed": en (default) is unprefixed; es/pt are prefixed.
const prefix = (l: string) => (l === "en" ? "" : `/${l}`);
const abs = (locale: string, path: string) =>
  `${serverEnv.APP_URL}${prefix(locale)}${path === "/" ? "" : path}`;

/**
 * Next's sitemap serializer interpolates url/href/image values into XML RAW (no escaping), so any
 * `&` (e.g. in presigned S3 / CloudFront query strings) would produce invalid XML that Google
 * rejects. We escape every URL value here. Next does no further processing, so no double-escaping.
 */
const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** One `<url>` with hreflang alternates for every locale (+ optional image-sitemap images). */
function entry(
  path: string,
  lastModified?: string,
  images?: string[],
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED) languages[l] = xmlEscape(abs(l, path));
  return {
    url: xmlEscape(abs("en", path)),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
    ...(images?.length ? { images: images.map(xmlEscape) } : {}),
  };
}

const STATIC_PATHS = [
  "/",
  "/about",
  "/faqs",
  "/support",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  return STATIC_PATHS.map((p) => entry(p, now));
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  const ids = await getSitemapShardIds();
  return ids.map((id) => ({ id }));
}

export default async function sitemap(props: {
  // Next 16 passes route params (including the sitemap shard id) as a Promise.
  id: number | Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const desc = await resolveSitemapShard(id);
  if (!desc) return [];
  if (desc.kind === "static") return staticEntries();

  const perPage = SHARD_SIZE[desc.kind];
  switch (desc.kind) {
    case "artists": {
      const rows = await getSitemapArtists(desc.page, perPage);
      return rows.map((r) =>
        entry(`/artists/${r.username}`, r.updated_at, r.images),
      );
    }
    case "portfolios": {
      const rows = await getSitemapPortfolios(desc.page, perPage);
      return rows.map((r) =>
        entry(
          `/artists/${r.username}/portfolios/${r.slug}`,
          r.updated_at,
          r.images,
        ),
      );
    }
    case "collections": {
      const rows = await getSitemapCollections(desc.page, perPage);
      return rows.map((r) =>
        entry(
          `/artists/${r.username}/collections/${r.slug}`,
          r.updated_at,
          r.images,
        ),
      );
    }
    case "services": {
      const rows = await getSitemapServices(desc.page, perPage);
      return rows.map((r) =>
        entry(
          `/artists/${r.username}/services/${r.slug}`,
          r.updated_at,
          r.images,
        ),
      );
    }
  }
}
