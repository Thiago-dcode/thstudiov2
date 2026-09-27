import type { MetadataRoute } from "next";
import { serverEnv } from "@/env/server";
import { localePrefix, SUPPORTED_LOCALES } from "@/i18n/routing";
import { isIndexableEnv } from "@/lib/seo/indexability";

/**
 * Resolved per request, never prerendered.
 *
 * `isIndexableEnv()` reads `APP_URL` from the container, but a statically generated robots.txt is
 * baked at BUILD time — so an image built with the production `APP_URL` would keep serving
 * `Allow: /` on the dev deployment until the ISR window expired, which is exactly the
 * duplicate-content exposure this gate exists to prevent. The route makes no fetch, so being
 * dynamic costs effectively nothing.
 */
export const dynamic = "force-dynamic";

/** Authed/private/utility areas; see the `disallow` comment below for why `/auth` is not here. */
const PRIVATE_PATHS = [
  "/atelier",
  "/get-started",
  "/email-preferences",
  "/wait-list",
];

/**
 * Every locale form of the private paths. Robots rules are prefix matches, so `/atelier` never
 * matched `/es/atelier`. The prefixes are spelled out per locale rather than as one `*` wildcard
 * rule (`/<any>/atelier`), which would also block any artist whose username starts with "atelier"
 * (`/artists/atelier-x`).
 */
const privateDisallows = (): string[] => [
  ...PRIVATE_PATHS,
  ...SUPPORTED_LOCALES.map((l) => localePrefix(l))
    .filter(Boolean)
    .flatMap((prefix) => PRIVATE_PATHS.map((p) => `${prefix}${p}`)),
  "/api/",
];

/**
 * Answer-engine and AI crawlers, named explicitly. They are already covered by the `*` group; the
 * explicit group records the decision — A11STUDIO wants artists cited by ChatGPT, Claude, Perplexity,
 * Gemini and Apple — so nobody "tidies" it into a blanket AI block later. Same private paths as `*`.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  // Every deployment that is not the canonical production origin (dev, local, preview) blocks all
  // crawling so it can never be indexed as a duplicate, regardless of any per-page metadata.
  if (!isIndexableEnv()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = serverEnv.APP_URL;
  // One line: the sitemap index (app/sitemap_index.xml) lists every shard that currently exists, so
  // robots.txt never goes stale when a new shard appears.
  const sitemaps = base ? [`${base}/sitemap_index.xml`] : [];
  const disallow = privateDisallows();
  return {
    rules: [
      {
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
        disallow,
      },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    // `Host:` is not emitted: it is a Yandex-only directive, deprecated since 2018.
    ...(sitemaps.length ? { sitemap: sitemaps } : {}),
  };
}
