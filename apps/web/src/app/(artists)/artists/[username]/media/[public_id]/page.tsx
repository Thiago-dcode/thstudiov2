import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { ResourceNotFound } from "@/app/(artists)/__components/resource-not-found";
import Web from "@/lib/components/web-page.component";

type Props = {
    params: Promise<{ username: string, public_id: string }>;
};

export default async function MediaPage({ params }: Props) {
    const { username, public_id } = await params;

    const [user, { data: media }, session] = await Promise.all([
        usersService.getCompact(username),
        mediaService.getByPublicId(public_id),
        userSession()
    ]);

    if (!user.data) {
        notFound();
    }

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

    return (
        <MediaPageComponent
            user={media.user}
            media={media}
            canEdit={canEdit}
        />
    );
}
