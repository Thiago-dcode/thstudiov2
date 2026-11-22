"use client";

import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
import { useTranslations } from "next-intl";
import { artistPortfolioPath } from "@/lib/public-paths";
import { updatePortfolioStatusAction } from "@/modules/portfolios/server-actions/update-portfolio-status.action";
import {
  type AtelierModuleItem,
  ModuleStatusCard,
} from "../../../__components/module-status-card";
import type { SortableControls } from "../../../__components/sortable-module";

/** `media` is pre-rendered on the server so `PortfolioCard` stays out of the client bundle. */
export type AtelierPortfolioItem = AtelierModuleItem & { slug: string };

type Props = {
  item: AtelierPortfolioItem;
  username: string;
  highlightLimitReached: boolean;
  controls: SortableControls;
};

export function PortfolioAtelierCard({
  item,
  username,
  highlightLimitReached,
  controls,
}: Props) {
  const tForm = useTranslations("atelier.portfolios.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="portfolio"
      editHref={`/atelier/portfolios/edit/${item.slug}`}
      viewHref={artistPortfolioPath(username, item.slug)}
      labels={{
        showOnProfile: tForm("showOnProfile"),
        showOnProfileInfo: tForm("showOnProfileInfo", {
          limit: MAX_HIGHLIGHT_PORTFOLIOS,
        }),
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      highlightLimitReached={highlightLimitReached}
      updateStatus={updatePortfolioStatusAction}
      controls={controls}
    />
  );
}
