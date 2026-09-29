import { normalizeUsername } from "@repo/common-lib/utils/username";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { localePrefix, urlLocaleToLanguageCode } from "@/i18n/routing";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { isMissingResponse, redirectToCanonicalUsername } from "@/lib/seo/core";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string; public_id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username, public_id } = await params;
  redirectToCanonicalUsername(locale, username, `/media/${public_id}`);
  const [response, t] = await Promise.all([
    mediaService.getSeoMetadata(public_id, urlLocaleToLanguageCode(locale)),
    getTranslations("artists.media"),
  ]);

  // Resolved before the first byte: a missing media is a real 404, and a media reached under the
  // wrong artist (`/artists/anyone/media/<someone else's id>` used to render with a 200) is a real
  // 308 to its owner's URL, consolidating the duplicate instead of relying on the canonical.
  if (isMissingResponse(response)) notFound();
  const { data } = response;
  if (!data) return { robots: { index: false, follow: false } };

  const ownerPath = data.canonical_path;
  if (!ownerPath.startsWith(`/artists/${normalizeUsername(username)}/`)) {
    permanentRedirect(`${localePrefix(locale)}${ownerPath}`);
  }

  return buildSeoMetadata(data, locale, {
    title: t("titleFallback", { name: `@${normalizeUsername(username)}` }),
  });
}

export default async function MediaPage({ params }: Props) {
  const { locale, username, public_id } = await params;

  const [user, { data: media }, session] = await Promise.all([
    usersService.getCompact(username),
    mediaService.getByPublicId(public_id, urlLocaleToLanguageCode(locale)),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }

  const canEdit = session?.id === media?.user_id;

  // `!media.url` covers a media whose processing has not finished (or failed): there is no
  // asset to show, and serving a 200 with an empty media page would publish a thin,
  // indexable URL carrying ImageObject JSON-LD for an image that does not exist yet.
  // An inactive media is one its owner switched off: gone for visitors, still previewable by
  // the owner so the atelier's "view public page" link doesn't dead-end.
  if (
    !media ||
    media.blocked_at ||
    !media.url ||
    (!media.is_active && !canEdit)
  ) {
    notFound();
  }

  return (
    <MediaPageComponent
      user={media.user ?? { username: normalizeUsername(username) }}
      media={media}
      canEdit={canEdit}
    />
  );
}
