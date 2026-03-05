import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";

type Props = {
    params: Promise<{ username: string, slug: string, public_id: string }>;
};

export default async function MediaPage({ params }: Props) {
    const { username, slug, public_id } = await params;

    const [user, slugExist] = await Promise.all([usersService.getCompact(username), userPortfolioService.slugExists(username, slug)]);

    if (!user.data || !slugExist.data?.exists) {
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
            breadcrumbs={
                [
                    {
                        title: `Portfolio ${slug}`,
                        url: `/artists/${username}/portfolios/${slug}`,
                        isActive: false,
                    }
                ]
            }
        />
    );
}
