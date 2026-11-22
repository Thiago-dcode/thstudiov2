"use client";

import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import { useTranslations } from "next-intl";
import { artistServicePath } from "@/lib/public-paths";
import { updateServiceStatusAction } from "@/modules/services/server-actions/update-service-status.action";
import {
  type AtelierModuleItem,
  ModuleStatusCard,
} from "../../../__components/module-status-card";
import type { SortableControls } from "../../../__components/sortable-module";

/** `media` is pre-rendered on the server so `ServiceCover` stays out of the client bundle. */
export type AtelierServiceItem = AtelierModuleItem & { slug: string };

type Props = {
  item: AtelierServiceItem;
  username: string;
  highlightLimitReached: boolean;
  controls: SortableControls;
};

export function ServiceAtelierCard({
  item,
  username,
  highlightLimitReached,
  controls,
}: Props) {
  const tForm = useTranslations("atelier.services.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="service"
      editHref={`/atelier/services/edit/${item.slug}`}
      viewHref={artistServicePath(username, item.slug)}
      labels={{
        showOnProfile: tForm("showOnProfile"),
        showOnProfileInfo: tForm("showOnProfileInfo", {
          limit: MAX_HIGHLIGHT_SERVICES,
        }),
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      highlightLimitReached={highlightLimitReached}
      updateStatus={updateServiceStatusAction}
      controls={controls}
    />
  );
}
