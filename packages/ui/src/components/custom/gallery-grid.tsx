import "../../assets/gallery-grid.css";
import { MediaGalleryCard } from "./media-gallery-card";
import { MediaPortfolio } from "@repo/common-lib/types/media";

export type AvailableGridStyles = 'mansonry-grid' | 'uniform-grid';

export const GalleryGrid = ({ media, style = 'mansonry-grid' }: {
    media: MediaPortfolio[],
    style?: AvailableGridStyles,
}) => {
    return (
        <div className={style}>
            {media.map((m, i) => (
                <MediaGalleryCard key={m.id} media={m} index={i} gridStyle={style} />
            ))}
        </div>
    )
}
