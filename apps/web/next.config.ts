import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { cdnHost, STORAGE_IMAGE_HOSTS } from "./src/lib/image-hosts";

dotenv.config({
  path: path.resolve(process.cwd(), "..", "..", ".env"),
  quiet: true,
});

/** Allow the configured CDN host (CloudFront) through next/image. Empty when NEXT_PUBLIC_CDN_URL is unset. */
const cdnRemotePattern = (() => {
  const cdn = cdnHost();
  if (!cdn) return [];
  return [
    {
      protocol: cdn.protocol.replace(":", "") as "https" | "http",
      hostname: cdn.hostname,
    },
  ];
})();

const nextConfig: NextConfig = {
  output: "standalone",
  // TypeScript is enforced in CI (test job) before deploy runs.
  // Skipping the post-compile type-check here avoids a separate multi-minute
  // pass on the resource-constrained droplet (1 vCPU / 1 GB).
  typescript: { ignoreBuildErrors: true },
  // Metadata is resolved BEFORE the first byte for every user agent, instead of being streamed into
  // <body> for everyone except Next's built-in "HTML-limited bot" list. That list covers Bing and the
  // social scrapers but not Googlebot, GPTBot, OAI-SearchBot, ClaudeBot or PerplexityBot, which were
  // receiving <title>/canonical/hreflang ~160 KB into <body> — Google only honours canonical and
  // hreflang inside <head>, and non-rendering AI crawlers never see them at all. Blocking metadata
  // also lets a notFound() in generateMetadata still produce a real 404 status despite the root
  // loading.tsx (a streamed notFound can only inject noindex into a 200).
  htmlLimitedBots: /.*/,
  experimental: {
    // Next 16.2 cannot drive TypeScript 7 through the programmatic compiler API.
    // Shelling out to the project-local `tsc` CLI is the supported path until
    // Next ships native TS7 support.
    useTypeScriptCli: true,
    serverActions: {
      // Media (video included) goes from the browser straight to S3 through a presigned URL, so
      // the only files a server action carries are images: avatar + banner in one request
      // (`MAX_IMAGE_UPLOAD_MB` each), a thumbnail or an about photo. Next buffers this much of
      // ANY POST, anonymous ones included, before it checks the action id — at 500mb that was
      // a pre-auth memory sink on every page route. Keep it at 2 images plus form-field headroom.
      bodySizeLimit: "60mb",
    },
  },
  /** Bridge non-public env names (same as server.ts) so client bundles get inlined values without duplicating .env. */
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
    // No `API_V1_URL` fallback: that is the in-cluster address (`http://api:8080/api/v1`), and
    // the browser now calls the API directly. Falling back would ship an unresolvable hostname
    // to the client bundle, and `clientEnv`'s non-empty check would pass it happily — a silent,
    // production-only failure. Missing here should break the build instead.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    // No server-side twin: the socket.io origin is only ever consumed by the browser.
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "",
    NEXT_PUBLIC_GEOAPIFY_URL: process.env.NEXT_PUBLIC_GEOAPIFY_URL || "",
    // Public by design: whatever lands here is inlined into the browser bundle. Keep this key
    // domain-restricted at the provider.
    NEXT_PUBLIC_GEOAPIFY_KEY: process.env.NEXT_PUBLIC_GEOAPIFY_KEY || "",
    // GA4 measurement ID (public by design). Empty disables analytics.
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || "",
  },
  images: {
    // The qualities the optimizer will produce. Next 16 maps any requested quality (including the
    // implicit default 75) to the closest allowed value, and answers a direct `/_next/image?q=…`
    // request for any other with 400.
    //   - 90: the site-wide quality. Our sources are already lossy WebP, and a q75 re-encode on top
    //     of them was visibly soft. The implicit default 75 is 15 away from 90 and 25 away from 50,
    //     so it still resolves to 90 — keep any new low value under 60 (60 would tie with 90).
    //   - 50: ONLY for images that sit under a blur (the homepage hero grid), where the extra
    //     detail is never seen. Opt in explicitly with `quality={50}`.
    qualities: [50, 90],
    remotePatterns: [
      ...STORAGE_IMAGE_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      // CDN host (CloudFront custom domain or *.cloudfront.net). Public images are now served from
      // the CDN, so next/image must allow it — otherwise it rejects the URL and the image 404s.
      // Derived from NEXT_PUBLIC_CDN_URL so custom domains work too; must be present at BUILD time.
      ...cdnRemotePattern,
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
