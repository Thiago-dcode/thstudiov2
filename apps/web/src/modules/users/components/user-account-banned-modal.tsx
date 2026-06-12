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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action";
import { useUserMetrics } from "../providers/user-metrics.provider";

export const UserAccountBannedModal = () => {
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
          <DialogTitle>Account Suspended</DialogTitle>
          <DialogDescription className="text-xs">
            Your account has been suspended due to policy violations.
            {metrics?.extra_data?.ban_lift && (
              <>
                {" "}
                Restrictions will be lifted on{" "}
                <span className="font-medium text-text">
                  {new Date(metrics.extra_data.ban_lift).toLocaleDateString(
                    undefined,
                    { dateStyle: "medium" },
                  )}
                </span>
                .
              </>
            )}{" "}
            <a
              href="mailto:support@thstudio.com"
              className="underline text-text"
            >
              Contact support if you think this is a mistake
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
            {loggingOut ? <Spinner className="size-4" /> : "Logout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
