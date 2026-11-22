"use client";

import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
import type { ModuleStatusInput } from "@repo/common-lib/types/module-status";
import { isHiddenFromPublic } from "@repo/common-lib/utils/public-entity";
import { toast } from "@repo/ui/sonner";
import { Eye, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { artistPortfolioPath } from "@/lib/public-paths";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updatePortfolioStatusAction } from "@/modules/portfolios/server-actions/update-portfolio-status.action";
import { ModuleCard } from "../../../__components/module-card";
import type { SortableControls } from "../../../__components/sortable-module";

export type AtelierPortfolioItem = {
  id: number;
  slug: string;
  title: string;
  is_highlight: boolean;
  is_active: boolean;
  is_blocked: boolean;
  /** Pre-rendered on the server so `PortfolioCard` stays out of the client bundle. */
  media: ReactNode;
};

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
  const t = useTranslations("atelier.common.moduleCard");
  const tForm = useTranslations("atelier.portfolios.form");

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
    action: () => updatePortfolioStatusAction(item.id, pendingRef.current),
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
    void handleAction();
  };

  const isHidden = isHiddenFromPublic({
    is_active: displayed.is_active,
    blocked_at: item.is_blocked ? new Date(0) : null,
  });
  const noteId = `portfolio-${item.id}-note`;
  const reason = item.is_blocked
    ? t("hiddenBlocked")
    : isHidden
      ? t("hiddenInactive")
      : null;

  const highlightBlockedByLimit =
    highlightLimitReached && !displayed.is_highlight;

  return (
    <ModuleCard
      href={`/atelier/portfolios/edit/${item.slug}`}
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
            id={`portfolio-${item.id}-highlight`}
            label={tForm("showOnProfile")}
            checked={displayed.is_highlight}
            disabled={isPending || item.is_blocked || highlightBlockedByLimit}
            pending={isPending}
            info={
              <p>
                {tForm("showOnProfileInfo", {
                  limit: MAX_HIGHLIGHT_PORTFOLIOS,
                })}
              </p>
            }
            onCheckedChange={(checked) => toggle({ is_highlight: checked })}
          />
          <ModuleCard.Toggle
            id={`portfolio-${item.id}-active`}
            label={tForm("active")}
            checked={displayed.is_active}
            disabled={isPending || item.is_blocked}
            pending={isPending}
            info={<p>{tForm("activeInfo")}</p>}
            onCheckedChange={(checked) => toggle({ is_active: checked })}
          />
        </>
      }
      actions={
        <>
          <ModuleCard.Action
            href={`/atelier/portfolios/edit/${item.slug}`}
            icon={<Pencil aria-hidden="true" />}
            aria-label={t("editLabel", { title: item.title })}
          >
            {t("edit")}
          </ModuleCard.Action>
          <ModuleCard.Action
            href={artistPortfolioPath(username, item.slug)}
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
