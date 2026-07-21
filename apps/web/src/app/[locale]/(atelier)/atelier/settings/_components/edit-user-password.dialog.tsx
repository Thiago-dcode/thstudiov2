"use client";

import { MAX_PASSWORD_RESET } from "@repo/common-lib/constants/constants";
import type { User } from "@repo/common-lib/types/user";
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
import { toast } from "@repo/ui/sonner";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateUserPasswordAction } from "@/modules/users/server-actions/update-user-password.action";

type Props = {
  user: User;
};

export const EditUserPasswordDialog = ({ user }: Props) => {
  const t = useTranslations("atelier.settings.changePassword");
  const [open, setOpen] = useState(false);

  const { handleSubmit, isPending, errors, success, reset } = useHandleAction({
    action: async (formData: FormData) => {
      return await updateUserPasswordAction(user.id, formData);
    },
  });

  useEffect(() => {
    if (success) {
      toast.success(t("successToast"));
      setOpen(false);
      reset();
    }
  }, [success, reset]);

  const handleOpenChange = (value: boolean) => {
    if (isPending) return;
    if (!value) reset();
    setOpen(value);
  };

  const resetDate = user.next_password_reset
    ? new Date(user.next_password_reset as unknown as string)
    : null;
  const periodExpired = resetDate && new Date() >= resetDate;
  const effectiveCount = periodExpired ? 0 : (user.password_reset_count ?? 0);
  const maxResetReached = effectiveCount >= MAX_PASSWORD_RESET;
  const remaining = MAX_PASSWORD_RESET - effectiveCount;

  const resetDateFormatted =
    resetDate && !periodExpired
      ? resetDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="size-4" />
          {t("triggerLabel")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <FormComponent.Container>
          {maxResetReached ? (
            <div className=" border border-error/30 bg-error/5 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-error">
                {t("monthlyLimitReached")}
              </p>
              <p className="text-text-muted">
                {t("usedAllChanges", { max: MAX_PASSWORD_RESET })}
                {resetDateFormatted && (
                  <>
                    {" "}
                    {t.rich("availableAgainOn", {
                      date: resetDateFormatted,
                      strong: (chunks) => (
                        <span className="font-medium text-text">
                          {chunks}
                        </span>
                      ),
                    })}
                  </>
                )}
              </p>
            </div>
          ) : (
            <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
              <FormComponent.LabelInput
                label={t("currentPasswordLabel")}
                id="old_password"
                name="old_password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                onChange={() => {
                  if (errors) reset();
                }}
              />

              <FormComponent.LabelInput
                label={t("newPasswordLabel")}
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                extraInfo={t("newPasswordInfo")}
                onChange={() => {
                  if (errors) reset();
                }}
              />

              {effectiveCount > 0 && (
                <p className="text-xs text-text-muted">
                  {t("remainingChanges", {
                    remaining,
                    max: MAX_PASSWORD_RESET,
                  })}
                  {resetDateFormatted && (
                    <>{t("resetsOn", { date: resetDateFormatted })}</>
                  )}
                </p>
              )}

              <FormComponent.SubmitButton
                isPending={isPending}
                disabled={isPending}
              >
                {t("submit")}
              </FormComponent.SubmitButton>

              {errors && errors.length > 0 && <Errors errors={errors} />}
            </FormComponent.Form>
          )}
        </FormComponent.Container>
      </DialogContent>
    </Dialog>
  );
};
