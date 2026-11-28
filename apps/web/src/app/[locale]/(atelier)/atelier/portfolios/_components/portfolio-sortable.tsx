"use client";

import { sortPortfoliosAction } from "@/modules/portfolios/server-actions/sort-portfolios.action";
import { AtelierModuleSortable } from "../../../__components/atelier-module-sortable";
import {
  type AtelierPortfolioItem,
  PortfolioAtelierCard,
} from "./portfolio-atelier-card";

export function PortfolioSortable({
  items,
  username,
}: {
  items: AtelierPortfolioItem[];
  username: string;
}) {
  return (
    <AtelierModuleSortable
      items={items}
      sortAction={sortPortfoliosAction}
      renderCard={(item, { controls }) => (
        <PortfolioAtelierCard
          item={item}
          username={username}
          controls={controls}
        />
      )}
    />
  );
}
