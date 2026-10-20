import { getSitemapCounts } from "@/lib/seo/sitemap-source";

/**
 * Public artists needed before the artist/portfolio directory (`/artists`, `/portfolios`) opens.
 *
 * A directory with a couple of profiles reads as an empty platform to the creatives we want to sign
 * up, and Google treats it as a thin page. Until there are enough share-ready artists to browse, the
 * directory and every entry point to it (header search, footer and landing links, sitemap, llms.txt,
 * the WebSite SearchAction) stay hidden; artist pages and the discipline landings keep showcasing
 * the work. It opens on its own once the count is reached — no deploy needed.
 */
export const DIRECTORY_MIN_PUBLIC_ARTISTS = 10;

/** The directory's own URLs (locale-agnostic). */
export const DIRECTORY_PATHS: ReadonlySet<string> = new Set([
  "/artists",
  "/portfolios",
]);

/**
 * Whether the directory is open. Reads the share-ready artist count behind the sitemap (cached for
 * an hour), so it is cheap to call from layouts. Fails closed: if the count can't be read it is 0.
 */
export async function isDirectoryOpen(): Promise<boolean> {
  const counts = await getSitemapCounts();
  return (counts.artists ?? 0) >= DIRECTORY_MIN_PUBLIC_ARTISTS;
}
