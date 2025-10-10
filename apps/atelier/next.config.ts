import type { NextConfig } from "next";
import path from "node:path";
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(),'..','..', '.env') });

const env: Record<string, string | undefined> = {};
const keysToExclude = ['NEXT_RUNTIME','NODE_ENV','NODE_OPTIONS','NODE_PATH'];
Object.keys(process.env).forEach((key) => {
  if(keysToExclude.includes(key) || key.startsWith('NEXT_PUBLIC_') || key.startsWith('NODE_') || key.startsWith('__') ) return;
env[key] = process.env[key]
})
const nextConfig: NextConfig = {
  /* config options here */
  env,
};

export default nextConfig;
