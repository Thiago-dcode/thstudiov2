"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight, Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserNotifications } from "../contexts/user-notifications.provider";
import { markUserNotificationsAsReadAction } from "../server-actions/user-notifications.action";
import { UserNotificationCard } from "./user-notification-card";

export const UserNotificationsDrawer = () => {
  const t = useTranslations("atelier.topNav");
  const {
    notifications,
    hasPendingToRead,
    updateUserNotifications,
    subscribeToUserNotification,
    unsubscribeToUserNotification,
  } = useUserNotifications();
  const [open, setOpen] = useState(false);
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);
  const closeDrawer = useCallback(() => setOpen(false), []);

  // Only what is on screen. A notification that arrives between opening this dialog and
  // confirming it is not in this list, so it stays unread — which is the honest outcome.
  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.read_at).map((n) => n.id),
    [notifications],
  );

  const { handleAction, isPending, errors, cleanErrors } = useHandleAction({
    action: () => markUserNotificationsAsReadAction(unreadIds),
    afterAction: async ({ data }) => {
      if (!data) return;
      updateUserNotifications(data);
      setShowMarkAllDialog(false);
    },
    beforeAction: async () => {
      cleanErrors();
    },
  });

  useEffect(() => {
    const callbackId = "user-notifications-drawer";
    subscribeToUserNotification(callbackId, (notification) => {
      if (!notification.read_at) {
        setOpen(true);
      }
    });
    return () => {
      unsubscribeToUserNotification(callbackId);
    };
  }, [subscribeToUserNotification, unsubscribeToUserNotification]);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        // The confirm dialog is a sibling of the drawer content, so it would otherwise be left
        // floating over the page after the drawer behind it closes.
        if (!next) setShowMarkAllDialog(false);
        setOpen(next);
      }}
      direction="left"
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          className="relative p-1.5 text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
          aria-label={
            unreadIds.length
              ? t("notificationsUnreadAria", { count: unreadIds.length })
              : t("notificationsAria")
          }
        >
          <Bell size={18} />
          {hasPendingToRead && (
            <span
              className="absolute top-1 right-1 size-2 bg-accent"
              aria-hidden
            />
          )}
        </button>
      </DrawerTrigger>

      <DrawerContent className="h-full w-96 max-w-[90vw] left-0 right-auto flex flex-col mt-0">
        <DrawerHeader className="border-b border-border px-4 py-3 text-left shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <DrawerTitle className="text-base! font-semibold truncate">
                {t("notificationsTitle")}
              </DrawerTitle>
              {unreadIds.length > 0 && (
                <span className="shrink-0 bg-accent px-1.5 py-0.5 text-[11px] font-medium leading-none text-accent-fg tabular-nums">
                  {unreadIds.length}
                </span>
              )}
            </div>
            {unreadIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto shrink-0 px-2 py-1 text-xs! font-normal"
                onClick={() => setShowMarkAllDialog(true)}
              >
                <CheckCheck className="size-3.5" aria-hidden />
                {t("notificationsMarkAllRead")}
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {notifications.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span
                className="flex size-12 items-center justify-center border border-border bg-fg text-text-muted"
                aria-hidden
              >
                <BellOff className="size-5" />
              </span>
              <p className="text-sm text-text">{t("notificationsEmpty")}</p>
              <p className="text-xs text-text-muted leading-relaxed">
                {t("notificationsEmptyHint")}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <UserNotificationCard
                key={notification.id}
                userNotification={notification}
                onNavigate={closeDrawer}
              />
            ))
          )}
        </div>

        <DrawerFooter className="border-t border-border px-3 py-2 shrink-0">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-between text-sm!"
          >
            <Link href="/atelier/misc/notifications" onClick={closeDrawer}>
              {t("notificationsViewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>

      <Dialog
        open={showMarkAllDialog}
        onOpenChange={(next) => {
          if (isPending) return;
          if (!next) cleanErrors();
          setShowMarkAllDialog(next);
        }}
      >
        <DialogContent className="max-w-md z-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base pr-6">
              <CheckCheck
                className="size-4 shrink-0 text-text-muted"
                aria-hidden
              />
              {t("notificationsMarkAllReadTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("notificationsMarkAllReadBody", { count: unreadIds.length })}
            </DialogDescription>
          </DialogHeader>

          {errors?.length ? (
            <p className="border-l-2 border-error bg-error/5 px-3 py-2 text-sm! text-error">
              {errors[0]}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              variant="base"
              disabled={isPending}
              onClick={() => setShowMarkAllDialog(false)}
            >
              {t("notificationsMarkAllReadCancel")}
            </Button>
            <Button
              variant="default"
              disabled={isPending}
              onClick={() => void handleAction()}
              className={cn(isPending && "opacity-70")}
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {t("notificationsMarkAllReadConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
};
