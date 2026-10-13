import "server-only";
import { clientEnv } from "@/env/client";
import { isIndexableEnv } from "@/lib/seo/indexability";

/**
 * The GA4 measurement ID to use, or `undefined` when analytics must be off.
 *
 * Analytics only runs on the canonical production origin. Reusing `isIndexableEnv()` (fail-closed:
 * dev.a11studio.com, localhost, previews and a missing/invalid `APP_URL` all resolve to "off")
 * means a stray `NEXT_PUBLIC_GA_ID` in a dev build or a local `.env` cannot send data to the
 * production property. Server-only on purpose: the layout passes the result down as a prop.
 */
export function getAnalyticsId(): string | undefined {
  const id = clientEnv.NEXT_PUBLIC_GA_ID;
  return id && isIndexableEnv() ? id : undefined;
}
