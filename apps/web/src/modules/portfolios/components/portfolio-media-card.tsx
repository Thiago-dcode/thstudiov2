import { cn } from "@repo/ui/lib/utils";
import { MediaPortfolio } from "@repo/common-lib/types/media";
import Link from "next/link";
import Image from "next/image";

const getShapeClass = (shape?: string | null) => {
    switch (shape) {
        case 'LANDSCAPE': return 'w-[90%] aspect-video';
        case 'PORTRAIT': return 'w-[60%] aspect-[3/4]';
        case 'SQUARE':
        default: return 'w-[85%] aspect-square';
    }
};

export function PortfolioMediaCard({ media }: { media: MediaPortfolio;}) {
    return (
        <Link href={`/media/${media.public_id}`} className="block bg-fg/60 rounded-xl p-4 transition-opacity hover:opacity-80">
            <div className="aspect-square w-full rounded-lg flex items-center justify-center">
                <div className={cn("relative overflow-hidden rounded-sm", getShapeClass(media.shape))}>
                    {media.thumbnail ? (
                        <Image
                            src={media.thumbnail}
                            alt={media.seo_alt || media.title || ""}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            No image
                        </div>
                    )}
                </div>
            </div>
            <h3 className="mt-2 text-xs font-medium text-foreground line-clamp-1 px-0.5">
                {media.title || media.seo_filename || 'Untitled'}
            </h3>
        </Link>
    );
}
