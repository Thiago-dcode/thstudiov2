import type { MediaWithUser } from "@repo/common-lib/types/media";
import { Pencil } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArtistBreadcrumb,
  type BreadcrumbEntry,
} from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { FullscreenMedia } from "@/app/[locale]/(artists)/__components/fullscreen-media";
import { Link } from "@/i18n/navigation";
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
  // Untitled work is the common case for photographers. It used to render an empty <h1> and no text
  // at all — the most numerous indexable page type was thin by construction. The AI title and
  // description exist (localized) for exactly this; they are now the visible fallback.
  const title =
    media.title || media.seo_title || t("titleFallback", { name: artistName });
  const description = media.description || media.seo_description || "";

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
          <Link
            href={`/atelier/media?m=${media.public_id}`}
            aria-label={t("editAria")}
            className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
          >
            <Pencil className="size-4 md:size-5" />
          </Link>
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
