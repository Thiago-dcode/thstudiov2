"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { ArrowRight, Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useUserNotifications } from "../contexts/user-notifications.provider";
import { UserNotificationCard } from "./user-notification-card";

export const UserNotificationsDrawer = () => {
  const t = useTranslations("atelier.topNav");
  const { notifications, hasPendingToRead } = useUserNotifications();
  const [open, setOpen] = useState(false);
  // The drawer is client-side state, so anything that navigates has to close it first - otherwise
  // it stays open on top of the destination page.
  const closeDrawer = useCallback(() => setOpen(false), []);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="left">
      <DrawerTrigger asChild>
        <button
          type="button"
          className="relative p-1.5 text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
          aria-label={t("notificationsAria")}
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
      <DrawerContent className="h-full w-90 max-w-[90vw] left-0 right-auto flex flex-col mt-0">
        <DrawerHeader className="border-b border-fg-2 px-4 py-3 text-left">
          <DrawerTitle className="text-base font-semibold">
            {t("notificationsTitle")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-text-muted">{t("notificationsEmpty")}</p>
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
        <DrawerFooter className="border-t border-fg-2 px-4 py-3">
          <Button asChild variant="ghost" className="w-full justify-between">
            <Link href="/atelier/misc/notifications" onClick={closeDrawer}>
              {t("notificationsViewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
