import type { PortfolioLayout } from "@repo/common-lib/types/layout";
import { MediaPortfolio } from "@repo/common-lib/types/media";
import { PortfolioItem } from "@repo/common-lib/types/portfolio";
import { ReactNode } from "react";
import "../../../assets/gallery-grid.css";
import { CollectionGalleryCard } from "./collection-gallery-card";
import {
  getGalleryGridClassName,
  getGalleryGridContainerStyle,
  needsMasonryWrapper,
  normalizeGalleryLayout,
} from "./gallery-layout";
import { MediaGalleryCard } from "./media-gallery-card";

export type GalleryGridMedia = Pick<
    MediaPortfolio,
    "id" | "thumbnail" | "title" | "seo_alt" | "aspect_ratio"
>;

type GalleryGridProps = {
    layout?: PortfolioLayout;
};

export const GalleryGridContainer = ({
    children,
    layout,
}: GalleryGridProps & {
    children: ReactNode;
}) => {
  const resolvedLayout = normalizeGalleryLayout(layout);
  const gridClassName = getGalleryGridClassName(resolvedLayout);
  const containerStyle = getGalleryGridContainerStyle(resolvedLayout);

  if (needsMasonryWrapper(resolvedLayout)) {
    return (
      <div className="layout-masonry-wrapper">
        <div className={gridClassName} style={containerStyle}>
          {children}
        </div>
      </div>
    );
  }

    return (
        <div className={gridClassName} style={containerStyle}>
            {children}
        </div>
    );
};

export const PortfolioGrid = ({
    portfolioItems,
    layout,
}: GalleryGridProps & {
    portfolioItems: PortfolioItem[];
}) => {
    const resolvedLayout = normalizeGalleryLayout(layout);

    return (
        <GalleryGridContainer layout={resolvedLayout}>
            {portfolioItems.map((item, i) => {
                if (item.item === "media") {
                    return (
                        <MediaGalleryCard
                            key={`${item.item}-${item.id}`}
                            media={item}
                            index={item.index || i}
                            layout={resolvedLayout}
                        />
                    );
                }

                if (item.item === "collection") {
                    return (
                        <CollectionGalleryCard
                            key={`${item.item}-${item.id}`}
                            collection={item}
                            index={item.index || i}
                        />
                    );
                }
            })}
        </GalleryGridContainer>
    );
};

export const GalleryGrid = ({
    media,
    layout,
}: GalleryGridProps & {
    media: GalleryGridMedia[];
}) => {
    const resolvedLayout = normalizeGalleryLayout(layout);

    return (
        <GalleryGridContainer layout={resolvedLayout}>
            {media.map((m, i) => (
                <MediaGalleryCard
                    key={m.id}
                    media={m}
                    index={i}
                    layout={resolvedLayout}
                />
            ))}
        </GalleryGridContainer>
    );
};
