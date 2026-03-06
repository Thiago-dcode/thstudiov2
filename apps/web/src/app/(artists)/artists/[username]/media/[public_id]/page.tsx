import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

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

    if (!media || media.blocked) {
        notFound();
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
