import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import Web from "@/lib/components/web-page.component";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string; slug: string; public_id: string }>;
  searchParams: Promise<{
    cb?: string;
  }>;
};

export default async function MediaPage({ params, searchParams }: Props) {
  const { username, slug, public_id } = await params;

  const [user, slugExist, session] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.slugExists(username, slug),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }

  if (!slugExist.data) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message="The portfolio you're looking for doesn't exist or may have been removed."
        />
      </Web.Container>
    );
  }

  const { data: media } = await mediaService.getByPublicId(public_id);

  if (!media || media.blocked_at) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message="The media you're looking for doesn't exist or may have been removed."
        />
      </Web.Container>
    );
  }

  const canEdit = session?.id === media.user_id;

  const qp = await searchParams;

  const acceptCallback = qp?.cb === "1";
  const backUrl = `/artists/${username}/portfolios/${slug}${acceptCallback ? `?ci=${encodeURIComponent(media.public_id)}` : ""}`;

  return (
    <MediaPageComponent
      user={media.user}
      media={media}
      canEdit={canEdit}
      backUrl={backUrl}
      breadcrumbs={[
        {
          title: `Portfolio ${slug}`,
          url: backUrl,
          isActive: false,
        },
      ]}
    />
  );
}
