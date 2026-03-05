import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";

type Props = {
    params: Promise<{ username: string, public_id: string }>;
};

export default async function MediaPage({ params }: Props) {
    const { username, public_id } = await params;

    const user = await usersService.getCompact(username);
    if (!user.data) {
        notFound();
    }
    const { data: media } = await mediaService.getByPublicId(public_id);

    if (!media || media.blocked) {
        notFound();
    }

    return (
        <MediaPageComponent
            user={media.user}
            media={media}
        />
    );
}
