import { ReactNode } from "react";
import "../../../assets/gallery-grid.css";
import { MediaGalleryCard } from "./media-gallery-card";
import { MediaPortfolio } from "@repo/common-lib/types/media";
import { PortfolioItem } from "@repo/common-lib/types/portfolio";
import { CollectionGalleryCard } from "./collection-gallery-card";
export type GalleryGridMedia = Pick<MediaPortfolio, 'id' | 'thumbnail' | 'title' | 'seo_alt' | 'shape'>;

export type AvailableGridStyles = 'mansonry-grid' | 'uniform-grid';

export const GalleryGridContainer = ({ children, style = 'mansonry-grid' }: {
    style?: AvailableGridStyles,
    children: ReactNode
}) => {

    return (
        <div className={style}>
        {children}
    </div>)


}

export const PortfolioGrid = ({ portfolioItems, style = 'mansonry-grid' }: {
    portfolioItems: PortfolioItem[],
    style?: AvailableGridStyles,
}) => {
    return (
        <GalleryGridContainer style={style}>
            {portfolioItems.map((item, i) => {

                if (item.item === 'media') {
                    return <MediaGalleryCard key={`${item.item}-${item.id}`} media={item} index={i} gridStyle={style} />
                }
                else if (item.item === 'collection') {

                    return <CollectionGalleryCard key={`${item.item}-${item.id}`} collection={item} index={i} gridStyle={style} />
                }
            })}
        </GalleryGridContainer>
    )
}

export const GalleryGrid = ({ media, style = 'mansonry-grid' }: {
    media: GalleryGridMedia[],
    style?: AvailableGridStyles,
}) => {
    return (
        <GalleryGridContainer style={style}>
            {media.map((m, i) => (
                <MediaGalleryCard key={m.id} media={m} index={i} gridStyle={style} />
            ))}
        </GalleryGridContainer>
    )
}
