"use client";

import { useGallery } from "@repo/ui/providers/gallery.provider";

import { Collection } from "@repo/common-lib/types/collection";
import { CollectionStackCard } from "../collections/collection-card";
export function CollectionGalleryCard({
    collection,
    index,
}: {
    collection: Collection;
    index: number;
    gridStyle?: string;
}) {
    const { setCurrentItem } = useGallery();


    return (
        <button
            onClick={() => setCurrentItem(index)}
            className="cursor-pointer media-gallery-card group relative h-full w-full overflow-hidden rounded-none p-0! transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20"
            data-shape={'square'}
        >
            <CollectionStackCard className="h-full w-full" collection={collection} />
        </button>
    );
}
