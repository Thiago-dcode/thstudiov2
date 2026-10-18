"use client";

import { Collection } from "@repo/common-lib/types/collection";
import type { PortfolioLayout } from "@repo/common-lib/types/layout";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import { CollectionStackCard } from "../collections/collection-card";
import { GalleryItemTitle } from "./gallery-item-title";
import { normalizeGalleryLayout, showsItemTitles } from "./gallery-layout";

export function CollectionGalleryCard({
  collection,
  index,
  layout,
}: {
  collection: Collection;
  index: number;
  layout?: PortfolioLayout;
}) {
  const { items, labels, setCurrentItem } = useGallery();
  const href = items[index]?.href;
  const showTitle = showsItemTitles(normalizeGalleryLayout(layout));

  const className =
    "cursor-pointer media-gallery-card group relative block h-full w-full overflow-hidden p-0! transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20";
  // With captions on, the title moves above the stack (like media tiles), so the stack drops its
  // own hover title instead of showing it twice.
  const content = showTitle ? (
    <>
      <GalleryItemTitle title={collection.title ?? ""} />
      <div className="aspect-square w-full">
        <CollectionStackCard
          className="h-full w-full"
          collection={collection}
          hideHoverTitle
        />
      </div>
    </>
  ) : (
    <CollectionStackCard className="h-full w-full" collection={collection} />
  );

  // See MediaGalleryCard: a real anchor so the target page has a crawlable inbound link, with the
  // lightbox preserved by intercepting plain left-clicks.
  if (!href) {
    return (
      <button
        type="button"
        onClick={() => setCurrentItem(index)}
        className={className}
        data-ratio="square"
        data-show-title={showTitle || undefined}
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
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        setCurrentItem(index);
      }}
      className={className}
      data-ratio="square"
      data-show-title={showTitle || undefined}
    >
      {content}
    </a>
  );
}
