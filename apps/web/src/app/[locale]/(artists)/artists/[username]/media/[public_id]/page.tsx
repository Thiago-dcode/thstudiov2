import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import { urlLocaleToLanguageCode } from "@/i18n/routing";
import Web from "@/lib/components/web-page.component";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string; public_id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string; public_id: string }>;
}): Promise<Metadata> {
  const { locale, public_id } = await params;
  const { data } = await mediaService.getSeoMetadata(
    public_id,
    urlLocaleToLanguageCode(locale),
  );

  if (!data) {
    return { robots: { index: false, follow: false } };
  }

  return buildSeoMetadata(data, locale, { title: data.seo_title || "Artwork" });
}

export default async function MediaPage({ params }: Props) {
  const { locale, username, public_id } = await params;
  const tNotFound = await getTranslations("artists.resourceNotFound");

  const [user, { data: media }, session] = await Promise.all([
    usersService.getCompact(username),
    mediaService.getByPublicId(public_id, urlLocaleToLanguageCode(locale)),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }

  // `!media.url` covers a media whose processing has not finished (or failed): there is no
  // asset to show, and serving a 200 with an empty media page would publish a thin,
  // indexable URL carrying ImageObject JSON-LD for an image that does not exist yet.
  if (!media || media.blocked_at || !media.url) {
    return (
      <Web.Container>
        <ResourceNotFound username={username} message={tNotFound("media")} />
      </Web.Container>
    );
  }

  const canEdit = session?.id === media.user_id;

  return (
    <MediaPageComponent user={media.user} media={media} canEdit={canEdit} />
  );
}
