import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { cdnHost, STORAGE_IMAGE_HOSTS } from "./src/lib/image-hosts";

dotenv.config({
  path: path.resolve(process.cwd(), "..", "..", ".env"),
  quiet: true,
});

/** Allow the configured CDN host (CloudFront) through next/image. Empty when CDN_URL is unset. */
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
      // Must not exceed nginx's `client_max_body_size` (320m) — a larger value here is
      // unreachable in production anyway. Sized by the media upload cap
      // (`MAX_VIDEO_UPLOAD_MB`, 300MB): video is the only thing that gets near it, and the
      // API buffers uploads in multer memory storage, so this is also the per-request memory
      // ceiling. Keep the three in sync (pro.nginx/conf.d/default.conf,
      // packages/common-lib/src/constants/limits.ts).
      bodySizeLimit: "300mb",
    },
  },
  /** Bridge non-public env names (same as server.ts) so client bundles get inlined values without duplicating .env. */
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "",
    // No `API_V1_URL` fallback: that is the in-cluster address (`http://api:8080/api/v1`), and
    // the browser now calls the API directly. Falling back would ship an unresolvable hostname
    // to the client bundle, and `clientEnv`'s non-empty check would pass it happily — a silent,
    // production-only failure. Missing here should break the build instead.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    // No server-side twin: the socket.io origin is only ever consumed by the browser.
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "",
    NEXT_PUBLIC_GEOAPIFY_URL:
      process.env.NEXT_PUBLIC_GEOAPIFY_URL || process.env.GEOAPIFY_URL || "",
    NEXT_PUBLIC_GEOAPIFY_KEY:
      process.env.NEXT_PUBLIC_GEOAPIFY_KEY || process.env.GEOAPIFY_KEY || "",
  },
  images: {
    remotePatterns: [
      ...STORAGE_IMAGE_HOSTS.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      // CDN host (CloudFront custom domain or *.cloudfront.net). Public images are now served from
      // the CDN, so next/image must allow it — otherwise it rejects the URL and the image 404s.
      // Derived from CDN_URL so custom domains work too; must be present at BUILD time.
      ...cdnRemotePattern,
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
