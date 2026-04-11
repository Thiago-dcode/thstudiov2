import { ArtistBreadcrumb, BreadcrumbEntry } from "@/app/(artists)/__components/artist-breadcrumb";
import Web from "@/lib/components/web-page.component";
import { MediaWithUser } from "@repo/common-lib/types/media";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface MediaPageComponentProps {
    user: { username: string };
    media: MediaWithUser;
    breadcrumbs?: BreadcrumbEntry[];
    canEdit?: boolean;
}

export const MediaPageComponent = ({ user, media, breadcrumbs = [], canEdit }: MediaPageComponentProps) => {
    const allBreadcrumbs: BreadcrumbEntry[] = [
        ...breadcrumbs,
        {
            url: `/artists/media/${media.public_id}`,
            title: media.title || "Untitled",
            isActive: true
        }
    ];

    return (
        <Web.Container>
            <ArtistBreadcrumb
                username={user.username}
                items={allBreadcrumbs}
            />
            <Web.Header 
                title={media.title || 'Untitled'} 
                description={media.description || media.seo_description || undefined}
            >
                {canEdit && (
                    <Link
                        href={`/atelier/media?m=${media.public_id}`}
                        aria-label="Edit media"
                        className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
                    >
                        <Pencil className="size-4 md:size-5" />
                    </Link>
                )}
            </Web.Header>
            <figure className="flex flex-col items-center justify-center w-full flex-1 min-h-[50vh]">
                <img
                    src={media.url}
                    alt={media.seo_alt || media.title || ''}
                    className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg"
                />
            </figure>
        </Web.Container>
    );
};
