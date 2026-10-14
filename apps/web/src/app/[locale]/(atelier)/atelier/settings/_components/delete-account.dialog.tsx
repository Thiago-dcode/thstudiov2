"use client";

import { ACCOUNT_DELETION_GRACE_DAYS } from "@repo/common-lib/constants/limits";
import type { User } from "@repo/common-lib/types/user";
import { Errors } from "@repo/ui/components/custom/errors";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { requestAccountDeletionAction } from "@/modules/users/server-actions/request-account-deletion.action";

type Props = {
  user: Pick<User, "id">;
  /** Paid subscription that still renews: offer to stop it now. */
  hasRenewingSubscription: boolean;
};

export const DeleteAccountDialog = ({
  user,
  hasRenewingSubscription,
}: Props) => {
  const t = useTranslations("atelier.settings.dangerZone.delete");
  const router = useRouter();
  const { refresh: refreshMetrics } = useUserMetrics();
  const [open, setOpen] = useState(false);
  const [cancelSubscription, setCancelSubscription] = useState(false);

  const { handleSubmit, isPending, errors, reset } = useHandleAction({
    action: async (formData: FormData) =>
      await requestAccountDeletionAction(user.id, formData),
    afterAction: async (result) => {
      if (!result.data) return;
      setOpen(false);
      // The atelier layout re-reads the user and shows the "pending deletion" modal.
      // Metrics carry the account status the modal / top-nav label read.
      await refreshMetrics();
      router.refresh();
    },
  });

  const handleOpenChange = (value: boolean) => {
    if (isPending) return;
    if (!value) {
      reset();
      setCancelSubscription(false);
    }
    setOpen(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <DialogDescription>
            {t("description", { days: ACCOUNT_DELETION_GRACE_DAYS })}
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-xs text-text-muted">
          <li>{t("whatHidden")}</li>
          <li>{t("whatDeleted")}</li>
          <li>{t("whatReopen", { days: ACCOUNT_DELETION_GRACE_DAYS })}</li>
        </ul>

        <FormComponent.Container>
          <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
            {hasRenewingSubscription && (
              <div className="flex items-start gap-3 border border-fg-2 px-3 py-3">
                <Checkbox
                  id="cancel_subscription"
                  name="cancel_subscription"
                  checked={cancelSubscription}
                  onCheckedChange={(value) =>
                    setCancelSubscription(value === true)
                  }
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="cancel_subscription"
                    // `!`: Label ships `sm:text-base`.
                    className="text-xs! font-medium"
                  >
                    {t("cancelSubscriptionLabel")}
                  </Label>
                  {/* `!`: the global unlayered `p { font-size }` rule otherwise beats `text-xs`. */}
                  <p className="text-xs! text-text-muted">
                    {cancelSubscription
                      ? t("cancelSubscriptionOn")
                      : t("cancelSubscriptionOff")}
                  </p>
                </div>
              </div>
            )}

            <FormComponent.LabelInput
              label={t("passwordLabel")}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              onChange={() => {
                if (errors) reset();
              }}
            />

            <FormComponent.SubmitButton
              isPending={isPending}
              disabled={isPending}
              variant="destructive"
            >
              {t("submit")}
            </FormComponent.SubmitButton>

            {errors && errors.length > 0 && <Errors errors={errors} />}
          </FormComponent.Form>
        </FormComponent.Container>
      </DialogContent>
    </Dialog>
  );
};
