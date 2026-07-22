"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action";
import { useUserMetrics } from "../providers/user-metrics.provider";

export const UserAccountBannedModal = () => {
  const t = useTranslations("userAccountBanned");
  const [mounted, setMounted] = useState(false);
  const { isUserAccountBanned, metrics } = useUserMetrics();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isUserAccountBanned) return null;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const result = await logoutServerAction();
    if (result) {
      router.push("/auth/login");
    }
    setLoggingOut(false);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xs [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <ShieldAlert className="h-6 w-6 text-error" />
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="text-xs">
            {t("description")}
            {metrics?.extra_data?.ban_lift && (
              <>
                {" "}
                {t("restrictionsLiftedOn", {
                  date: new Date(
                    metrics.extra_data.ban_lift,
                  ).toLocaleDateString(undefined, { dateStyle: "medium" }),
                })}
              </>
            )}{" "}
            <a
              href="mailto:support@a11studio.com"
              className="underline text-text"
            >
              {t("contactSupport")}
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full justify-end">
          <Button
            variant="ghost"
            size="sm"
            className=" self-end text-text-muted border"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? <Spinner className="size-4" /> : t("logout")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
