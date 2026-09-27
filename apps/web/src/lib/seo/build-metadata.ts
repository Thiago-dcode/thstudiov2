import type { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";

/**
 * Build a Next.js `Metadata` object from an entity's lean SEO payload (already localized by the API):
 * self-referencing canonical for the current locale + hreflang alternates for every app locale.
 *
 * Title/description precedence: the AI SEO copy, then the entity's own title/description (returned
 * by the same endpoint), then `fallback`. The middle step used to be missing, so any entity whose AI
 * copy had not been generated yet — or had been rejected by the quality guard — was titled with the
 * artist's username.
 */
export function buildSeoMetadata(
  meta: EntitySeoMetadata,
  locale: string,
  fallback: { title: string; description?: string },
): Metadata {
  const title = meta.seo_title?.trim() || meta.title?.trim() || fallback.title;
  const description =
    meta.seo_description?.trim() ||
    meta.description?.trim() ||
    fallback.description ||
    "";

  return buildStaticPageMetadata({
    path: meta.canonical_path,
    title,
    description,
    locale,
    image: meta.og_image,
    noindex: meta.noindex,
  });
}
