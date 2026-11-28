"use client";

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
      renderCard={(item, { controls }) => (
        <ServiceAtelierCard
          item={item}
          username={username}
          controls={controls}
        />
      )}
    />
  );
}
