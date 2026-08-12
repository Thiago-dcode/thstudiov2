import type { EnumType } from "@repo/common-lib/constants/enums";
import { defineRouting } from "next-intl/routing";

// URL locale slugs (lowercase for URLs). Maps to uppercase LANGUAGE_CODE internally.
export const SUPPORTED_LOCALES = ["en", "es", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Map from URL locale slug to uppercase LANGUAGE_CODE
const LOCALE_TO_LANGUAGE_CODE: Record<
  SupportedLocale,
  EnumType<"LANGUAGE_CODE">
> = {
  en: "EN",
  es: "ES",
  pt: "PT",
};

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
});

export const urlLocaleToLanguageCode = (
  urlLocale: SupportedLocale | string,
): EnumType<"LANGUAGE_CODE"> => {
  return LOCALE_TO_LANGUAGE_CODE[urlLocale as SupportedLocale] ?? "EN";
};

/**
 * URL prefix for a locale under `localePrefix: "as-needed"` — empty for the default locale,
 * `/{locale}` otherwise. Use whenever a locale-aware URL has to be built as a plain string rather
 * than through the i18n `Link` (canonical/hreflang metadata, hrefs handed to `packages/ui`
 * components, which cannot import app-level navigation).
 */
export const localePrefix = (locale: string): string =>
  locale === routing.defaultLocale ||
  !SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? ""
    : `/${locale}`;

export const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};
