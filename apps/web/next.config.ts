import type { NextConfig } from "next";
import path from "node:path";
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(),'..','..', '.env'),quiet:true });

const env: Record<string, string | undefined> = {};
const keysToExclude = ['NEXT_RUNTIME','NODE_ENV','NODE_OPTIONS','NODE_PATH'];
Object.keys(process.env).forEach((key) => {
  if(keysToExclude.includes(key) || key.startsWith('NEXT_PUBLIC_') || key.startsWith('NODE_') || key.startsWith('__') ) return;
env[key] = process.env[key]
})
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
  env,
};

export default nextConfig;
