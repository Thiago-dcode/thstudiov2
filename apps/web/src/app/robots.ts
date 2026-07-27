import type { MetadataRoute } from "next";
import { serverEnv } from "@/env/server";
import { getSitemapChildPaths } from "@/lib/seo/sitemap-source";

/** Only the production deployment is crawlable/indexable (matches common-lib's isProduction). */
const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

// Re-fetch the shard list daily so newly-added child sitemaps get advertised without a redeploy.
export const revalidate = 86400;

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Every non-production environment (local, preview, staging) blocks all crawling so it can
  // never be indexed, regardless of any per-page metadata.
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = serverEnv.APP_URL;
  // Next's generateSitemaps() emits NO /sitemap.xml index — only /sitemap/[id].xml — so advertise
  // every child sitemap directly (Google supports multiple Sitemap: lines in robots.txt).
  const sitemaps = base
    ? (await getSitemapChildPaths()).map((p) => `${base}${p}`)
    : [];
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authed/private/utility areas out of the index (public content lives under /artists, etc).
      disallow: [
        "/atelier",
        "/auth",
        "/get-started",
        "/email-preferences",
        "/wait-list",
        "/api/",
      ],
    },
    ...(sitemaps.length ? { sitemap: sitemaps } : {}),
    ...(base ? { host: base } : {}),
  };
}
