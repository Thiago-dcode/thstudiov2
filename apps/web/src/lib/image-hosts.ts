/**
 * Hosts our own images are served from — the S3 buckets per environment plus the CDN (CloudFront
 * custom domain, from `CDN_URL`). One list for both consumers:
 *   - `next.config.ts` → `images.remotePatterns` (read at BUILD time),
 *   - the `/og-image.jpg` route → its fetch allowlist (read at request time), so the route can only
 *     ever re-encode our own assets and never becomes an open image proxy (SSRF).
 *
 * No `server-only`/env-schema imports: `next.config.ts` loads this before the app exists.
 */
export const STORAGE_IMAGE_HOSTS = [
  "s3.eu-north-1.amazonaws.com",
  "a11studio.s3.eu-north-1.amazonaws.com",
  "local.a11studio.s3.eu-north-1.amazonaws.com",
  "dev.a11studio.s3.eu-north-1.amazonaws.com",
] as const;

/** The CDN host from `CDN_URL`, or null when it is unset or unparseable. */
export const cdnHost = (cdnUrl = process.env.CDN_URL): URL | null => {
  if (!cdnUrl) return null;
  try {
    return new URL(cdnUrl);
  } catch {
    return null;
  }
};
