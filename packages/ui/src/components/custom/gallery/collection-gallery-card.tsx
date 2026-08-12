"use client";

import { Collection } from "@repo/common-lib/types/collection";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import { CollectionStackCard } from "../collections/collection-card";

export function CollectionGalleryCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const { items, labels, setCurrentItem } = useGallery();
  const href = items[index]?.href;

  const className =
    "cursor-pointer media-gallery-card group relative block h-full w-full overflow-hidden p-0! transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20";
  const content = (
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
    >
      {content}
    </a>
  );
}
