import { cn } from "@repo/ui/lib/utils";
import { MediaPortfolio } from "@repo/common-lib/types/media";

const getShapeClass = (shape?: string | null) => {
    switch (shape) {
        case 'LANDSCAPE': return 'w-[90%] aspect-video';
        case 'PORTRAIT': return 'w-[60%] aspect-[3/4]';
        case 'SQUARE':
        default: return 'w-[85%] aspect-square';
    }
};

export function PortfolioMediaCard({ media }: { media: MediaPortfolio }) {
    return (
        <div className="bg-fg/60 rounded-xl p-4">
            <div className="aspect-square w-full rounded-lg flex items-center justify-center">
                <div className={cn("relative overflow-hidden rounded-sm", getShapeClass(media.shape))}>
                    <img
                        src={media.thumbnail || undefined}
                        alt={media.seo_alt || media.title || ""}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <h3 className="mt-2 text-xs font-medium text-foreground line-clamp-1 px-0.5">
                {media.title || media.seo_filename || 'Untitled'}
            </h3>
        </div>
    );
}
