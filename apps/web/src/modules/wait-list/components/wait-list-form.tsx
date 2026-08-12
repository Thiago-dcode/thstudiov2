"use client";

import type { WaitListCreateResponse } from "@repo/common-lib/types/wait-list";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { WAIT_LIST_FAQ_ID } from "@/lib/components/faqs";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createWaitListSchema } from "@/modules/wait-list/schemas/wait-list.schema";
import { createWaitListAction } from "@/modules/wait-list/server-actions/create-wait-list.action";

export function WaitListHint({ className }: { className?: string } = {}) {
  const t = useTranslations("landing.hero");

  return (
    <div
      className={cn(
        "flex items-start justify-start gap-2 text-left",
        className,
      )}
    >
      <p
        id="hero-wait-list-email-hint"
        className="min-w-0 text-left text-sm! leading-snug text-text-muted! tablet:text-base!"
      >
        {t("waitList.hint")}
      </p>
      <InfoTooltip
        content={t.rich("waitList.hintTooltip", {
          learnMore: (chunks) => (
            <Link
              href={`/faqs#${WAIT_LIST_FAQ_ID}`}
              className="font-medium text-text underline underline-offset-4 transition-colors hover:text-text-muted"
            >
              {chunks}
            </Link>
          ),
        })}
        iconClassName="text-text-muted"
      />
    </div>
  );
}

export function WaitListForm({ className }: { className?: string } = {}) {
  const t = useTranslations("landing.hero");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [waitListResultData, setWaitListResultData] =
    useState<WaitListCreateResponse | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const isEmail = (input?: string) => {
    const value = (input ?? emailInputRef.current?.value ?? "").trim();
    // Only `.success` is read here, so the message text never surfaces —
    // an identity translator avoids needing the full message catalog client-side.
    return createWaitListSchema((key) => key).safeParse({ email: value })
      .success;
  };

  const handleEmailChange = () => {
    setIsEmailValid(isEmail());
  };

  const { handleSubmit, isPending, inputErrors, result } = useHandleAction({
    action: createWaitListAction,
    afterAction: async (actionResult) => {
      if (actionResult.errors?.length) {
        actionResult.errors.forEach((error) => {
          toast.error(error);
        });
      }
    },
  });

  useEffect(() => {
    if (!result?.data) return;
    setIsSuccess(true);
    setWaitListResultData(result.data);
    if (emailInputRef.current) {
      emailInputRef.current.value = "";
    }
    setIsEmailValid(false);
  }, [result]);

  const alreadyExists = waitListResultData?.already_exists === true;
  const email = waitListResultData?.email ?? "";

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full flex-col gap-2 phone:flex-row phone:items-start",
          className,
        )}
        noValidate
      >
        <div className="flex w-full flex-1 flex-col gap-1.5">
          <Input
            ref={emailInputRef}
            id="hero-wait-list-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("waitList.placeholder")}
            required
            onChange={handleEmailChange}
            aria-invalid={!!inputErrors?.email}
            aria-describedby={
              inputErrors?.email ? "hero-wait-list-email-error" : undefined
            }
            className="h-10 laptop:h-12 w-full px-4 text-sm!"
          />

          {inputErrors?.email ? (
            <p
              id="hero-wait-list-email-error"
              className="text-left text-xs text-error"
            >
              {inputErrors.email}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={isPending || !isEmailValid}
          className=" h-10 laptop:h-12 py-0 shrink-0 text-accent-fg"
        >
          {isPending ? t("waitList.buttonPending") : t("waitList.button")}
        </Button>
      </form>

      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center sm:text-center">
            {alreadyExists ? (
              <DialogTitle className="text-balance leading-snug">
                {t.rich("waitList.alreadyExists", {
                  email,
                  supportLink: (chunks) => (
                    <Link href="/support" className="text-text underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </DialogTitle>
            ) : (
              <>
                <DialogTitle>{t("waitList.successTitle")}</DialogTitle>
                <DialogDescription className="space-y-2">
                  <span className="block">{t("waitList.successMessage")}</span>
                  <span className="block">
                    {t("waitList.successReserveMessage")}
                  </span>
                </DialogDescription>
              </>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <style>{`
        .wait-list-fire-button:not(:disabled):hover {
          filter: brightness(1.04);
        }
      `}</style>
    </div>
  );
}
