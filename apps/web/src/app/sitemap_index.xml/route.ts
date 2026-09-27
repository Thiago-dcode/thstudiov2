import { serverEnv } from "@/env/server";
import { isIndexableEnv } from "@/lib/seo/indexability";
import { getSitemapChildPaths } from "@/lib/seo/sitemap-source";

/**
 * `/sitemap_index.xml` — the one sitemap URL to submit and advertise.
 *
 * `generateSitemaps()` only serves the children (`/sitemap/{id}.xml`) and no index, so every new
 * shard (the first service, the 2,001st portfolio…) had to be submitted to Search Console by hand
 * and was otherwise only discoverable through robots.txt. An index lists whatever shards exist right
 * now. It lives at `sitemap_index.xml` rather than `sitemap.xml` because Next reserves the latter for
 * the `sitemap.ts` metadata route.
 *
 * Per request, like the shards themselves: indexability depends on the container's `APP_URL`.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isIndexableEnv()) return new Response("Not Found", { status: 404 });

  const base = serverEnv.APP_URL;
  const entries = (await getSitemapChildPaths())
    .map((path) => `  <sitemap><loc>${base}${path}</loc></sitemap>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
