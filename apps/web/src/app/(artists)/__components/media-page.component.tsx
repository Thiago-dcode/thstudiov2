import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import { ArtistBreadcrumb, BreadcrumbEntry } from "@/app/(artists)/__components/artist-breadcrumb";
import Web from "@/lib/components/web-page.component";
import { MediaWithUser } from "@repo/common-lib/types/media";

interface MediaPageComponentProps {
    user: { username: string };
    media: MediaWithUser;
    breadcrumbs?: BreadcrumbEntry[];
}

const getMediaPageShapeClass = (shape?: string | null) => {
    switch (shape) {
        case 'LANDSCAPE':
            return 'w-full max-h-[70vh] aspect-video';
        case 'PORTRAIT':
            return 'h-[70vh] aspect-[3/4] min-w-[200px]';
        case 'SQUARE':
        default:
            return 'w-[min(70vw,70vh)] h-[min(70vw,70vh)] aspect-square';
    }
};

export const MediaPageComponent = ({ user, media, breadcrumbs = [] }: MediaPageComponentProps) => {
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
                className="mb-8 md:mb-10"
                username={user.username}
                items={allBreadcrumbs}
            />
            <Web.Header 
                title={media.title || 'Untitled'} 
                description={media.description || media.seo_description || undefined}
            />
            <figure className="flex flex-col items-center w-full max-w-[min(1200px,90vw)] min-h-0 flex-1">
                <div className={cn("relative overflow-hidden rounded-lg shrink-0 min-h-0", getMediaPageShapeClass(media.shape))}>
                    <Image
                        src={media.url}
                        alt={media.seo_alt || media.title || ''}
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 1024px) 90vw, 1200px"
                    />
                </div>
            </figure>
        </Web.Container>
    );
};
