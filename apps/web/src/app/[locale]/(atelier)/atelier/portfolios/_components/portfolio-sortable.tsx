"use client";

import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
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
      highlightLimit={MAX_HIGHLIGHT_PORTFOLIOS}
      renderCard={(item, { controls, highlightLimitReached }) => (
        <PortfolioAtelierCard
          item={item}
          username={username}
          highlightLimitReached={highlightLimitReached}
          controls={controls}
        />
      )}
    />
  );
}
