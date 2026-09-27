import { toMetaDescription } from "@repo/common-lib/utils/seo-text";
import type { Metadata } from "next";
import { SUPPORTED_LOCALES } from "@/i18n/routing";
import {
  languageAlternates,
  localizedUrl,
  OG_LOCALE,
  ogImage,
  resolveLocale,
  SITE_NAME,
} from "@/lib/seo/core";

type StaticPageMetaInput = {
  /** Locale-agnostic path, leading slash, no locale prefix (e.g. "/about", "/" for home). */
  path: string;
  title: string;
  description: string;
  locale: string;
  /**
   * Source image for the share card (an absolute CDN URL). It is re-encoded to a 1200×630 JPEG by
   * `/og-image.jpg`; omit it (or pass null) for the brand card.
   */
  image?: string | null;
  ogType?: "website" | "article" | "profile";
  /** Open Graph `profile:*` tags, for `ogType: "profile"`. */
  profile?: { firstName?: string; lastName?: string; username?: string };
  /**
   * Keep the page out of the index. `true` = `noindex, nofollow`; `"follow"` = `noindex, follow`, for
   * pages whose links still lead somewhere worth crawling (filtered directory results).
   */
  noindex?: boolean | "follow";
  /**
   * When the `title` already contains the brand (e.g. the landing page), set this so it opts out of
   * the root layout's `%s · A11STUDIO` template instead of double-branding.
   */
  titleAbsolute?: boolean;
  /**
   * Query string (with its leading `?`) that is part of this page's identity — only pagination
   * (`?page=2`) qualifies. It is kept on the canonical so each page of a list self-canonicalizes.
   */
  canonicalQuery?: string;
};

/**
 * Build a Next.js `Metadata` object for an indexable page: self-referencing canonical for the
 * current locale + hreflang alternates for every app locale (+ x-default), Open Graph and Twitter
 * cards. Indexability is inherited from the root layout (env-aware: indexable only on the canonical
 * production origin); pass `noindex` to force a page out of the index regardless.
 *
 * A `noindex` page gets NO canonical and NO hreflang: those describe a page meant to rank, and
 * pairing them with noindex sends Google contradictory signals (and builds hreflang clusters that
 * point at pages which refuse to be indexed).
 */
export function buildStaticPageMetadata({
  path,
  title,
  description: rawDescription,
  locale,
  image,
  ogType = "website",
  profile,
  noindex = false,
  titleAbsolute = false,
  canonicalQuery = "",
}: StaticPageMetaInput): Metadata {
  const current = resolveLocale(locale);
  const url = `${localizedUrl(current, path)}${canonicalQuery}`;
  // Empty → undefined, so the page inherits the root layout's localized default instead of emitting
  // an empty `<meta name="description">`.
  const description = rawDescription.trim()
    ? toMetaDescription(rawDescription)
    : undefined;
  const card = ogImage(image, title);

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    ...(noindex
      ? { robots: { index: false, follow: noindex === "follow" } }
      : {
          alternates: {
            canonical: url,
            languages: canonicalQuery
              ? Object.fromEntries(
                  Object.entries(languageAlternates(path)).map(([l, u]) => [
                    l,
                    `${u}${canonicalQuery}`,
                  ]),
                )
              : languageAlternates(path),
          },
        }),
    openGraph: {
      type: ogType,
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[current],
      alternateLocale: SUPPORTED_LOCALES.filter((l) => l !== current).map(
        (l) => OG_LOCALE[l],
      ),
      images: [card],
      ...(ogType === "profile" && profile ? profile : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: card.url, alt: card.alt }],
    },
  };
}
