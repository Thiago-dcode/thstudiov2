import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
} from "@repo/common-lib/constants/language";

type LanguageCode = EnumType<"LANGUAGE_CODE">;

const isValidLanguage = (value: unknown): value is LanguageCode =>
  typeof value === "string" &&
  (ENUMS.LANGUAGE_CODE as readonly string[]).includes(value);

const readCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  for (const entry of document.cookie.split(";")) {
    const [key, ...rest] = entry.split("=");
    if (key?.trim() === name) return decodeURIComponent(rest.join("=").trim());
  }
  return undefined;
};

/**
 * Browser counterpart to the `getLanguage` server action, which cannot run here — it reads
 * `cookies()` and next-intl's `getLocale()`, both server-only.
 *
 * Deliberately synchronous: this feeds `ClientBaseService`'s request callback, and an await
 * there would delay every API call behind a round trip for a value already in the document.
 *
 * 1. `<html lang>`, which next-intl sets from the URL locale. It comes first because anonymous
 *    public pages can be served from Cloudflare's edge cache, and those responses carry no
 *    Set-Cookie (`proxy.ts`, `lib/edge-cache.ts`): the cookie may still hold the language of an
 *    earlier visit, while the document always matches the URL. It also covers the first render
 *    after a locale switch.
 * 2. The `x-app-language` cookie the proxy writes on uncached navigations. It is set without
 *    `httpOnly`, so it is readable here.
 * 3. `DEFAULT_LANGUAGE`.
 */
export const getClientLanguage = (): LanguageCode => {
  if (typeof document !== "undefined") {
    // `lang` is a URL locale slug ("pt"), not a LANGUAGE_CODE ("PT").
    const fromHtml = document.documentElement.lang?.toUpperCase();
    if (isValidLanguage(fromHtml)) return fromHtml;
  }

  const fromCookie = readCookie(LANGUAGE_COOKIE_NAME);
  if (isValidLanguage(fromCookie)) return fromCookie;

  return DEFAULT_LANGUAGE;
};
