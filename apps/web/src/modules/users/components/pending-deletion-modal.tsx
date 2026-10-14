"use client";

import { accountDeletionDate } from "@repo/common-lib/utils/account-deletion";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { toast } from "@repo/ui/sonner";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action";
import { cancelAccountDeletionAction } from "../server-actions/cancel-account-deletion.action";

type Props = {
  userId: number;
  /** ISO string / Date of the deletion request; the modal renders only when set. */
  deletionRequestedAt: string | Date | null | undefined;
};

/**
 * Blocks the atelier while the account is pending deletion: there is nothing to edit on an account
 * that is about to disappear, so the only choices are to reopen it or to leave. Same shape as
 * `UserAccountBannedModal` (cannot be dismissed).
 */
export const PendingDeletionModal = ({
  userId,
  deletionRequestedAt,
}: Props) => {
  const t = useTranslations("pendingDeletion");
  const format = useFormatter();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const { handleAction, isPending, errors } = useHandleAction({
    action: async () => await cancelAccountDeletionAction(userId),
    afterAction: async (result) => {
      if (!result.data) return;
      toast.success(t("reopenedToast"));
      router.refresh();
    },
  });

  if (!deletionRequestedAt) return null;

  const deletionDate = format.dateTime(
    accountDeletionDate(deletionRequestedAt),
    {
      dateStyle: "long",
    },
  );

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const result = await logoutServerAction();
    if (result) router.push("/auth/login");
    setLoggingOut(false);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <Clock className="h-6 w-6 text-text-muted" aria-hidden="true" />
          <DialogTitle>{t("title", { date: deletionDate })}</DialogTitle>
          <DialogDescription className="text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-xs! text-text-muted">{t("invisible")}</p>

        <div className="flex w-full flex-col gap-2 pt-2">
          <Button
            variant="default"
            disabled={isPending || loggingOut}
            onClick={() => handleAction()}
          >
            {isPending ? <Spinner className="size-4" /> : t("reopen")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending || loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? <Spinner className="size-4" /> : t("logout")}
          </Button>
        </div>

        {errors && errors.length > 0 && <Errors errors={errors} />}
      </DialogContent>
    </Dialog>
  );
};
