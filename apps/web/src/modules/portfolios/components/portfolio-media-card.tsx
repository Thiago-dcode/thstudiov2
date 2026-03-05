"use client";

import Image from "next/image";
import { MediaPortfolio } from "@repo/common-lib/types/media";
import { EnumType } from "@repo/common-lib/constants/enums";
import { useGallery } from "@repo/ui/providers/gallery.provider";

const toDataShape = (shape?: EnumType<'MEDIA_SHAPE'> | null) => {
    switch (shape) {
        case 'LANDSCAPE': return 'landscape';
        case 'PORTRAIT': return 'portrait';
        case 'SQUARE':
        default: return 'square';
    }
};

export function PortfolioMediaCard({ media, index }: { media: MediaPortfolio; index: number }) {
    const { setCurrentItem } = useGallery();
    
    return (
        <button
            onClick={() => setCurrentItem(index)}
            className="cursor-pointer portfolio-media-card group relative w-full overflow-hidden transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20 rounded-xs"
            data-shape={toDataShape(media.shape)}
        >
            {media.thumbnail ? (
                <div className="relative aspect-auto overflow-hidden">
                    <Image
                        src={media.thumbnail}
                        alt={media.seo_alt || media.title || ""}
                        width={800}
                        height={1000}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5" />
                </div>
            ) : (
                <div className="portfolio-media-card__placeholder aspect-square flex items-center justify-center bg-fg-1 text-xs text-text-muted italic">
                    void
                </div>
            )}
        </button>
    );
}
