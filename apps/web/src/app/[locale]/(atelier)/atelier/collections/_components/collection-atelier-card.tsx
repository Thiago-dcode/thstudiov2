"use client";

import { artistCollectionPath } from "@repo/common-lib/utils/artist-path";
import { useTranslations } from "next-intl";
import { updateCollectionStatusAction } from "@/modules/collections/server-actions/update-collection-status.action";
import {
  type AtelierModuleItem,
  ModuleStatusCard,
} from "../../../__components/module-status-card";
import type { SortableControls } from "../../../__components/sortable-module";

/** `media` is pre-rendered on the server so `CollectionCover` stays out of the client bundle. */
export type AtelierCollectionItem = AtelierModuleItem & { slug: string };

type Props = {
  item: AtelierCollectionItem;
  username: string;
  controls: SortableControls;
};

export function CollectionAtelierCard({ item, username, controls }: Props) {
  const tForm = useTranslations("atelier.collections.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="collection"
      editHref={`/atelier/collections/edit/${item.slug}`}
      viewHref={artistCollectionPath(username, item.slug)}
      labels={{
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      updateStatus={updateCollectionStatusAction}
      controls={controls}
    />
  );
}
