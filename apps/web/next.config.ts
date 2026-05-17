import type { NextConfig } from "next";
import path from "node:path";
import dotenv from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';

dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env'), quiet: true });

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a11studio.s3.eu-north-1.amazonaws.com',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
