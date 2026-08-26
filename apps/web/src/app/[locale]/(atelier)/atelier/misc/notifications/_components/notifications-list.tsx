"use client";

import type { UserNotification } from "@repo/common-lib/types/user-notification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDateTimeFormat } from "@/lib/hooks/useDateTimeFormat";

export const NotificationsList = ({
  notifications,
}: {
  notifications: UserNotification[];
}) => {
  const t = useTranslations("atelier.notifications");
  const formatDate = useDateTimeFormat();
  const [selected, setSelected] = useState<UserNotification | null>(null);

  return (
    <>
      <div className="flex flex-col border border-fg-2">
        <div className="hidden tablet:grid grid-cols-[1.6fr_0.8fr_0.8fr_auto] gap-4 px-4 py-2.5 bg-fg text-xs uppercase tracking-wide text-text-muted border-b border-fg-2">
          <span>{t("table.type")}</span>
          <span>{t("table.status")}</span>
          <span>{t("table.reference")}</span>
          <span>{t("table.updatedAt")}</span>
        </div>

        {notifications.map((notification) => {
          const unread = !notification.read_at;
          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => setSelected(notification)}
              aria-label={t("openAria", {
                type: t(`types.${notification.type}`),
              })}
              className="grid grid-cols-1 tablet:grid-cols-[1.6fr_0.8fr_0.8fr_auto] gap-1 tablet:gap-4 items-center px-4 py-3 text-left text-sm border-b border-fg-2 last:border-b-0 hover:bg-fg-2 transition-colors"
            >
              <span
                className={cn("truncate", unread ? "font-medium" : "text-text")}
              >
                {t(`types.${notification.type}`)}
              </span>
              <span
                className={cn(
                  "text-xs",
                  unread ? "text-accent" : "text-text-muted",
                )}
              >
                {unread ? t("status.unread") : t("status.read")}
              </span>
              <span className="text-xs text-text-muted truncate">
                {t("referenceValue", { id: String(notification.entity_id) })}
              </span>
              <span className="text-xs text-text-muted tablet:text-right whitespace-nowrap">
                {formatDate(notification.updated_at)}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-xl w-screen">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base pr-6">
                  {t(`types.${selected.type}`)}
                </DialogTitle>
                <DialogDescription>
                  {t("dialog.description", {
                    date: formatDate(selected.updated_at) ?? "",
                  })}
                </DialogDescription>
              </DialogHeader>

              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.status")}
                  </dt>
                  <dd>
                    {selected.read_at
                      ? t("dialog.readAt", {
                          date: formatDate(selected.read_at) ?? "",
                        })
                      : t("status.unread")}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.reference")}
                  </dt>
                  <dd>
                    {t("referenceValue", { id: String(selected.entity_id) })}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wide text-text-muted">
                    {t("dialog.updatedAt")}
                  </dt>
                  <dd>{formatDate(selected.updated_at)}</dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
