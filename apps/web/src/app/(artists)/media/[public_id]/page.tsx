import mediaService from "@/modules/media/media.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";

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

type Props = {
    params: Promise<{ public_id: string }>;
};

export default async function MediaPage({ params }: Props) {
    const { public_id } = await params;

    const { data: media } = await mediaService.getByPublicId(public_id);

    if (!media || media.blocked) {
        notFound();
    }

    return (
        <div className="w-full min-w-0 max-h-screen flex flex-col items-center justify-center px-2 sm:px-4 py-4 overflow-hidden">
            <figure className="flex flex-col items-center w-full max-w-[min(1200px,90vw)] min-h-0 flex-1">
                <div className={cn("relative overflow-hidden rounded-lg shrink-0 min-h-0", getMediaPageShapeClass(media.shape))}>
                    <Image
                        src={media.url}
                        alt={media.seo_alt || media.title || ''}
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 1024px) 90vw, 1200px"
                    />
                    <figcaption className="absolute left-0 top-0 p-2 min-w-0 max-w-full">
                        <h1 className="text-lg font-bold truncate">
                            {media.title || 'Untitled'}
                        </h1>
                        {(media.seo_description || media.description) && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-0.5">
                                {media.description || media.seo_description}
                            </p>
                        )}
                    </figcaption>
                    <Link
                        href={`/artists/${media.user.username}`}
                        className="absolute right-0 bottom-0 p-2 block max-w-full truncate text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        @{media.user.username}
                    </Link>
                </div>
            </figure>
        </div>
    );
}
