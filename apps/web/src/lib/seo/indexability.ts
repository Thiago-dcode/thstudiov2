import "server-only";
import { serverEnv } from "@/env/server";

/**
 * The one host whose pages may be indexed. Anything else serving this codebase is a copy of the
 * production site, and two hosts serving the same content is the duplicate-content case Google
 * penalises — so the host is hardcoded here rather than read from config.
 */
export const CANONICAL_HOST = "a11studio.com";

/**
 * Whether this deployment is allowed to be crawled and indexed.
 *
 * Fail-closed on purpose. `NODE_ENV` alone is not a usable signal: every environment runs with
 * `NODE_ENV=production` because `next start` requires it (see `compose.dev.yaml`), so the dev
 * deployment would otherwise consider itself indexable and serve `Allow: /` plus indexable
 * metadata for a near-identical copy of production. Requiring `APP_URL` to be the canonical origin
 * means dev.a11studio.com, localhost, previews, and a missing or unparseable `APP_URL` all resolve
 * to `false` without anyone having to remember to set a flag.
 *
 * The nginx-level blocks in `dev.nginx/` are the second layer, not the first.
 */
export function isIndexableEnv(): boolean {
  if (process.env.NODE_ENV?.toLowerCase() !== "production") return false;
  try {
    // Throws when APP_URL is absent (build phase, where getServerEnv() returns {}) or malformed.
    return new URL(serverEnv.APP_URL).host === CANONICAL_HOST;
  } catch {
    return false;
  }
}
