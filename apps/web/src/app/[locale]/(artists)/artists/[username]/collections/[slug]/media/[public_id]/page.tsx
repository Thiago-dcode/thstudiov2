import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import Web from "@/lib/components/web-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string; slug: string; public_id: string }>;
  searchParams: Promise<{
    cb?: string;
  }>;
};

export default async function MediaPage({ params, searchParams }: Props) {
  const { username, slug, public_id } = await params;
  const tNotFound = await getTranslations("artists.resourceNotFound");
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
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message={tNotFound("collection")}
        />
      </Web.Container>
    );
  }

  const { data: media } = await mediaService.getByPublicId(public_id);

  const belongsToCollection =
    !!media && collection.media.some((m) => m.public_id === media.public_id);

  if (!media || media.blocked_at || !belongsToCollection) {
    return (
      <Web.Container>
        <ResourceNotFound username={username} message={tNotFound("media")} />
      </Web.Container>
    );
  }

  const canEdit = session?.id === media.user_id;

  const qp = await searchParams;

  const acceptCallback = qp?.cb === "1";
  const backUrl = `/artists/${username}/collections/${slug}${acceptCallback ? `?ci=m_${media.public_id}` : ""}`;

  return (
    <MediaPageComponent
      user={media.user}
      media={media}
      canEdit={canEdit}
      backUrl={backUrl}
      breadcrumbs={[
        {
          title: `${tCollections("pageTitle")} ${slug}`,
          url: backUrl,
          isActive: false,
        },
      ]}
    />
  );
}
