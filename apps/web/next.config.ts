import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

dotenv.config({
  path: path.resolve(process.cwd(), "..", "..", ".env"),
  quiet: true,
});

/** Allow the configured CDN host (CloudFront) through next/image. Empty when CDN_URL is unset. */
const cdnRemotePattern = (() => {
  const cdnUrl = process.env.CDN_URL;
  if (!cdnUrl) return [];
  try {
    const { protocol, hostname } = new URL(cdnUrl);
    return [
      {
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  // TypeScript is enforced in CI (test job) before deploy runs.
  // Skipping the post-compile type-check here avoids a separate multi-minute
  // pass on the resource-constrained droplet (1 vCPU / 1 GB).
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  /** Bridge non-public env names (same as server.ts) so client bundles get inlined values without duplicating .env. */
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || process.env.API_V1_URL || "",
    NEXT_PUBLIC_GEOAPIFY_URL:
      process.env.NEXT_PUBLIC_GEOAPIFY_URL || process.env.GEOAPIFY_URL || "",
    NEXT_PUBLIC_GEOAPIFY_KEY:
      process.env.NEXT_PUBLIC_GEOAPIFY_KEY || process.env.GEOAPIFY_KEY || "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "a11studio.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "local.a11studio.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dev.a11studio.s3.eu-north-1.amazonaws.com",
      },
      // CDN host (CloudFront custom domain or *.cloudfront.net). Public images are now served from
      // the CDN, so next/image must allow it — otherwise it rejects the URL and the image 404s.
      // Derived from CDN_URL so custom domains work too; must be present at BUILD time.
      ...cdnRemotePattern,
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
