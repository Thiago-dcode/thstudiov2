import { MediaPortfolio } from "@repo/common-lib/types/media";
import Link from "next/link";
import { EnumType } from "@repo/common-lib/constants/enums";

const toDataShape = (shape?: EnumType<'MEDIA_SHAPE'> | null) => {
    switch (shape) {
        case 'LANDSCAPE': return 'landscape';
        case 'PORTRAIT': return 'portrait';
        case 'SQUARE':
        default: return 'square';
    }
};

export function PortfolioMediaCard({ media }: { media: MediaPortfolio; }) {
    return (
        <Link
            href={`/media/${media.public_id}`}
            className="portfolio-media-card"
            data-shape={toDataShape(media.shape)}
        >
            {media.thumbnail ? (
                <img
                    src={media.thumbnail}
                    alt={media.seo_alt || media.title || ""}
                />
            ) : (
                <div className="portfolio-media-card__placeholder">
                    No image
                </div>
            )}
        </Link>
    );
}
