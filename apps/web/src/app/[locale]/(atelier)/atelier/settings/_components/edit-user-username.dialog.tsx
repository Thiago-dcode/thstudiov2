"use client";

import { MAX_USERNAME_RESET } from "@repo/common-lib/constants/limits";
import type { User } from "@repo/common-lib/types/user";
import { normalizeUsername } from "@repo/common-lib/utils/username";
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
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateUserAction } from "@/modules/users/server-actions/update-user.action";

type Props = {
  user: User;
};

export const EditUserUsernameDialog = ({ user }: Props) => {
  const t = useTranslations("atelier.settings.changeUsername");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(user.username ?? "");

  const {
    handleSubmit,
    isPending,
    errors,
    inputErrors,
    success,
    reset,
    deleteInputErrorProperty,
  } = useHandleAction({
    action: async (formData: FormData) => {
      return await updateUserAction(user.id, formData);
    },
  });

  useEffect(() => {
    if (success) {
      toast.success(t("successToast"));
      setOpen(false);
      reset();
    }
  }, [success, reset]);

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) {
      reset();
      setValue(user.username ?? "");
    }
    setOpen(next);
  };

  const resetDate = user.next_username_reset
    ? new Date(user.next_username_reset as unknown as string)
    : null;
  const periodExpired = resetDate && new Date() >= resetDate;
  const effectiveCount = periodExpired ? 0 : (user.username_reset_count ?? 0);
  const maxResetReached = effectiveCount >= MAX_USERNAME_RESET;
  const remaining = MAX_USERNAME_RESET - effectiveCount;

  const isUnchanged = value.trim() === (user.username ?? "");

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
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-text-muted hover:text-text"
        >
          <Pencil className="size-3.5" />
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
                {t("usedAllChanges", { max: MAX_USERNAME_RESET })}
                {resetDateFormatted && (
                  <>
                    {" "}
                    {t.rich("availableAgainOn", {
                      date: resetDateFormatted,
                      strong: (chunks) => (
                        <span className="font-medium text-text">{chunks}</span>
                      ),
                    })}
                  </>
                )}
              </p>
            </div>
          ) : (
            <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
              <FormComponent.LabelInput
                label={t("newUsernameLabel")}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
                defaultValue={user.username ?? ""}
                extraInfo={t("newUsernameInfo")}
                onChange={(e) => {
                  e.target.value = normalizeUsername(e.target.value);
                  setValue(e.target.value);
                  deleteInputErrorProperty("username");
                }}
                error={inputErrors?.username}
              />

              {effectiveCount > 0 && (
                <p className="text-xs text-text-muted">
                  {t("remainingChanges", {
                    remaining,
                    max: MAX_USERNAME_RESET,
                  })}
                  {resetDateFormatted &&
                    t("resetsOn", { date: resetDateFormatted })}
                </p>
              )}

              <FormComponent.SubmitButton
                isPending={isPending}
                disabled={isPending || isUnchanged}
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
