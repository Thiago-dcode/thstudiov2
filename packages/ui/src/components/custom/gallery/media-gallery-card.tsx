"use client";

import type { PortfolioLayout } from "@repo/common-lib/types/layout";
import {
  aspectRatioToBucket,
  aspectRatioToCss,
} from "@repo/common-lib/utils/aspect-ratio";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import type { GalleryGridMedia } from "./gallery-grid";
import {
  getGalleryImageClassName,
  isSingleColumnLayout,
  normalizeGalleryLayout,
  usesAspectRatioBuckets,
} from "./gallery-layout";
import { MediaGalleryCardContent } from "./media-gallery-card-content";

export function MediaGalleryCard({
  media,
  index,
  layout,
}: {
  media: GalleryGridMedia;
  index: number;
  layout?: PortfolioLayout;
}) {
  const { items, labels, setCurrentItem } = useGallery();
  const resolvedLayout = normalizeGalleryLayout(layout);
  const mediaClassName = getGalleryImageClassName(resolvedLayout);
  // A single-column COLUMN_BASE reads like a stacked list: size the cell off
  // the media's own ratio instead of the layout's default square crop.
  const singleColumn = isSingleColumnLayout(resolvedLayout);
  const href = items[index]?.href;

  const className =
    "cursor-pointer media-gallery-card group relative block w-full overflow-hidden transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20";
  const style = singleColumn
    ? { aspectRatio: aspectRatioToCss(media.aspect_ratio) }
    : undefined;
  const dataRatio = usesAspectRatioBuckets(resolvedLayout)
    ? aspectRatioToBucket(media.aspect_ratio)
    : undefined;

  const content = (
    <MediaGalleryCardContent
      media={media}
      index={index}
      mediaClassName={mediaClassName}
    />
  );

  // Progressive enhancement. These tiles were `<button onClick>`, so the media detail pages —
  // which carry the richest structured data in the app — had no crawlable inbound link anywhere:
  // the only route in was a JS lightbox. Rendering a real anchor gives crawlers and no-JS users
  // the href while `preventDefault` keeps the lightbox for everyone else. Falls back to a button
  // where the gallery has no per-item href (e.g. the landing page's featured portfolio).
  if (!href) {
    return (
      <button
        type="button"
        onClick={() => setCurrentItem(index)}
        className={className}
        style={style}
        data-single-column={singleColumn || undefined}
        data-ratio={dataRatio}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={href}
      aria-label={labels.openAria}
      onClick={(e) => {
        // Let modified clicks (new tab/window) and non-primary buttons behave like a normal link.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        setCurrentItem(index);
      }}
      className={className}
      style={style}
      data-single-column={singleColumn || undefined}
      data-ratio={dataRatio}
    >
      {content}
    </a>
  );
}
