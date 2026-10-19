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
import { cn } from "../../../lib/utils";

export type GalleryGridMedia = Pick<
    MediaPortfolio,
    "id" | "thumbnail" | "video_preview" | "title" | "seo_alt" | "aspect_ratio" | "media_type"
>;

type GalleryGridProps = {
    layout?: PortfolioLayout;
};

// The first tiles of a gallery page are its LCP candidates, so they skip lazy loading and are
// preloaded. A grid further down a page (the landing's featured portfolio) passes 0 instead:
// preloading it there pulled bandwidth away from the hero above the fold.
const DEFAULT_PRIORITY_COUNT = 5;

type PriorityProps = {
    /** How many leading tiles load with priority. Pass 0 when the grid starts below the fold. */
    priorityCount?: number;
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
        <div className={cn(gridClassName)} style={containerStyle}>
          {children}
        </div>
      </div>
    );
  }

    return (
        <div className={cn(gridClassName)} style={containerStyle}>
            {children}
        </div>
    );
};

export const PortfolioGrid = ({
    portfolioItems,
    layout,
    priorityCount = DEFAULT_PRIORITY_COUNT,
}: GalleryGridProps & PriorityProps & {
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
                            priority={i < priorityCount}
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
                            layout={resolvedLayout}
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
    priorityCount = DEFAULT_PRIORITY_COUNT,
}: GalleryGridProps & PriorityProps & {
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
                    priority={i < priorityCount}
                    layout={resolvedLayout}
                />
            ))}
        </GalleryGridContainer>
    );
};
