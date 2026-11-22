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
  is_highlight: boolean;
  is_active: boolean;
  is_blocked: boolean;
  /** Pre-rendered on the server so the module's card/cover stays out of the client bundle. */
  media: ReactNode;
};

type Props = {
  item: AtelierModuleItem;
  /** DOM ids are `${idPrefix}-${item.id}-highlight|active|note`. */
  idPrefix: string;
  editHref: string;
  viewHref: string;
  labels: {
    showOnProfile: string;
    showOnProfileInfo?: string;
    active: string;
    activeInfo?: string;
  };
  highlightLimitReached: boolean;
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
  highlightLimitReached,
  updateStatus,
  controls,
}: Props) {
  const t = useTranslations("atelier.common.moduleCard");

  const [optimistic, setOptimistic] = useState<ModuleStatusInput>({});
  const pendingRef = useRef<ModuleStatusInput>({});

  // Adjust state while rendering: once the refreshed item matches, the optimistic value is spent.
  const optimisticKeys = Object.keys(optimistic) as (keyof ModuleStatusInput)[];
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
    is_highlight: optimistic.is_highlight ?? item.is_highlight,
    is_active: optimistic.is_active ?? item.is_active,
  };

  const toggle = (patch: ModuleStatusInput) => {
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

  const highlightBlockedByLimit =
    highlightLimitReached && !displayed.is_highlight;

  return (
    <ModuleCard
      href={editHref}
      title={item.title}
      media={item.media}
      dragHandle={controls.dragHandle}
      className={controls.isDragging ? "pointer-events-none" : undefined}
      badges={
        <>
          {displayed.is_highlight ? (
            <ModuleCard.Badge>{t("badgeOnProfile")}</ModuleCard.Badge>
          ) : null}
          {!displayed.is_active ? (
            <ModuleCard.Badge>{t("badgeNotPublic")}</ModuleCard.Badge>
          ) : null}
        </>
      }
      toggles={
        <>
          <ModuleCard.Toggle
            id={`${idPrefix}-${item.id}-highlight`}
            label={labels.showOnProfile}
            checked={displayed.is_highlight}
            disabled={isPending || item.is_blocked || highlightBlockedByLimit}
            pending={isPending}
            info={
              labels.showOnProfileInfo ? (
                <p>{labels.showOnProfileInfo}</p>
              ) : undefined
            }
            onCheckedChange={(checked) => toggle({ is_highlight: checked })}
          />
          <ModuleCard.Toggle
            id={`${idPrefix}-${item.id}-active`}
            label={labels.active}
            checked={displayed.is_active}
            disabled={isPending || item.is_blocked}
            pending={isPending}
            info={labels.activeInfo ? <p>{labels.activeInfo}</p> : undefined}
            onCheckedChange={(checked) => toggle({ is_active: checked })}
          />
        </>
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
