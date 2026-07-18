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
  const { setCurrentItem } = useGallery();

  return (
    <button
      onClick={() => setCurrentItem(index)}
      className="cursor-pointer media-gallery-card group relative h-full w-full overflow-hidden p-0! transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20"
      data-ratio="square"
    >
      <CollectionStackCard className="h-full w-full" collection={collection} />
    </button>
  );
}
