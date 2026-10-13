import "server-only";
import { getServerEnv } from "@/env/server";
import { getAnalyticsId } from "@/lib/analytics/enabled";
import type { ConsentCategory } from "./consent";

/**
 * `CONSENT_PREVIEW=1` under `next dev`: show the banner and footer link locally so the consent flow
 * can be worked on. Only the UI: GA stays off because `getAnalyticsId()` is still undefined there.
 * Every deployed environment runs with `NODE_ENV=production`, so it can never leak past local.
 */
const isConsentPreview = (): boolean =>
  getServerEnv().CONSENT_PREVIEW === 1;

/**
 * Optional-cookie categories this deployment really uses. Only these are asked about and can ever
 * be granted; with none active (dev, local, previews) there is no banner and no footer link.
 *
 * When you add a category, enable it here with its own condition (env flag, vendor ID, …).
 */
export function getActiveConsentCategories(): ConsentCategory[] {
  const active: ConsentCategory[] = [];
  if (getAnalyticsId() || isConsentPreview()) active.push("analytics");
  return active;
}
