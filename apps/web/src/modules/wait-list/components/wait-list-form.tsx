"use client";

import { MAX_WAIT_LIST_SIZE } from "@repo/common-lib/constants/constants";
import type { WaitListCreateResponse } from "@repo/common-lib/types/wait-list";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { toast } from "@repo/ui/sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createWaitListSchema } from "@/modules/wait-list/schemas/wait-list.schema";
import { createWaitListAction } from "@/modules/wait-list/server-actions/create-wait-list.action";

type HeroWaitListFormProps = {
  currentPosition?: number | null;
};

export function WaitListForm({ currentPosition }: HeroWaitListFormProps) {
  const t = useTranslations("landing.hero.waitList");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [waitListResultData, setWaitListResultData] =
    useState<WaitListCreateResponse | null>(null);
  const hasAvailableSpots =
    currentPosition == null || currentPosition <= MAX_WAIT_LIST_SIZE;
  const displayPosition = currentPosition
    ? Math.min(Math.max(currentPosition, 1), MAX_WAIT_LIST_SIZE)
    : null;

  const emailInputRef = useRef<HTMLInputElement>(null);

  const isEmail = (input?: string) => {
    const value = (input ?? emailInputRef.current?.value ?? "").trim();
    return createWaitListSchema.safeParse({ email: value }).success;
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

  const handleWaitListSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!hasAvailableSpots) {
      event.preventDefault();
      toast.error(t("fullMessage"));
      return;
    }

    await handleSubmit(event);
  };

  useEffect(() => {
    if (!result?.data) return;
    setIsSuccess(true);
    setWaitListResultData(result.data);
  }, [result]);

  if (isSuccess) {
    if (waitListResultData?.already_exists) {
      const email = waitListResultData.email ?? "";

      return (
        <div aria-live="polite" className="flex w-full justify-center">
          <div className="wait-list-success flex w-full max-w-md flex-col items-center gap-2 border border-border/40 bg-fg/50 px-5 py-6 text-center backdrop-blur-md">
            <h3 className="text-lg font-semibold text-text">
              {email} is already on the wait list. Check your email. If this
              looks wrong,{" "}
              <Link href="/support" className="text-text underline">
                contact support
              </Link>
              .
            </h3>
          </div>
        </div>
      );
    }

    return (
      <div aria-live="polite" className="flex w-full justify-center">
        <div className="wait-list-success flex w-full max-w-md flex-col items-center gap-2 border border-border/40 bg-fg/50 px-5 py-6 text-center backdrop-blur-md">
          <h3 className="text-lg font-semibold text-text">
            {t("successTitle")}
          </h3>
          <p className="text-sm text-text-muted">{t("successMessage")}</p>
          <p className="text-sm text-text-muted">
            {t("successReserveMessage")}
          </p>

          <style>{`
 @media (prefers-reduced-motion: no-preference) {
 .wait-list-success {
 animation: wait-list-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
 }
 @keyframes wait-list-pop {
 from { opacity: 0; transform: scale(0.96) translateY(10px); }
 to { opacity: 1; transform: scale(1) translateY(0); }
 }
 }
 `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleWaitListSubmit}
        className="flex w-full flex-col gap-2 phone:flex-row phone:items-start"
        noValidate
      >
        <div className="flex w-full flex-1 flex-col gap-1.5">
          <Input
            ref={emailInputRef}
            id="hero-wait-list-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("placeholder")}
            required
            onChange={handleEmailChange}
            aria-invalid={!!inputErrors?.email}
            aria-describedby={
              inputErrors?.email ? "hero-wait-list-email-error" : undefined
            }
            className="h-14 w-full border-border/60 bg-fg/60 px-4 text-base text-text backdrop-blur-md placeholder:text-text-muted "
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
          variant="primary"
          size="lg"
          disabled={isPending || !isEmailValid || !hasAvailableSpots}
          className="wait-list-fire-button h-14 w-full shrink-0 phone:w-auto text-accent-fg"
        >
          {isPending ? t("buttonPending") : t("button")}
        </Button>
      </form>

      <div className="mb-2 flex items-center justify-start gap-2">
        <p
          id="hero-wait-list-email-hint"
          className="text-left text-xs text-text-muted"
        >
          {t("hint")}
        </p>
        <InfoTooltip content={t("hintTooltip")} />
      </div>

      {displayPosition ? (
        <div className="mt-2 flex justify-start text-xs font-medium text-text-muted">
          <span>
            {t("positionCount", {
              position: displayPosition,
              max: MAX_WAIT_LIST_SIZE,
            })}
            {", "}
            {t("spotWarning")}
          </span>
        </div>
      ) : null}

      <style>{`
        .wait-list-fire-button:not(:disabled):hover {
          filter: brightness(1.04);
        }
      `}</style>
    </div>
  );
}
