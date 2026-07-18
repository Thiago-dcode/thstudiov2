import "server-only";

import { getLocale } from "next-intl/server";
import { redirect as intlRedirect } from "@/i18n/navigation";

/**
 * Locale-aware redirect for Server Components.
 * next-intl v4 requires an explicit locale on the server redirect API.
 */
export async function redirect(
  href: string,
  type?: Parameters<typeof intlRedirect>[1],
): Promise<never> {
  const locale = await getLocale();
  return intlRedirect({ href, locale }, type);
}
