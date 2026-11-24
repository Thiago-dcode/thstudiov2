/** The fields a media page's visible text is chosen from. */
export type MediaPageTextSource = {
  title?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

const clean = (value?: string | null): string | null => value?.trim() || null;

/**
 * The visible H1 and standfirst of a media page, per field: the artist's own words first, then the
 * AI SEO copy (already in the page language), else `null` (the caller supplies a fallback heading).
 *
 * Showing the AI copy is what gives an untitled photo a page worth indexing — without it every such
 * page shared one generic heading and nothing else in its body.
 *
 * Mirrors `MediaRepository.MEDIA_HAS_TEXT_SQL` (`@repo/database`), which decides whether the page is
 * indexed and listed in the sitemap. Change both together.
 */
export function resolveMediaPageText(media: MediaPageTextSource): {
  title: string | null;
  description: string | null;
} {
  return {
    title: clean(media.title) ?? clean(media.seo_title),
    description: clean(media.description) ?? clean(media.seo_description),
  };
}
