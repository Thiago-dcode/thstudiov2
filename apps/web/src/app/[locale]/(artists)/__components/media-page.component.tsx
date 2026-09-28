import type { MediaWithUser } from "@repo/common-lib/types/media";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArtistBreadcrumb,
  type BreadcrumbEntry,
} from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { FullscreenMedia } from "@/app/[locale]/(artists)/__components/fullscreen-media";
import Web from "@/lib/components/web-page.component";
import { artistDisplayName, buildMediaJsonLd, JsonLd } from "@/lib/seo/json-ld";

interface MediaPageComponentProps {
  user: { username: string };
  media: MediaWithUser;
  breadcrumbs?: BreadcrumbEntry[];
  backUrl?: string;
  canEdit?: boolean;
}

export const MediaPageComponent = async ({
  user,
  media,
  breadcrumbs = [],
  backUrl,
  canEdit,
}: MediaPageComponentProps) => {
  const [t, locale] = await Promise.all([
    getTranslations("artists.media"),
    getLocale(),
  ]);
  const artistName = media.user
    ? artistDisplayName(media.user)
    : `@${user.username}`;
  // Only what the artist wrote is shown. The SEO title/description are head metadata — as visible
  // copy they read as a keyword string, not as the artist's own words.
  const title = media.title || t("titleFallback", { name: artistName });
  const description = media.description || "";

  const allBreadcrumbs: BreadcrumbEntry[] = [
    ...breadcrumbs,
    {
      // The real route is /artists/{username}/media/{id} — the username-less form 404s. Harmless
      // today because `isActive` renders it as a span, but it is the href the moment that changes.
      url: `/artists/${user.username}/media/${media.public_id}`,
      title,
      isActive: true,
    },
  ];

  return (
    <Web.Container>
      <JsonLd
        data={buildMediaJsonLd(media, locale, {
          username: user.username,
          fallbackName: title,
          // The visible trail's links may carry UI state (`?ci=` reopens the lightbox); the
          // structured trail names the page itself.
          trail: breadcrumbs.map((b) => ({
            name: b.title,
            path: b.url.split("?")[0],
          })),
        })}
      />
      <ArtistBreadcrumb
        username={user.username}
        items={allBreadcrumbs}
        backUrl={backUrl}
      />
      <Web.Header title={title} description={description}>
        {canEdit && (
          <Web.EditLink
            href={`/atelier/media?m=${media.public_id}`}
            label={t("editAria")}
          />
        )}
      </Web.Header>

      <FullscreenMedia
        url={media.url}
        alt={
          media.seo_alt || media.title || t("altFallback", { name: artistName })
        }
        title={media.title || undefined}
        aspectRatio={media.aspect_ratio}
        mediaType={media.media_type}
        // The video poster: shown while the first frame loads, and the only thing a browser
        // that refuses to autoplay ever paints.
        thumbnail={media.thumbnail}
      />
    </Web.Container>
  );
};
