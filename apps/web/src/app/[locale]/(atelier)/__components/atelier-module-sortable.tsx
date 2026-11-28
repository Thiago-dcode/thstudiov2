"use client";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { autoOrderIds, MODULE_AUTO_ORDERS } from "./module-auto-order";
import type { AtelierModuleItem } from "./module-status-card";
import { type SortableControls, SortableModule } from "./sortable-module";

export const ATELIER_MODULE_GRID =
  "grid grid-cols-2 laptop:grid-cols-[repeat(auto-fill,20rem)] justify-start gap-4";

const getId = (item: AtelierModuleItem) => item.id;
const getLabel = (item: AtelierModuleItem) => item.title;

type Props<T extends AtelierModuleItem> = {
  items: T[];
  sortAction: (items: SortModuleItem[]) => Promise<ActionReturn<boolean>>;
  renderCard: (item: T, ctx: { controls: SortableControls }) => ReactNode;
};

export function AtelierModuleSortable<T extends AtelierModuleItem>({
  items,
  sortAction,
  renderCard,
}: Props<T>) {
  const t = useTranslations("atelier.common.sortable");
  const pendingRef = useRef<SortModuleItem[]>([]);

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

  const autoOrders = MODULE_AUTO_ORDERS.map((order) => ({
    key: order,
    label: t(`autoOrders.${order}`),
    order: (visible: T[]) => autoOrderIds(visible, order),
  }));

  return (
    <SortableModule
      items={items}
      getId={getId}
      getLabel={getLabel}
      autoOrders={autoOrders}
      isSaving={isPending}
      onSave={(sorted) => {
        pendingRef.current = sorted;
        handleAction().catch(() => toast.error(t("invalidOrder")));
      }}
      className={ATELIER_MODULE_GRID}
      renderItem={(item, controls) => renderCard(item, { controls })}
    />
  );
}
