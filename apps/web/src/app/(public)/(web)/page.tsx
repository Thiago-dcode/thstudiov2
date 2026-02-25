import mediaService from "@/modules/media/media.service";
import usersService from "@/modules/users/users.service";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
    params: Promise<{ username: string; public_id: string }>;
};

export default async function MediaPage({ params }: Props) {
    const { username, public_id } = await params;

    console.log(username,public_id)
    const [userResponse, mediaResponse] = await Promise.all([
        usersService.getCompact(username),
        mediaService.getByPublicId(public_id),
    ]);

    const user = userResponse.data;
    const media = mediaResponse.data;

    console.log(user,media)

    if (!user || !media || media.blocked) {
        notFound();
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-2">
            <div className="text-center max-w-2xl space-y-1">
                <h1 className="text-xl font-bold">
                    {media.title || 'Untitled'}
                </h1>
                {(media.seo_description || media.description) && (
                    <p className="text-sm text-muted-foreground">
                        {media.seo_description || media.description}
                    </p>
                )}
            </div>

            <img
                src={media.url}
                alt={media.seo_alt || media.title || ''}
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />

            <Link
                href={`/artists/${username}`}
                className="self-start text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                @{username}
            </Link>
        </div>
    );
}
