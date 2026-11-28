"use client";

import { artistPortfolioPath } from "@repo/common-lib/utils/artist-path";
import { useTranslations } from "next-intl";
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
  controls: SortableControls;
};

export function PortfolioAtelierCard({ item, username, controls }: Props) {
  const tForm = useTranslations("atelier.portfolios.form");

  return (
    <ModuleStatusCard
      item={item}
      idPrefix="portfolio"
      editHref={`/atelier/portfolios/edit/${item.slug}`}
      viewHref={artistPortfolioPath(username, item.slug)}
      labels={{
        active: tForm("active"),
        activeInfo: tForm("activeInfo"),
      }}
      updateStatus={updatePortfolioStatusAction}
      controls={controls}
    />
  );
}
