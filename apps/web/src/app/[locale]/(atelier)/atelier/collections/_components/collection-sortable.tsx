"use client";

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
      renderCard={(item, { controls }) => (
        <CollectionAtelierCard
          item={item}
          username={username}
          controls={controls}
        />
      )}
    />
  );
}
