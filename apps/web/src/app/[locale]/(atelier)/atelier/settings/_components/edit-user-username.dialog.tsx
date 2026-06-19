"use client";

import { MAX_USERNAME_RESET } from "@repo/common-lib/constants/constants";
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
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { updateUserAction } from "@/modules/users/server-actions/update-user.action";

type Props = {
  user: User;
};

export const EditUserUsernameDialog = ({ user }: Props) => {
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
      toast.success("Username updated successfully!");
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
          <DialogTitle>Change Username</DialogTitle>
          <DialogDescription>
            Choose a new username for your account.
          </DialogDescription>
        </DialogHeader>

        <FormComponent.Container>
          {maxResetReached ? (
            <div className=" border border-error/30 bg-error/5 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-error">Monthly limit reached</p>
              <p className="text-text-muted">
                You've used all {MAX_USERNAME_RESET} username changes for this
                period.
                {resetDateFormatted && (
                  <>
                    {" "}
                    Available again on{" "}
                    <span className="font-medium text-text">
                      {resetDateFormatted}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          ) : (
            <FormComponent.Form onSubmit={handleSubmit} className="pt-2">
              <FormComponent.LabelInput
                label="New Username"
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                defaultValue={user.username ?? ""}
                extraInfo="3–20 characters, letters and numbers only"
                onChange={(e) => {
                  setValue(e.target.value);
                  deleteInputErrorProperty("username");
                }}
                error={inputErrors?.username}
              />

              {effectiveCount > 0 && (
                <p className="text-xs text-text-muted">
                  {remaining} of {MAX_USERNAME_RESET} change
                  {remaining !== 1 ? "s" : ""} remaining this month
                  {resetDateFormatted && <> · resets on {resetDateFormatted}</>}
                </p>
              )}

              <FormComponent.SubmitButton
                isPending={isPending}
                disabled={isPending || isUnchanged}
              >
                Update Username
              </FormComponent.SubmitButton>

              {errors && errors.length > 0 && <Errors errors={errors} />}
            </FormComponent.Form>
          )}
        </FormComponent.Container>
      </DialogContent>
    </Dialog>
  );
};
