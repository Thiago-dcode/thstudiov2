import type { EnumType } from "@repo/common-lib/constants/enums";
import { PLATFORM_CURRENCY } from "@repo/common-lib/constants/limits";
import type { FullCollection } from "@repo/common-lib/types/collection";
import type { MediaWithUser } from "@repo/common-lib/types/media";
import type { FullPortfolio } from "@repo/common-lib/types/portfolio";
import type { FullService } from "@repo/common-lib/types/service";
import { serverEnv } from "@/env/server";
import { ORGANIZATION_SAME_AS } from "@/lib/config";

const SITE_NAME = "A11STUDIO";

const abs = (path: string) => `${serverEnv.APP_URL}${path}`;

const displayName = (
  name?: string | null,
  surname?: string | null,
  username?: string,
) =>
  [name, surname].filter(Boolean).join(" ") || (username ? `@${username}` : "");

const personRef = (username: string, name: string) => ({
  "@type": "Person",
  name: name || `@${username}`,
  url: abs(`/artists/${username}`),
});

/** Home › @artist › current-page trail. */
const breadcrumb = (
  username: string,
  currentName: string,
  currentPath: string,
) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs("/") },
    {
      "@type": "ListItem",
      position: 2,
      name: `@${username}`,
      item: abs(`/artists/${username}`),
    },
    {
      "@type": "ListItem",
      position: 3,
      name: currentName,
      item: abs(currentPath),
    },
  ],
});

/** Bundle several Schema.org nodes into one document via `@graph`. */
const graph = (nodes: Record<string, unknown>[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

type ImageLike = {
  url?: string | null;
  thumbnail?: string | null;
  title?: string | null;
  seo_alt?: string | null;
  seo_title?: string | null;
  media_type?: EnumType<"MEDIA_TYPE"> | null;
};

const imageNode = (m: ImageLike): Record<string, unknown> | null => {
  if (!m.url && !m.thumbnail) return null;
  const node: Record<string, unknown> = { "@type": "ImageObject" };
  // An `ImageGallery` member must actually be an image, so a video contributes its poster
  // frame rather than the MP4 — `contentUrl` pointing at a video inside an `ImageObject` is
  // invalid structured data and Google drops the whole node.
  const contentUrl = m.media_type === "VIDEO" ? m.thumbnail : m.url;
  if (contentUrl) node.contentUrl = contentUrl;
  if (m.thumbnail) node.thumbnailUrl = m.thumbnail;
  const name = m.title || m.seo_title;
  if (name) node.name = name;
  if (m.seo_alt) node.caption = m.seo_alt;
  return node;
};

const gallery = (media: ImageLike[]): Record<string, unknown> | undefined => {
  const image = media.map(imageNode).filter(Boolean).slice(0, 25);
  return image.length ? { "@type": "ImageGallery", image } : undefined;
};

/**
 * Renders a Schema.org JSON-LD `<script>`. `<` is escaped to `<` to prevent the JSON payload
 * from breaking out of the script tag (XSS), matching the artist-profile page's pattern.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is escaped (`<` -> <).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Strip HTML tags + collapse whitespace — FAQ answers are authored as rich HTML. */
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Organization node for the brand. `name`/`url` are locale-independent, but `description` is prose
 * search engines read, so callers pass the translated string for the current locale.
 */
export function buildOrganizationJsonLd(description: string) {
  return graph([
    {
      "@type": "Organization",
      "@id": `${abs("/")}#organization`,
      name: SITE_NAME,
      url: abs("/"),
      // The 512px app icon doubles as the brand logo (knowledge-panel signal).
      logo: abs("/android-chrome-512x512.png"),
      description,
      // Official brand profiles (single source: lib/social) — entity identity for search + AI.
      ...(ORGANIZATION_SAME_AS.length ? { sameAs: ORGANIZATION_SAME_AS } : {}),
    },
  ]);
}

/**
 * WebSite node with a Sitelinks Search Box action, letting Google surface a search field for the
 * brand in results. The target routes to the artist search with the query pre-filled.
 */
export function buildWebSiteJsonLd() {
  return graph([
    {
      "@type": "WebSite",
      "@id": `${abs("/")}#website`,
      name: SITE_NAME,
      url: abs("/"),
      publisher: { "@id": `${abs("/")}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${abs("/artists")}?search={search_term_string}`,
        },
        // Schema.org requires this exact literal for the query variable.
        "query-input": "required name=search_term_string",
      },
    },
  ]);
}

/**
 * FAQPage node — unlocks the FAQ rich result in Google (expandable Q&A under the listing).
 * Answers are plain-text (HTML stripped) as required by the spec.
 */
export function buildFaqPageJsonLd(
  items: { question: string; answer: string }[],
) {
  const mainEntity = items
    .map((f) => {
      const answer = stripHtml(f.answer);
      if (!f.question || !answer) return null;
      return {
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      };
    })
    .filter(Boolean);
  return graph([{ "@type": "FAQPage", mainEntity }]);
}

/**
 * ImageObject (Google Images + "licensable") + breadcrumb for a media/artwork page.
 * `additionalType: VisualArtwork` marks it as a creative work while keeping `ImageObject` as the
 * primary type so Google Images / the Licensable badge still apply. The **licensable pair** is
 * `acquireLicensePage` (where to license) + `license` (the usage terms) — both required for the
 * "Licensable" badge — reinforced by `creator`/`creditText`/`copyrightHolder`.
 *
 * Video swaps the primary type to `VideoObject`, which is what Google's video indexing reads;
 * `ImageObject` with an MP4 `contentUrl` is invalid and would be dropped entirely.
 */
export function buildMediaJsonLd(media: MediaWithUser, username: string) {
  // `media.user` is not guaranteed populated by every fetch path; fall back to the route username.
  const artistUsername = media.user?.username ?? username;
  const artist = displayName(
    media.user?.name,
    media.user?.surname,
    artistUsername,
  );
  const path = `/artists/${username}/media/${media.public_id}`;
  const creator = personRef(artistUsername, artist);
  const isVideo = media.media_type === "VIDEO";
  const image: Record<string, unknown> = {
    "@type": isVideo ? "VideoObject" : "ImageObject",
    additionalType: "https://schema.org/VisualArtwork",
    url: abs(path),
    // An ImageObject-only property: it tells Google Images which image the page is about.
    ...(isVideo ? {} : { representativeOfPage: true }),
    creator,
    creditText: artist,
    copyrightHolder: creator,
    acquireLicensePage: abs(path),
    license: abs("/legal/terms"),
  };
  if (media.url) image.contentUrl = media.url;
  if (media.thumbnail) image.thumbnailUrl = media.thumbnail;
  const name = media.title || media.seo_title;
  if (name) image.name = name;
  const description = media.description || media.seo_description;
  if (description) image.description = description;
  if (media.seo_alt) image.caption = media.seo_alt;
  // LLM-assigned content tags (localized) → keywords for Google Images / entity understanding.
  if (media.tags?.length) image.keywords = media.tags.join(", ");
  if (media.created_at) {
    const uploaded = new Date(media.created_at);
    if (!Number.isNaN(uploaded.getTime()))
      image.uploadDate = uploaded.toISOString();
  }
  return graph([image, breadcrumb(username, name || "Artwork", path)]);
}

/** CollectionPage + ImageGallery + breadcrumb for a portfolio (keywords from its categories). */
export function buildPortfolioJsonLd(
  portfolio: FullPortfolio,
  username: string,
) {
  // `portfolio.artist` is not populated by every fetch path; fall back to the route username.
  const a = portfolio.artist;
  const artist = a
    ? displayName(a.name, a.surname, a.username)
    : `@${username}`;
  const path = `/artists/${username}/portfolios/${portfolio.slug}`;
  const page: Record<string, unknown> = {
    "@type": "CollectionPage",
    url: abs(path),
    name: portfolio.title,
    author: personRef(username, artist),
  };
  if (portfolio.description) page.description = portfolio.description;
  const keywords = (portfolio.categories ?? [])
    .map((c) => c.name)
    .filter(Boolean);
  if (keywords.length) page.keywords = keywords.join(", ");
  const g = gallery(portfolio.media ?? []);
  if (g) page.mainEntity = g;
  return graph([page, breadcrumb(username, portfolio.title, path)]);
}

/** CollectionPage + ImageGallery + breadcrumb for a collection. */
export function buildCollectionJsonLd(
  collection: FullCollection,
  username: string,
) {
  const path = `/artists/${username}/collections/${collection.slug}`;
  const page: Record<string, unknown> = {
    "@type": "CollectionPage",
    url: abs(path),
    name: collection.title,
    author: personRef(username, `@${username}`),
  };
  if (collection.description) page.description = collection.description;
  // Collections have no categories; keywords aggregate their media's content tags (localized).
  if (collection.tags?.length) page.keywords = collection.tags.join(", ");
  const g = gallery(collection.media ?? []);
  if (g) page.mainEntity = g;
  return graph([page, breadcrumb(username, collection.title, path)]);
}

/**
 * Service + breadcrumb. Keywords come from the "what's included" features (services carry no
 * categories) + the linked portfolio. An `Offer` (priced in the platform currency) is emitted only
 * when `show_price` is on and a price exists — matching exactly what the page renders, so the
 * structured price never contradicts the visible one.
 */
export function buildServiceJsonLd(service: FullService, username: string) {
  const path = `/artists/${username}/services/${service.slug}`;
  const svc: Record<string, unknown> = {
    "@type": "Service",
    url: abs(path),
    name: service.title,
    provider: personRef(username, `@${username}`),
  };
  if (service.description) svc.description = service.description;
  const keywords = [
    ...new Set(
      [
        ...(service.features ?? []).map((f) => f.title),
        service.portfolio?.title,
      ].filter((k): k is string => !!k),
    ),
  ];
  if (keywords.length) svc.keywords = keywords.join(", ");
  if (service.show_price && service.price != null) {
    svc.offers = {
      "@type": "Offer",
      price: service.price.toFixed(2),
      priceCurrency: PLATFORM_CURRENCY,
      availability: "https://schema.org/InStock",
      url: abs(path),
    };
  }
  return graph([svc, breadcrumb(username, service.title, path)]);
}
