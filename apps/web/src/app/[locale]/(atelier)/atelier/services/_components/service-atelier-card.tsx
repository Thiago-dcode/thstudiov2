"use client";

import { artistServicePath } from "@repo/common-lib/utils/artist-path";
import { useTranslations } from "next-intl";
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
  controls: SortableControls;
};

export function ServiceAtelierCard({ item, username, controls }: Props) {
  const tForm = useTranslations("atelier.services.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="service"
      editHref={`/atelier/services/edit/${item.slug}`}
      viewHref={artistServicePath(username, item.slug)}
      labels={{
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      updateStatus={updateServiceStatusAction}
      controls={controls}
    />
  );
}
