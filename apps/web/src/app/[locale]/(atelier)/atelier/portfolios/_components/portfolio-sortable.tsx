"use client";

import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { sortPortfoliosAction } from "@/modules/portfolios/server-actions/sort-portfolios.action";
import { SortableModule } from "../../../__components/sortable-module";
import {
  type AtelierPortfolioItem,
  PortfolioAtelierCard,
} from "./portfolio-atelier-card";

const getId = (item: AtelierPortfolioItem) => item.id;
const getLabel = (item: AtelierPortfolioItem) => item.title;

export function PortfolioSortable({
  items,
  username,
}: {
  items: AtelierPortfolioItem[];
  username: string;
}) {
  const t = useTranslations("atelier.common.sortable");
  const pendingRef = useRef<SortModuleItem[]>([]);

  // From the server values; the API stays the source of truth for races.
  const highlightLimitReached =
    items.filter((item) => item.is_highlight).length >=
    MAX_HIGHLIGHT_PORTFOLIOS;

  const { handleAction, isPending } = useHandleAction({
    action: () => sortPortfoliosAction(pendingRef.current),
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) toast.error(error);
        return;
      }
      toast.success(t("savedToast"));
    },
  });

  return (
    <SortableModule
      items={items}
      getId={getId}
      getLabel={getLabel}
      isSaving={isPending}
      onSave={(sorted) => {
        pendingRef.current = sorted;
        void handleAction();
      }}
      className="grid grid-cols-2 laptop:grid-cols-[repeat(auto-fill,20rem)] justify-start gap-4"
      renderItem={(item, controls) => (
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
