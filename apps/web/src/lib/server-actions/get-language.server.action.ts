"use server";

import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
} from "@repo/common-lib/constants/language";
import { getAcceptLanguage } from "@repo/common-lib/utils/get-accept-language";
import { cookies, headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { urlLocaleToLanguageCode } from "@/i18n/routing";

type LanguageCode = EnumType<"LANGUAGE_CODE">;

const isValidLanguage = (value: unknown): value is LanguageCode =>
  typeof value === "string" &&
  (ENUMS.LANGUAGE_CODE as readonly string[]).includes(value);

/**
 * Resolves the language for the current request, in order of precedence:
 * 1. The URL locale via next-intl's `getLocale()` — already encodes the
 *    user's explicit choice (locale switcher) or browser-detected locale
 *    (`localeDetection: true`), and is correct even on a cold first render.
 * 2. The `x-app-language` cookie mirrored by the proxy — covers contexts
 *    where next-intl hasn't resolved a locale yet.
 * 3. The raw `Accept-Language` header — the key fallback for `app/api/*`
 *    route handlers, which live outside `[locale]` so `getLocale()` there
 *    resolves to the app default instead of the visitor's browser language.
 * 4. `DEFAULT_LANGUAGE`.
 */
export const getLanguage = async (): Promise<LanguageCode> => {
  try {
    const locale = await getLocale();
    const languageFromLocale = urlLocaleToLanguageCode(locale);
    if (isValidLanguage(languageFromLocale)) {
      return languageFromLocale;
    }
  } catch {
    // getLocale() throws outside of next-intl's resolved context
    // (e.g. some route handlers) — fall through to the other signals.
  }

  const cookieStore = await cookies();
  const languageFromCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  if (isValidLanguage(languageFromCookie)) {
    return languageFromCookie;
  }

  const headersList = await headers();
  const languageFromBrowser = getAcceptLanguage(
    headersList.get("accept-language"),
  );
  if (isValidLanguage(languageFromBrowser)) {
    return languageFromBrowser;
  }

  return DEFAULT_LANGUAGE;
};
