import type { Metadata } from "next";
import { serverEnv } from "@/env/server";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/routing";

const SITE_NAME = "A11STUDIO";

/** localePrefix is "as-needed": the default locale (en) has no prefix; es/pt are prefixed. */
const localePrefix = (l: SupportedLocale) => (l === "en" ? "" : `/${l}`);

/**
 * Open Graph locale per app language — read by WhatsApp / Facebook / LinkedIn / Telegram / Slack /
 * Discord (all consume Open Graph; there is no WhatsApp-specific tag) to render the right-language
 * link preview.
 */
const OG_LOCALE: Record<SupportedLocale, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
};

type StaticPageMetaInput = {
  /** Locale-agnostic path, leading slash, no locale prefix (e.g. "/about", "/" for home). */
  path: string;
  title: string;
  description: string;
  locale: string;
  /** Absolute OG/Twitter image URL. */
  image?: string;
  ogType?: "website" | "article";
  /** Override the default indexable behaviour (e.g. keep a page out of the index). */
  noindex?: boolean;
};

/**
 * Build a Next.js `Metadata` object for a static marketing/legal page: self-referencing canonical
 * for the current locale + hreflang alternates for every app locale (+ x-default), Open Graph and
 * Twitter cards. Indexability is inherited from the root layout (env-aware: indexable in production,
 * noindex everywhere else); pass `noindex` to force a page out of the index regardless.
 */
export function buildStaticPageMetadata({
  path,
  title,
  description,
  locale,
  image,
  ogType = "website",
  noindex = false,
}: StaticPageMetaInput): Metadata {
  const base = serverEnv.APP_URL;
  // "/" must not become "//"; every other path keeps its single leading slash.
  const normalizedPath = path === "/" ? "" : path;
  const url = (l: SupportedLocale) =>
    `${base}${localePrefix(l)}${normalizedPath}`;

  const languages: Record<string, string> = { "x-default": url("en") };
  for (const l of SUPPORTED_LOCALES) languages[l] = url(l);

  const current: SupportedLocale = SUPPORTED_LOCALES.includes(
    locale as SupportedLocale,
  )
    ? (locale as SupportedLocale)
    : "en";
  const canonical = url(current);

  return {
    title,
    description,
    alternates: { canonical, languages },
    // Only force noindex when asked; otherwise inherit the env-aware default from the root layout.
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[current],
      alternateLocale: SUPPORTED_LOCALES.filter((l) => l !== current).map(
        (l) => OG_LOCALE[l],
      ),
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
