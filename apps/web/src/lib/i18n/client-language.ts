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
 * 1. The `x-app-language` cookie the proxy writes on every navigation (`proxy.ts`). It is set
 *    without `httpOnly`, so it is readable here, and it already holds the language resolved by
 *    the same precedence rules the server uses.
 * 2. `<html lang>`, which next-intl sets from the URL locale — covers the first render after a
 *    locale switch, before the proxy's cookie for the new locale has come back.
 * 3. `DEFAULT_LANGUAGE`.
 */
export const getClientLanguage = (): LanguageCode => {
  const fromCookie = readCookie(LANGUAGE_COOKIE_NAME);
  if (isValidLanguage(fromCookie)) return fromCookie;

  if (typeof document !== "undefined") {
    // `lang` is a URL locale slug ("pt"), not a LANGUAGE_CODE ("PT").
    const fromHtml = document.documentElement.lang?.toUpperCase();
    if (isValidLanguage(fromHtml)) return fromHtml;
  }

  return DEFAULT_LANGUAGE;
};
