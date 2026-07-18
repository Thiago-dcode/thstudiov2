"use client";

import type { PortfolioLayout } from "@repo/common-lib/types/layout";
import {
  aspectRatioToBucket,
  aspectRatioToCss,
} from "@repo/common-lib/utils/aspect-ratio";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import Image from "next/image";
import type { GalleryGridMedia } from "./gallery-grid";
import {
  getGalleryImageClassName,
  isSingleColumnLayout,
  normalizeGalleryLayout,
  usesAspectRatioBuckets,
} from "./gallery-layout";

export function MediaGalleryCard({
  media,
  index,
  layout,
}: {
  media: GalleryGridMedia;
  index: number;
  layout?: PortfolioLayout;
}) {
  const { setCurrentItem } = useGallery();
  const resolvedLayout = normalizeGalleryLayout(layout);
  const imageClassName = getGalleryImageClassName(resolvedLayout);
  // A single-column COLUMN_BASE reads like a stacked list: size the cell off
  // the media's own ratio instead of the layout's default square crop.
  const singleColumn = isSingleColumnLayout(resolvedLayout);

  return (
    <button
      onClick={() => setCurrentItem(index)}
      className="cursor-pointer media-gallery-card group relative w-full overflow-hidden transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20"
      style={
        singleColumn
          ? { aspectRatio: aspectRatioToCss(media.aspect_ratio) }
          : undefined
      }
      data-single-column={singleColumn || undefined}
      data-ratio={
        usesAspectRatioBuckets(resolvedLayout)
          ? aspectRatioToBucket(media.aspect_ratio)
          : undefined
      }
    >
      {media.thumbnail ? (
        <div className="media-gallery-card__frame relative overflow-hidden w-full h-full">
          <Image
            preload={index < 5}
            unoptimized
            src={media.thumbnail}
            alt={media.seo_alt || media.title || ""}
            width={800}
            height={1000}
            className={imageClassName}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </div>
      ) : (
        <div className="media-gallery-card__frame media-gallery-card__placeholder w-full h-full aspect-square flex items-center justify-center bg-fg text-xs text-text-muted ">
          void
        </div>
      )}
    </button>
  );
}
