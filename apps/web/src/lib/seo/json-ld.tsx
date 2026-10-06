import { PLATFORM_CURRENCY } from "@repo/common-lib/constants/limits";
import type { FullCollection } from "@repo/common-lib/types/collection";
import type {
  MediaPortfolio,
  MediaWithUser,
} from "@repo/common-lib/types/media";
import type { FullPortfolio } from "@repo/common-lib/types/portfolio";
import type { FullService, Service } from "@repo/common-lib/types/service";
import type { UserProfile } from "@repo/common-lib/types/user";
import { collapseWhitespace } from "@repo/common-lib/utils/seo-text";
import { serverEnv } from "@/env/server";
import { ORGANIZATION_SAME_AS } from "@/lib/config";
import { localizedUrl, resolveLocale, SITE_NAME } from "@/lib/seo/core";

/**
 * Schema.org builders. Every node is part of ONE connected graph:
 *
 * - Stable `@id`s identify the *entities* — the brand (`/#organization`), the site (`/#website`) and
 *   each artist (`/artists/{u}#person`). They are locale-independent: the artist is the same person
 *   on `/es` and `/pt`. Every page references them instead of repeating an anonymous copy, so engines
 *   can tell the Person credited on fifty artworks is one entity (the profile's).
 * - `url`s identify the *pages* and are always the current locale's URL — the same string as that
 *   page's canonical. They used to be the English URL everywhere, contradicting `/es`/`/pt` pages.
 * - Every page node carries `inLanguage` and `isPartOf` the website.
 */

// ---------------------------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------------------------

type Node = Record<string, unknown>;

const ORGANIZATION_ID = () => `${serverEnv.APP_URL}/#organization`;
const WEBSITE_ID = () => `${serverEnv.APP_URL}/#website`;
const personId = (username: string) =>
  `${localizedUrl("en", `/artists/${username}`)}#person`;

/** BCP 47 tag per app locale, for `inLanguage`. */
const IN_LANGUAGE = { en: "en", es: "es", pt: "pt" } as const;
const inLanguage = (locale: string) => IN_LANGUAGE[resolveLocale(locale)];

/** ISO-8601 for a Date/string, or undefined when absent/unparseable (never emit "Invalid Date"). */
const isoDate = (value?: Date | string | null): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Drop undefined/null/empty-string/empty-array values so no node carries hollow properties. */
const compact = (node: Node): Node =>
  Object.fromEntries(
    Object.entries(node).filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0),
    ),
  );

const text = (value?: string | null) =>
  value ? collapseWhitespace(value) || undefined : undefined;

const graph = (nodes: Node[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes.map(compact),
});

/** The artist as seen from any page: a reference to the profile's Person entity. */
export type ArtistRef = {
  username: string;
  /** Display name ("Name Surname"); falls back to the handle. */
  name?: string | null;
};

export const artistDisplayName = (a: {
  username: string;
  name?: string | null;
  surname?: string | null;
}) => [a.name, a.surname].filter(Boolean).join(" ") || `@${a.username}`;

const personRef = (artist: ArtistRef, locale: string): Node => ({
  "@type": "Person",
  "@id": personId(artist.username),
  name: artist.name || `@${artist.username}`,
  url: localizedUrl(locale, `/artists/${artist.username}`),
});

const pageBase = (locale: string, path: string): Node => ({
  url: localizedUrl(locale, path),
  inLanguage: inLanguage(locale),
  isPartOf: { "@id": WEBSITE_ID() },
});

type Crumb = { name: string; path: string };

/** Home › … trail. Mirrors the visible breadcrumb, including its list level. */
const breadcrumb = (locale: string, crumbs: Crumb[]): Node => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: SITE_NAME, path: "/" }, ...crumbs].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: localizedUrl(locale, c.path),
  })),
});

const artistCrumb = (artist: ArtistRef): Crumb => ({
  name: artist.name || `@${artist.username}`,
  path: `/artists/${artist.username}`,
});

type ImageLike = Pick<
  MediaPortfolio,
  | "public_id"
  | "url"
  | "thumbnail"
  | "title"
  | "seo_alt"
  | "seo_title"
  | "media_type"
>;

/**
 * An `ImageGallery` member. A video contributes its poster frame rather than the MP4 — an
 * `ImageObject` whose `contentUrl` is a video is invalid and Google drops the whole node. Each member
 * links to its own media page, which is also a crawl path.
 */
const galleryImage = (
  m: ImageLike,
  artist: ArtistRef,
  locale: string,
): Node | null => {
  const contentUrl = m.media_type === "VIDEO" ? m.thumbnail : m.url;
  if (!contentUrl && !m.thumbnail) return null;
  return {
    "@type": "ImageObject",
    contentUrl: contentUrl ?? m.thumbnail,
    thumbnailUrl: m.thumbnail,
    name: m.title || m.seo_title,
    caption: m.seo_alt,
    url: m.public_id
      ? localizedUrl(locale, `/artists/${artist.username}/media/${m.public_id}`)
      : undefined,
    creator: { "@id": personId(artist.username) },
  };
};

const gallery = (
  media: ImageLike[],
  artist: ArtistRef,
  locale: string,
): Node | undefined => {
  const image = media
    .map((m) => galleryImage(m, artist, locale))
    .filter((n): n is Node => n !== null)
    .slice(0, 25)
    .map(compact);
  return image.length ? { "@type": "ImageGallery", image } : undefined;
};

/**
 * Renders a Schema.org JSON-LD `<script>`. `<` is escaped to `<` so the JSON payload can never
 * break out of the script tag (XSS).
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

// ---------------------------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------------------------

/**
 * The brand entity. Carries the founder because A11STUDIO's positioning — "built by an artist, for
 * artists" (docs/A11STUDIO.md) — is its strongest trust signal, and answer engines can only connect
 * "who is behind A11STUDIO" when it is stated as data rather than prose.
 *
 * `A11STUDIO` is the one official name: no `alternateName` is declared, here or on the WebSite node.
 * Other spellings ("A11 Studio") belong to unrelated companies, and declaring them would invite
 * Google to merge the entities.
 */
const organizationNode = (description: string, founderRole: string): Node => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID(),
  name: SITE_NAME,
  url: localizedUrl("en", "/"),
  logo: {
    "@type": "ImageObject",
    url: `${serverEnv.APP_URL}/android-chrome-512x512.png`,
    width: 512,
    height: 512,
  },
  image: `${serverEnv.APP_URL}/og/default.jpg`,
  description,
  foundingDate: "2025",
  // Where the company is based, and that the platform serves artists and clients anywhere.
  address: { "@type": "PostalAddress", addressCountry: "ES" },
  areaServed: "Worldwide",
  founder: {
    "@type": "Person",
    name: "Thiago Ferreira",
    jobTitle: founderRole,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: serverEnv.SUPPORT_EMAIL,
    availableLanguage: ["English", "Spanish", "Portuguese"],
  },
  // Official brand profiles (single source: lib/social) — entity identity for search + AI.
  sameAs: ORGANIZATION_SAME_AS,
});

const websiteNode = (locale: string): Node => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID(),
  name: SITE_NAME,
  url: localizedUrl("en", "/"),
  inLanguage: ["en", "es", "pt"],
  publisher: { "@id": ORGANIZATION_ID() },
  // Google retired the sitelinks search box (Nov 2024), but other engines still read SearchAction,
  // and it documents the site's search URL.
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${localizedUrl(locale, "/artists")}?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

type BrandCopy = { description: string; founderRole: string };

/** Home: the brand, the site and the home page itself, in one graph. */
export function buildHomeJsonLd(
  locale: string,
  copy: BrandCopy & { pageName: string },
) {
  return graph([
    organizationNode(copy.description, copy.founderRole),
    websiteNode(locale),
    {
      "@type": "WebPage",
      ...pageBase(locale, "/"),
      name: copy.pageName,
      about: { "@id": ORGANIZATION_ID() },
    },
  ]);
}

/** /about: an `AboutPage` whose subject is the brand entity (with its founder). */
export function buildAboutPageJsonLd(
  locale: string,
  copy: BrandCopy & { pageName: string },
) {
  return graph([
    organizationNode(copy.description, copy.founderRole),
    {
      "@type": "AboutPage",
      ...pageBase(locale, "/about"),
      name: copy.pageName,
      mainEntity: { "@id": ORGANIZATION_ID() },
    },
  ]);
}

/**
 * /support: a `ContactPage` about the brand. The Organization node carries the `contactPoint`, so the
 * page and the support email resolve to the same entity.
 */
export function buildSupportPageJsonLd(
  locale: string,
  copy: BrandCopy & { pageName: string },
) {
  return graph([
    organizationNode(copy.description, copy.founderRole),
    {
      "@type": "ContactPage",
      ...pageBase(locale, "/support"),
      name: copy.pageName,
      about: { "@id": ORGANIZATION_ID() },
    },
  ]);
}

/** Strip HTML tags + collapse whitespace — FAQ answers are authored as rich HTML. */
const stripHtml = (html: string) =>
  collapseWhitespace(html.replace(/<[^>]*>/g, " "));

/**
 * FAQPage. Google has limited the FAQ rich result to government/health sites since 2023, so the value
 * here is answer engines, which lift exactly this Q&A shape. Answers are plain text.
 */
export function buildFaqPageJsonLd(
  items: { question: string; answer: string }[],
  locale: string,
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
  return graph([
    { "@type": "FAQPage", ...pageBase(locale, "/faqs"), mainEntity },
  ]);
}

// ---------------------------------------------------------------------------------------------
// Artist
// ---------------------------------------------------------------------------------------------

/**
 * ProfilePage + Person for a share-ready artist. The Person carries the `@id` every other page
 * references. No `streetAddress`: a street is a private fact for an individual, and the locality is
 * what "photographer in Madrid"-type searches match on.
 */
export function buildProfileJsonLd(
  profile: UserProfile,
  services: Service[],
  locale: string,
) {
  const artist: ArtistRef = {
    username: profile.username,
    name: artistDisplayName(profile),
  };
  const path = `/artists/${profile.username}`;
  const addr = profile.address;
  const address =
    addr && (addr.city || addr.state || addr.country_code)
      ? compact({
          "@type": "PostalAddress",
          addressLocality: addr.city,
          addressRegion: addr.state,
          addressCountry: addr.country_code?.toUpperCase() || addr.country,
        })
      : undefined;

  const sameAs = [
    profile.instagram_link,
    profile.facebook_link,
    profile.youtube_link,
    profile.website_link,
  ].filter((link): link is string => Boolean(link));

  // High commercial-intent surface: the artist's services as offerings.
  const makesOffer = services.map((s) =>
    compact({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.title,
        url: localizedUrl(locale, `${path}/services/${s.slug}`),
      },
      ...(s.show_price && s.price != null
        ? { price: s.price.toFixed(2), priceCurrency: PLATFORM_CURRENCY }
        : {}),
    }),
  );

  const person: Node = compact({
    "@type": "Person",
    "@id": personId(profile.username),
    name: artist.name,
    alternateName: `@${profile.username}`,
    url: localizedUrl(locale, path),
    jobTitle: text(profile.profession),
    hasOccupation: profile.profession
      ? compact({
          "@type": "Occupation",
          name: text(profile.profession),
          occupationLocation: address
            ? { "@type": "Place", address }
            : undefined,
        })
      : undefined,
    image: profile.avatar,
    description: text(profile.short_biography),
    knowsAbout: (profile.categories ?? []).map((c) => c.name).filter(Boolean),
    address,
    homeLocation: address ? { "@type": "Place", address } : undefined,
    telephone: profile.phone_number,
    makesOffer,
    sameAs,
  });

  return graph([
    {
      "@type": "ProfilePage",
      ...pageBase(locale, path),
      name: artist.name,
      dateModified: isoDate(profile.updated_at),
      mainEntity: person,
    },
    breadcrumb(locale, [artistCrumb(artist)]),
  ]);
}

/**
 * The artist's about page: a ProfilePage about the same Person entity (by `@id`), so the long-form
 * story an answer engine is most likely to quote is attached to the right artist.
 */
export function buildArtistAboutJsonLd(
  artist: ArtistRef,
  locale: string,
  page: {
    name: string;
    description?: string | null;
    image?: string | null;
    crumb: string;
  },
) {
  const path = `/artists/${artist.username}/about`;
  return graph([
    {
      "@type": "ProfilePage",
      ...pageBase(locale, path),
      name: page.name,
      description: text(page.description),
      primaryImageOfPage: page.image
        ? { "@type": "ImageObject", contentUrl: page.image }
        : undefined,
      mainEntity: { "@id": personId(artist.username) },
    },
    breadcrumb(locale, [artistCrumb(artist), { name: page.crumb, path }]),
  ]);
}

/**
 * An artist's list page (portfolios / collections / services): a CollectionPage whose ItemList
 * points at every entity page, so the list is machine-readable, not just a grid of links.
 */
export function buildArtistListJsonLd(
  artist: ArtistRef,
  locale: string,
  list: {
    /** Locale-agnostic path of this list page. */
    path: string;
    name: string;
    items: { name: string; path: string; image?: string | null }[];
  },
) {
  return graph([
    {
      "@type": "CollectionPage",
      ...pageBase(locale, list.path),
      name: list.name,
      author: personRef(artist, locale),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: list.items.length,
        itemListElement: list.items.map((item, i) =>
          compact({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            url: localizedUrl(locale, item.path),
            image: item.image,
          }),
        ),
      },
    },
    breadcrumb(locale, [
      artistCrumb(artist),
      { name: list.name, path: list.path },
    ]),
  ]);
}

// ---------------------------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------------------------

/**
 * ImageObject (or VideoObject) + breadcrumb for a media page. `additionalType: VisualArtwork` marks
 * it as a creative work while keeping the primary type Google Images / video indexing read.
 *
 * No `acquireLicensePage`/`license`: they pointed at the media page itself and at the platform's
 * Terms of Service, neither of which offers a licence — markup claiming a licensing path that does
 * not exist is exactly what Google's image-licence guidelines flag. Credit and copyright stay.
 *
 * `trail` is the visible breadcrumb above the media (e.g. its portfolio), when there is one.
 * `fallbackName` is the localized name for an untitled work with no AI title either.
 */
export function buildMediaJsonLd(
  media: MediaWithUser,
  locale: string,
  options: { username: string; fallbackName: string; trail?: Crumb[] },
) {
  // `media.user` is not guaranteed populated by every fetch path; fall back to the route username.
  const artist: ArtistRef = media.user
    ? { username: media.user.username, name: artistDisplayName(media.user) }
    : { username: options.username };
  const trail = options.trail ?? [];
  const path = `/artists/${artist.username}/media/${media.public_id}`;
  const isVideo = media.media_type === "VIDEO";
  // Required on VideoObject; an untitled video used to omit it and Google dropped the node.
  const name =
    text(media.title) || text(media.seo_title) || options.fallbackName;
  const description = text(media.description) || text(media.seo_description);
  const uploaded = isoDate(media.created_at);
  const year = uploaded?.slice(0, 4);

  const work: Node = {
    "@type": isVideo ? "VideoObject" : "ImageObject",
    additionalType: "https://schema.org/VisualArtwork",
    ...pageBase(locale, path),
    // An ImageObject-only property: it tells Google Images which image the page is about.
    ...(isVideo ? {} : { representativeOfPage: true }),
    name,
    description: description ?? (isVideo ? name : undefined),
    caption: text(media.seo_alt),
    contentUrl: media.url,
    thumbnailUrl: media.thumbnail,
    // A GIF is stored (and served) as a .gif — only still images are re-encoded to WebP.
    encodingFormat: isVideo
      ? "video/mp4"
      : media.media_type === "GIF"
        ? "image/gif"
        : "image/webp",
    creator: personRef(artist, locale),
    creditText: artist.name || `@${artist.username}`,
    copyrightHolder: { "@id": personId(artist.username) },
    copyrightYear: year ? Number(year) : undefined,
    copyrightNotice: year
      ? `© ${year} ${artist.name || `@${artist.username}`}`
      : undefined,
    // Where the artist says it was made — the place a "photography in Madrid" search matches on.
    contentLocation: media.location?.formatted
      ? { "@type": "Place", name: media.location.formatted }
      : undefined,
    // LLM-assigned content tags (localized) → keywords for Google Images / entity understanding.
    keywords: media.tags?.length ? media.tags.join(", ") : undefined,
    uploadDate: uploaded,
    dateModified: isoDate(media.updated_at),
    // ISO 8601 duration (PT95S is valid; Google normalizes it). Unknown for older videos.
    duration:
      isVideo && media.duration_seconds
        ? `PT${media.duration_seconds}S`
        : undefined,
  };

  return graph([
    work,
    breadcrumb(locale, [artistCrumb(artist), ...trail, { name, path }]),
  ]);
}

/**
 * A portfolio's or collection's description for this page's language. The artist writes one text,
 * in their own language, so on `/es` and `/pt` the localized AI description (from the entity's
 * `/metadata` endpoint) describes the page better; the default locale keeps the artist's words.
 */
const entityDescription = (
  locale: string,
  own?: string | null,
  localizedSeo?: string | null,
) =>
  resolveLocale(locale) === "en"
    ? text(own) || text(localizedSeo)
    : text(localizedSeo) || text(own);

/** CollectionPage + ImageGallery + breadcrumb for a portfolio (keywords from its categories). */
export function buildPortfolioJsonLd(
  portfolio: FullPortfolio,
  artist: ArtistRef,
  locale: string,
  listName: string,
  localizedSeoDescription?: string | null,
) {
  const path = `/artists/${artist.username}/portfolios/${portfolio.slug}`;
  const cover = portfolio.thumbnail;
  return graph([
    {
      "@type": "CollectionPage",
      ...pageBase(locale, path),
      name: portfolio.title,
      description: entityDescription(
        locale,
        portfolio.description,
        localizedSeoDescription,
      ),
      author: personRef(artist, locale),
      keywords: (portfolio.categories ?? [])
        .map((c) => c.name)
        .filter(Boolean)
        .join(", "),
      primaryImageOfPage: cover
        ? { "@type": "ImageObject", contentUrl: cover }
        : undefined,
      datePublished: isoDate(portfolio.created_at),
      dateModified: isoDate(portfolio.updated_at),
      mainEntity: gallery(portfolio.media ?? [], artist, locale),
    },
    breadcrumb(locale, [
      artistCrumb(artist),
      { name: listName, path: `/artists/${artist.username}/portfolios` },
      { name: portfolio.title, path },
    ]),
  ]);
}

/** CollectionPage + ImageGallery + breadcrumb for a collection. */
export function buildCollectionJsonLd(
  collection: FullCollection,
  artist: ArtistRef,
  locale: string,
  listName: string,
  localizedSeoDescription?: string | null,
) {
  const path = `/artists/${artist.username}/collections/${collection.slug}`;
  return graph([
    {
      "@type": "CollectionPage",
      ...pageBase(locale, path),
      name: collection.title,
      description: entityDescription(
        locale,
        collection.description,
        localizedSeoDescription,
      ),
      author: personRef(artist, locale),
      // Collections have no categories; keywords are their media's most frequent content tags.
      keywords: collection.tags?.length
        ? collection.tags.join(", ")
        : undefined,
      datePublished: isoDate(collection.created_at),
      dateModified: isoDate(collection.updated_at),
      mainEntity: gallery(collection.media ?? [], artist, locale),
    },
    breadcrumb(locale, [
      artistCrumb(artist),
      { name: listName, path: `/artists/${artist.username}/collections` },
      { name: collection.title, path },
    ]),
  ]);
}

/**
 * Service + breadcrumb. `areaServed` is the artist's locality — the signal "wedding photographer in
 * A Coruña" matches on — and `serviceType` their primary discipline. An `Offer` (priced in the
 * platform currency) is emitted only when `show_price` is on and a price exists — matching exactly
 * what the page renders, so the structured price never contradicts the visible one.
 */
export function buildServiceJsonLd(
  service: FullService,
  artist: ArtistRef & {
    city?: string | null;
    region?: string | null;
    countryCode?: string | null;
    discipline?: string | null;
  },
  locale: string,
  listName: string,
) {
  const path = `/artists/${artist.username}/services/${service.slug}`;
  const keywords = [
    ...new Set(
      [
        ...(service.features ?? []).map((f) => f.title),
        service.portfolio?.title,
      ].filter((k): k is string => !!k),
    ),
  ];
  const locality = artist.city || artist.region;
  return graph([
    {
      "@type": "Service",
      ...pageBase(locale, path),
      name: service.title,
      description: text(service.description),
      image: service.thumbnail,
      serviceType: artist.discipline,
      provider: personRef(artist, locale),
      areaServed: locality
        ? compact({
            "@type": artist.city ? "City" : "AdministrativeArea",
            name: locality,
            address: compact({
              "@type": "PostalAddress",
              addressLocality: artist.city,
              addressRegion: artist.region,
              addressCountry: artist.countryCode?.toUpperCase(),
            }),
          })
        : undefined,
      keywords: keywords.join(", "),
      offers:
        service.show_price && service.price != null
          ? {
              "@type": "Offer",
              price: service.price.toFixed(2),
              priceCurrency: PLATFORM_CURRENCY,
              availability: "https://schema.org/InStock",
              url: localizedUrl(locale, path),
              seller: { "@id": personId(artist.username) },
            }
          : undefined,
    },
    breadcrumb(locale, [
      artistCrumb(artist),
      { name: listName, path: `/artists/${artist.username}/services` },
      { name: service.title, path },
    ]),
  ]);
}

/**
 * A directory hub (`/artists`, `/portfolios`): CollectionPage + ItemList of the entries on this page.
 * The enumerable-list shape answer engines use for "top X in Y" questions.
 */
export function buildDirectoryJsonLd(
  locale: string,
  directory: {
    path: string;
    name: string;
    description?: string;
    items: { name: string; path: string; image?: string | null }[];
  },
) {
  return graph([
    {
      "@type": "CollectionPage",
      ...pageBase(locale, directory.path),
      name: directory.name,
      description: directory.description,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: directory.items.length,
        itemListElement: directory.items.map((item, i) =>
          compact({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            url: localizedUrl(locale, item.path),
            image: item.image,
          }),
        ),
      },
    },
  ]);
}
