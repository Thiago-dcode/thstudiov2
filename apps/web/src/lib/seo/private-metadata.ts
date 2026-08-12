import "server-only";
import type { Metadata } from "next";

type PrivatePageMetaInput = {
  title: string;
  description: string;
  /**
   * Whether links out of this page still pass equity. `true` for pages reachable from public
   * content (the auth surface — the FAQ links to /auth/register), `false` for pages behind a
   * session or a one-time token, where there is nothing worth following.
   */
  follow?: boolean;
};

/**
 * Metadata for a route that must never be indexed but still needs a real title and description —
 * browser tabs, history and messenger previews all read them, and inheriting the marketing
 * defaults makes every private page look like the landing page.
 *
 * `noindex` is emitted here rather than relying on robots.txt alone: `Disallow` stops a crawl but
 * does not stop Google indexing a URL it finds linked, so the meta directive is the authoritative
 * one. No canonical or hreflang — those describe pages meant to rank, and pairing them with
 * `noindex` only sends mixed signals. Open Graph deliberately falls through to the root layout's
 * brand card, so sharing a private URL advertises A11STUDIO rather than "Set a new password".
 */
export function buildPrivatePageMetadata({
  title,
  description,
  follow = false,
}: PrivatePageMetaInput): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow },
  };
}
