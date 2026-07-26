import type { MetadataRoute } from "next";
import { serverEnv } from "@/env/server";

/** Only the production deployment is crawlable/indexable (matches common-lib's isProduction). */
const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

export default function robots(): MetadataRoute.Robots {
  // Every non-production environment (local, preview, staging) blocks all crawling so it can
  // never be indexed, regardless of any per-page metadata.
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = serverEnv.APP_URL;
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
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
