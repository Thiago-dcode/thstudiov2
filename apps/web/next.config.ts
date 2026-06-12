import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

dotenv.config({
  path: path.resolve(process.cwd(), "..", "..", ".env"),
  quiet: true,
});

const nextConfig: NextConfig = {
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
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/assets/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
