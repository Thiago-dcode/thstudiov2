import { notFound } from "next/navigation";
import mediaService from "@/modules/media/media.service";
import { ResourceNotFound } from "@/app/(artists)/__components/resource-not-found";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import Web from "@/lib/components/web-page.component";

type Props = {
    params: Promise<{ username: string, slug: string, public_id: string }>;
    searchParams: Promise<{
        cb?: string
    }>;
};

export default async function MediaPage({ params, searchParams }: Props) {
    const { username, slug, public_id } = await params;

    const [user, slugExist, session] = await Promise.all([
        usersService.usernameExists(username),
        userCollectionService.slugExists(username, slug),
        userSession()
    ]);

    if (!user.data) {
        notFound();
    }

    if (!slugExist.data) {
        return (
            <Web.Container>
                <ResourceNotFound
                    username={username}
                    message="The collection you're looking for doesn't exist or may have been removed."
                />
            </Web.Container>
        );
    }

    const { data: media } = await mediaService.getByPublicId(public_id);

    if (!media || media.blocked) {
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

    const acceptCallback = qp?.cb == '1';



    return (
        <MediaPageComponent
            user={media.user}
            media={media}
            canEdit={canEdit}
            breadcrumbs={
                [
                    {
                        title: `Collection ${slug}`,
                        url: `/artists/${username}/collections/${slug}${acceptCallback ? `?ci=m_${media.public_id}` : ''}`,
                        isActive: false,
                    }
                ]
            }
        />
    );
}
