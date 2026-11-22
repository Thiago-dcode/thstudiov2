"use client";

import { MAX_HIGHLIGHT_COLLECTIONS } from "@repo/common-lib/constants/highlights";
import { useTranslations } from "next-intl";
import { artistCollectionPath } from "@/lib/public-paths";
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
  highlightLimitReached: boolean;
  controls: SortableControls;
};

export function CollectionAtelierCard({
  item,
  username,
  highlightLimitReached,
  controls,
}: Props) {
  const tForm = useTranslations("atelier.collections.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="collection"
      editHref={`/atelier/collections/edit/${item.slug}`}
      viewHref={artistCollectionPath(username, item.slug)}
      labels={{
        showOnProfile: tForm("showOnProfile"),
        showOnProfileInfo: tForm("showOnProfileInfo", {
          limit: MAX_HIGHLIGHT_COLLECTIONS,
        }),
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      highlightLimitReached={highlightLimitReached}
      updateStatus={updateCollectionStatusAction}
      controls={controls}
    />
  );
}
