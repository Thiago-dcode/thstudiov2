import { localizedUrl } from "@/lib/seo/core";
import { isIndexableEnv } from "@/lib/seo/indexability";
import { getSitemapArtists } from "@/lib/seo/sitemap-source";

/**
 * `/llms.txt` — a plain Markdown map of the site for answer engines (the llmstxt.org convention).
 *
 * Tells ChatGPT / Claude / Perplexity-style crawlers, in one fetch, what A11STUDIO is, who it serves
 * (artists AND the clients looking for them), where the hubs are, and which artists are currently
 * public. Artists come from the sitemap feed, so the list is exactly the share-ready set — never an
 * incomplete or hidden profile.
 *
 * It used to fall through to the app and return the home page's HTML with a 200.
 */
export const dynamic = "force-dynamic";

/** Enough to be a useful entry point without turning the file into a second sitemap. */
const ARTIST_LIMIT = 100;

export async function GET() {
  if (!isIndexableEnv()) return new Response("Not Found", { status: 404 });

  const artists = await getSitemapArtists(0, ARTIST_LIMIT);
  const url = (path: string) => localizedUrl("en", path);

  const body = `# A11STUDIO

> A11STUDIO is a portfolio platform where artists get discovered. It combines a professional portfolio website with the ease of social media: artists publish portfolios, collections and services in minutes, and A11STUDIO handles hosting, SEO and presentation. Clients — couples, businesses, publishers, galleries — use it to find and contact photographers, illustrators, filmmakers, designers and other artists directly.

Built by an artist for artists. The platform ranks craftsmanship over algorithms: no feeds, no engagement metrics, the artwork is always the focus. Available in English, Spanish (/es) and Portuguese (/pt).

## Discover artists

- [Artist directory](${url("/artists")}): browse and search artists by discipline, style and location
- [Portfolio directory](${url("/portfolios")}): browse curated portfolios across disciplines

## About A11STUDIO

- [About](${url("/about")}): mission, values and the founder's story
- [FAQ](${url("/faqs")}): how portfolios, collections, services, AI-assisted SEO and pricing work
- [Support](${url("/support")}): contact the A11STUDIO team

## Artist profile structure

Every artist lives at \`/artists/{username}\` with:
- \`/artists/{username}/portfolios/{slug}\`: curated best-of work in one discipline or style
- \`/artists/{username}/collections/{slug}\`: sets of work from one project, trip or series
- \`/artists/{username}/services/{slug}\`: services the artist offers, with what is included and, when published, the price
- \`/artists/{username}/media/{id}\`: a single artwork with its credits, location and description
${
  artists.length
    ? `\n## Artists\n\n${artists
        .map((a) => `- [@${a.username}](${url(`/artists/${a.username}`)})`)
        .join("\n")}\n`
    : ""
}
## Optional

- [Terms of Service](${url("/legal/terms")})
- [Privacy Policy](${url("/legal/privacy")})
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
