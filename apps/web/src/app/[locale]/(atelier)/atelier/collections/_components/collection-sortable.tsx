"use client";

import { MAX_HIGHLIGHT_COLLECTIONS } from "@repo/common-lib/constants/highlights";
import { sortCollectionsAction } from "@/modules/collections/server-actions/sort-collections.action";
import { AtelierModuleSortable } from "../../../__components/atelier-module-sortable";
import {
  type AtelierCollectionItem,
  CollectionAtelierCard,
} from "./collection-atelier-card";

export function CollectionSortable({
  items,
  username,
}: {
  items: AtelierCollectionItem[];
  username: string;
}) {
  return (
    <AtelierModuleSortable
      items={items}
      sortAction={sortCollectionsAction}
      highlightLimit={MAX_HIGHLIGHT_COLLECTIONS}
      renderCard={(item, { controls, highlightLimitReached }) => (
        <CollectionAtelierCard
          item={item}
          username={username}
          highlightLimitReached={highlightLimitReached}
          controls={controls}
        />
      )}
    />
  );
}
