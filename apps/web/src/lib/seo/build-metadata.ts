import type { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import type { Metadata } from "next";
import { serverEnv } from "@/env/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/routing";

const SITE_NAME = "A11STUDIO";

/** localePrefix is "as-needed": the default locale (en) has no prefix; es/pt are prefixed. */
const localePrefix = (l: SupportedLocale) => (l === "en" ? "" : `/${l}`);

/**
 * Open Graph locale per app language. Read by WhatsApp / Facebook / LinkedIn / Telegram / Slack /
 * Discord (they all use Open Graph — there is no WhatsApp-specific tag) to render the right-language
 * link preview.
 */
const OG_LOCALE: Record<SupportedLocale, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
};

/**
 * Build a Next.js `Metadata` object from an entity's lean SEO payload (already localized by the API):
 * self-referencing canonical for the current locale + hreflang alternates for every app locale.
 */
export function buildSeoMetadata(
  meta: EntitySeoMetadata,
  locale: string,
  fallback: { title: string; description?: string },
): Metadata {
  const base = serverEnv.APP_URL;
  const url = (l: SupportedLocale) =>
    `${base}${localePrefix(l)}${meta.canonical_path}`;

  const languages: Record<string, string> = { "x-default": url("en") };
  for (const l of SUPPORTED_LOCALES) languages[l] = url(l);

  const current: SupportedLocale = SUPPORTED_LOCALES.includes(
    locale as SupportedLocale,
  )
    ? (locale as SupportedLocale)
    : "en";
  const canonical = url(current);

  const title = meta.seo_title?.trim() || fallback.title;
  const description = meta.seo_description?.trim() || fallback.description;

  return {
    title,
    description,
    alternates: { canonical, languages },
    ...(meta.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      // Tell WhatsApp/FB/LinkedIn/etc. the page language + which other locales exist.
      locale: OG_LOCALE[current],
      alternateLocale: SUPPORTED_LOCALES.filter((l) => l !== current).map(
        (l) => OG_LOCALE[l],
      ),
      ...(meta.og_image
        ? { images: [{ url: meta.og_image, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(meta.og_image ? { images: [meta.og_image] } : {}),
    },
  };
}
