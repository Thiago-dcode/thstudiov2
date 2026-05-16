import { ArtistBreadcrumb, BreadcrumbEntry } from "@/app/(artists)/__components/artist-breadcrumb";
import { FullscreenMedia } from "@/app/(artists)/__components/fullscreen-media";
import Web from "@/lib/components/web-page.component";
import { MediaWithUser } from "@repo/common-lib/types/media";
import { Pencil } from "lucide-react";
import Link from "next/link";

interface MediaPageComponentProps {
    user: { username: string };
    media: MediaWithUser;
    breadcrumbs?: BreadcrumbEntry[];
    backUrl?: string;
    canEdit?: boolean;
}

export const MediaPageComponent = ({ user, media, breadcrumbs = [], backUrl, canEdit }: MediaPageComponentProps) => {
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
                backUrl={backUrl}
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

            <FullscreenMedia
                url={media.url}
                alt={media.seo_alt || media.title || ''}
                title={media.title || undefined}
            />
        </Web.Container>
    );
};
