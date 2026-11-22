"use client";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import type { AtelierModuleItem } from "./module-status-card";
import { type SortableControls, SortableModule } from "./sortable-module";

export const ATELIER_MODULE_GRID =
  "grid grid-cols-2 laptop:grid-cols-[repeat(auto-fill,20rem)] justify-start gap-4";

const getId = (item: AtelierModuleItem) => item.id;
const getLabel = (item: AtelierModuleItem) => item.title;

type Props<T extends AtelierModuleItem> = {
  items: T[];
  sortAction: (items: SortModuleItem[]) => Promise<ActionReturn<boolean>>;
  highlightLimit: number;
  renderCard: (
    item: T,
    ctx: { controls: SortableControls; highlightLimitReached: boolean },
  ) => ReactNode;
};

export function AtelierModuleSortable<T extends AtelierModuleItem>({
  items,
  sortAction,
  highlightLimit,
  renderCard,
}: Props<T>) {
  const t = useTranslations("atelier.common.sortable");
  const pendingRef = useRef<SortModuleItem[]>([]);

  // From the server values; the API stays the source of truth for races.
  const highlightLimitReached =
    items.filter((item) => item.is_highlight).length >= highlightLimit;

  const { handleAction, isPending } = useHandleAction({
    action: () => sortAction(pendingRef.current),
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
      className={ATELIER_MODULE_GRID}
      renderItem={(item, controls) =>
        renderCard(item, { controls, highlightLimitReached })
      }
    />
  );
}
