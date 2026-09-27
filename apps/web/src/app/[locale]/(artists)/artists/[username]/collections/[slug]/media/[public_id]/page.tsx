import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { urlLocaleToLanguageCode } from "@/i18n/routing";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { isMissingResponse } from "@/lib/seo/core";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{
    locale: string;
    username: string;
    slug: string;
    public_id: string;
  }>;
  searchParams: Promise<{
    cb?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username, public_id } = await params;
  const [response, t] = await Promise.all([
    mediaService.getSeoMetadata(public_id, urlLocaleToLanguageCode(locale)),
    getTranslations("artists.media"),
  ]);

  if (isMissingResponse(response)) notFound();
  const { data } = response;
  if (!data) return { robots: { index: false, follow: false } };

  // canonical_path is the PRIMARY media URL (/artists/{username}/media/{public_id}), so this nested
  // view consolidates its ranking signal there instead of cannibalizing it.
  return buildSeoMetadata(data, locale, {
    title: t("titleFallback", { name: `@${username}` }),
  });
}

export default async function MediaPage({ params, searchParams }: Props) {
  const { locale, username, slug, public_id } = await params;
  const tCollections = await getTranslations("artists.collections");

  const [user, collectionResponse, session] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getByUsername(username, slug),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }

  const collection = collectionResponse.data;
  if (!collection || collection.blocked_at) {
    notFound();
  }

  const { data: media } = await mediaService.getByPublicId(
    public_id,
    urlLocaleToLanguageCode(locale),
  );

  const belongsToCollection =
    !!media && collection.media.some((m) => m.public_id === media.public_id);

  // `!media.url` matches the completeness gate the portfolio route already applies via
  // `completed_at`: an unprocessed media has no asset, so serving it would publish a thin
  // indexable page with ImageObject JSON-LD for an image that does not exist yet.
  if (!media || media.blocked_at || !media.url || !belongsToCollection) {
    notFound();
  }

  const canEdit = session?.id === media.user_id;

  const qp = await searchParams;

  const acceptCallback = qp?.cb === "1";
  const collectionUrl = `/artists/${username}/collections/${slug}`;
  const backUrl = `${collectionUrl}${acceptCallback ? `?ci=m_${media.public_id}` : ""}`;

  return (
    <MediaPageComponent
      user={media.user ?? { username }}
      media={media}
      canEdit={canEdit}
      backUrl={backUrl}
      breadcrumbs={[
        {
          title: tCollections("pageTitle"),
          url: `/artists/${username}/collections`,
          isActive: false,
        },
        {
          // The collection's title — the raw slug ("Collections amsterdam-2026") used to show here.
          title: collection.title,
          url: backUrl,
          isActive: false,
        },
      ]}
    />
  );
}
