import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import { MediaPageComponent } from "@/app/(artists)/__components/media-page.component";
import usersService from "@/modules/users/users.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";

type Props = {
    params: Promise<{ username: string, slug: string, public_id: string }>;
    searchParams: Promise<{
        cb?:string
    }>;
};

export default async function MediaPage({ params,searchParams }: Props) {
    const { username, slug, public_id } = await params;

    const [user, slugExist] = await Promise.all([usersService.getCompact(username), userPortfolioService.slugExists(username, slug)]);

    if (!user.data || !slugExist.data?.exists) {
        notFound();
    }

    const { data: media } = await mediaService.getByPublicId(public_id);

    if (!media || media.blocked) {
        notFound();
    }

    const qp = await searchParams;

    const acceptCallback = qp?.cb == '1';



    return (
        <MediaPageComponent
            user={media.user}
            media={media}
            breadcrumbs={
                [
                    {
                        title: `Portfolio ${slug}`,
                        url: `/artists/${username}/portfolios/${slug}${acceptCallback?`?ci=m_${media.public_id}`:''}`,
                        isActive: false,
                    }
                ]
            }
        />
    );
}
