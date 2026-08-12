import type { MetadataRoute } from "next";
import { serverEnv } from "@/env/server";
import { isIndexableEnv } from "@/lib/seo/indexability";
import { getSitemapChildPaths } from "@/lib/seo/sitemap-source";

/**
 * Resolved per request, never prerendered.
 *
 * `isIndexableEnv()` reads `APP_URL` from the container, but a statically generated robots.txt is
 * baked at BUILD time — so an image built with the production `APP_URL` would keep serving
 * `Allow: /` on the dev deployment until the ISR window expired, which is exactly the
 * duplicate-content exposure this gate exists to prevent. The route itself is trivial; the one
 * fetch it makes (`getSitemapChildPaths`) is still `revalidate`-cached for an hour, so being
 * dynamic costs effectively nothing.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Every deployment that is not the canonical production origin (dev, local, preview) blocks all
  // crawling so it can never be indexed as a duplicate, regardless of any per-page metadata.
  if (!isIndexableEnv()) {
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
      // Keep authed/private/utility areas out of the index (public content lives under /artists,
      // etc). `Disallow` only stops crawling — Google can still index a disallowed URL it finds
      // linked — so every route listed here ALSO emits `robots: noindex` in its own metadata.
      //
      // `/auth` is deliberately NOT listed: the public FAQ links to /auth/register, so blocking the
      // crawl would leave Google with a URL it may index but may not fetch the noindex from
      // ("Indexed, though blocked by robots.txt"). Letting it crawl and read `noindex, follow` is
      // what actually keeps those pages out.
      disallow: [
        "/atelier",
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
