"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { toast } from "@repo/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { setAccountActiveAction } from "@/modules/users/server-actions/set-account-active.action";

type Props = {
  userId: number;
  isActive: boolean;
};

/**
 * Deactivate (confirm first: the profile disappears for everyone) or, when already deactivated,
 * reactivate in one click — making the profile public again needs no warning.
 */
export const AccountVisibilityDialog = ({ userId, isActive }: Props) => {
  const t = useTranslations("atelier.settings.dangerZone.deactivate");
  const router = useRouter();
  const { refresh: refreshMetrics } = useUserMetrics();
  const [open, setOpen] = useState(false);

  const { handleAction, isPending, errors, reset } = useHandleAction({
    action: async () => await setAccountActiveAction(userId, !isActive),
    afterAction: async (result) => {
      if (!result.data) return;
      setOpen(false);
      toast.success(
        result.data.is_active ? t("reactivatedToast") : t("deactivatedToast"),
      );
      // Metrics carry the account status the modal / top-nav label read.
      await refreshMetrics();
      router.refresh();
    },
  });

  if (!isActive) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={isPending}
          onClick={() => handleAction()}
        >
          {isPending ? <Spinner className="size-4" /> : t("reactivate")}
        </Button>
        {errors && errors.length > 0 && <Errors errors={errors} />}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        if (!value) reset();
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-error/50 bg-transparent text-xs text-error hover:bg-error hover:text-error-fg"
        >
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction()}
          >
            {isPending ? <Spinner className="size-4" /> : t("submit")}
          </Button>
        </div>
        {errors && errors.length > 0 && <Errors errors={errors} />}
      </DialogContent>
    </Dialog>
  );
};
