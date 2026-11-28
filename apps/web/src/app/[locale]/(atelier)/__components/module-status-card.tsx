"use client";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { isHiddenFromPublic } from "@repo/common-lib/utils/public-entity";
import { toast } from "@repo/ui/sonner";
import { Eye, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { ModuleCard } from "./module-card";
import type { SortableControls } from "./sortable-module";

export type AtelierModuleItem = {
  id: number;
  title: string;
  is_active: boolean;
  is_blocked: boolean;
  /** For the list's "Auto-order" helper. ISO strings over the wire. */
  created_at: Date | string;
  updated_at: Date | string;
  /** Pre-rendered on the server so the module's card/cover stays out of the client bundle. */
  media: ReactNode;
};

/** The card only toggles `is_active`; `is_highlight` is not editable from the web. */
type CardStatusInput = Pick<ModuleStatusInput, "is_active">;

type Props = {
  item: AtelierModuleItem;
  /** DOM ids are `${idPrefix}-${item.id}-active|note`. */
  idPrefix: string;
  editHref: string;
  viewHref: string;
  labels: {
    active: string;
    activeInfo?: string;
  };
  updateStatus: (
    id: number,
    input: ModuleStatusInput,
  ) => Promise<ActionReturn<ModuleStatus>>;
  controls: SortableControls;
};

export function ModuleStatusCard({
  item,
  idPrefix,
  editHref,
  viewHref,
  labels,
  updateStatus,
  controls,
}: Props) {
  const t = useTranslations("atelier.common.moduleCard");

  const [optimistic, setOptimistic] = useState<CardStatusInput>({});
  const pendingRef = useRef<CardStatusInput>({});

  // Adjust state while rendering: once the refreshed item matches, the optimistic value is spent.
  const optimisticKeys = Object.keys(optimistic) as (keyof CardStatusInput)[];
  if (
    optimisticKeys.length > 0 &&
    optimisticKeys.every((key) => optimistic[key] === item[key])
  ) {
    setOptimistic({});
  }

  const { handleAction, isPending } = useHandleAction({
    action: () => updateStatus(item.id, pendingRef.current),
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) toast.error(error);
        setOptimistic({});
      }
    },
  });

  const displayed = {
    is_active: optimistic.is_active ?? item.is_active,
  };

  const toggle = (patch: CardStatusInput) => {
    pendingRef.current = patch;
    setOptimistic((prev) => ({ ...prev, ...patch }));
    // A thrown action never reaches `afterAction`: roll back here.
    handleAction().catch(() => {
      setOptimistic({});
      toast.error(t("invalidStatus"));
    });
  };

  const isHidden = isHiddenFromPublic({
    is_active: displayed.is_active,
    blocked_at: item.is_blocked ? new Date(0) : null,
  });
  const noteId = `${idPrefix}-${item.id}-note`;
  const reason = item.is_blocked
    ? t("hiddenBlocked")
    : isHidden
      ? t("hiddenInactive")
      : null;

  return (
    <ModuleCard
      href={editHref}
      title={item.title}
      media={item.media}
      dragHandle={controls.dragHandle}
      className={controls.isDragging ? "pointer-events-none" : undefined}
      badges={
        !displayed.is_active ? (
          <ModuleCard.Badge>{t("badgeNotPublic")}</ModuleCard.Badge>
        ) : null
      }
      toggles={
        <ModuleCard.Toggle
          id={`${idPrefix}-${item.id}-active`}
          label={labels.active}
          checked={displayed.is_active}
          disabled={isPending || item.is_blocked}
          pending={isPending}
          info={labels.activeInfo ? <p>{labels.activeInfo}</p> : undefined}
          onCheckedChange={(checked) => toggle({ is_active: checked })}
        />
      }
      actions={
        <>
          <ModuleCard.Action
            href={editHref}
            icon={<Pencil aria-hidden="true" />}
            aria-label={t("editLabel", { title: item.title })}
          >
            {t("edit")}
          </ModuleCard.Action>
          <ModuleCard.Action
            href={viewHref}
            external
            disabled={isHidden}
            icon={<Eye aria-hidden="true" />}
            aria-label={t("viewLabel", { title: item.title })}
            aria-describedby={isHidden ? noteId : undefined}
          >
            {t("view")}
          </ModuleCard.Action>
        </>
      }
      note={
        reason ? (
          <p id={noteId} className="text-xs text-text-muted">
            {reason}
          </p>
        ) : null
      }
    />
  );
}
