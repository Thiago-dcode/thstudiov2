"use client";

import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import { sortServicesAction } from "@/modules/services/server-actions/sort-services.action";
import { AtelierModuleSortable } from "../../../__components/atelier-module-sortable";
import {
  type AtelierServiceItem,
  ServiceAtelierCard,
} from "./service-atelier-card";

export function ServiceSortable({
  items,
  username,
}: {
  items: AtelierServiceItem[];
  username: string;
}) {
  return (
    <AtelierModuleSortable
      items={items}
      sortAction={sortServicesAction}
      highlightLimit={MAX_HIGHLIGHT_SERVICES}
      renderCard={(item, { controls, highlightLimitReached }) => (
        <ServiceAtelierCard
          item={item}
          username={username}
          highlightLimitReached={highlightLimitReached}
          controls={controls}
        />
      )}
    />
  );
}
