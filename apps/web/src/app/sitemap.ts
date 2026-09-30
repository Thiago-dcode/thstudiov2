import type { SitemapMediaItem } from "@repo/common-lib/types/sitemap";
import type { MetadataRoute } from "next";
import { languageAlternates, localizedUrl } from "@/lib/seo/core";
import {
  getSitemapArtists,
  getSitemapCollections,
  getSitemapMedia,
  getSitemapPortfolios,
  getSitemapServices,
  getSitemapShardIds,
  resolveSitemapShard,
  SITEMAP_SHARD_SIZE as SHARD_SIZE,
} from "@/lib/seo/sitemap-source";

/**
 * Rendered per request, never prerendered into the image.
 *
 * Two reasons, both learned the hard way:
 *   1. Indexability depends on the container's `APP_URL` (see `isIndexableEnv`). A shard baked at
 *      build time carries the *build* environment's answer, so a dev deployment could serve a
 *      sitemap of production-identical URLs.
 *   2. `generateSitemaps()` runs at build against the *previously deployed* API, so a prerendered
 *      shard body could describe stale counts — the §A.2a bug, where the served sitemap listed one
 *      entity twice and omitted another entirely.
 *
 * The per-request cost is near zero: every API call in `sitemap-source` is a `fetch` with
 * `next: { revalidate: SITEMAP_REVALIDATE }`, so the data behind the render is still cached for an
 * hour — only the assembly is dynamic.
 */
export const dynamic = "force-dynamic";

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

/**
 * One `<url>` with hreflang alternates for every locale + `x-default` (the same set the page's own
 * `<head>` declares), plus optional image-sitemap images and video-sitemap videos.
 */
function entry(
  path: string,
  lastModified?: string,
  images?: string[],
  videos?: MetadataRoute.Sitemap[number]["videos"],
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([l, u]) => [l, xmlEscape(u)]),
  );
  return {
    url: xmlEscape(localizedUrl("en", path)),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
    ...(images?.length ? { images: images.map(xmlEscape) } : {}),
    ...(videos?.length ? { videos } : {}),
  };
}

/**
 * The `<video:video>` for a video media. Title, description and thumbnail are required by Google, so
 * an untitled video falls back to a name built from the artist, and the description to the title.
 * Text goes through `xmlEscape` too: Next writes these fields raw, so a `&` in a title would break the
 * whole shard.
 */
function mediaVideos(
  r: SitemapMediaItem,
): MetadataRoute.Sitemap[number]["videos"] {
  if (!r.video) return undefined;
  const title = r.video.title?.trim() || `Video by @${r.username}`;
  const description = (r.video.description?.trim() || title).slice(0, 2048);
  return [
    {
      title: xmlEscape(title),
      description: xmlEscape(description),
      thumbnail_loc: xmlEscape(r.video.thumbnail_url),
      content_loc: xmlEscape(r.video.content_url),
      publication_date: r.video.publication_date,
      ...(r.video.duration_seconds
        ? { duration: r.video.duration_seconds }
        : {}),
    },
  ];
}

const STATIC_PATHS = [
  "/",
  // The directory hubs: the only crawlable entry points into the artist and portfolio catalogue.
  "/artists",
  "/portfolios",
  "/about",
  "/faqs",
  "/support",
  // The one indexable auth page: a "Sign in" sitelink candidate under brand searches.
  "/auth/login",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

/**
 * No `lastmod` for static pages. It used to be the request time, so every fetch claimed all of them
 * changed "just now" — Google stops trusting `lastmod` from a site that does that, including on the
 * entity shards where it is real (`updated_at`).
 */
function staticEntries(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((p) => entry(p));
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
    case "media": {
      const rows = await getSitemapMedia(desc.page, perPage);
      // The PRIMARY media URL — the one the nested portfolio/collection media views canonicalize
      // to — so the sitemap only ever advertises the canonical form.
      return rows.map((r) =>
        entry(
          `/artists/${r.username}/media/${r.public_id}`,
          r.updated_at,
          r.images,
          mediaVideos(r),
        ),
      );
    }
  }
}
