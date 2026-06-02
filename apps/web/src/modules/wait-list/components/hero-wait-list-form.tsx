"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createWaitListSchema } from "@/modules/wait-list/schemas/wait-list.schema";
import { createWaitListAction } from "@/modules/wait-list/server-actions/create-wait-list.action";

export function HeroWaitListForm() {
  const t = useTranslations("landing.hero.waitList");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  useEffect(() => {
    if (!result?.data) return;
    setIsSuccess(true);
  }, [result]);

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="wait-list-success flex w-full max-w-md flex-col items-center gap-2 rounded-md border border-border/40 bg-fg/50 px-5 py-6 text-center backdrop-blur-md"
      >
        <h3 className="text-lg font-semibold text-text">
          {t("successTitle")}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-text-muted">
          {t("successMessage")}
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
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <form
        onSubmit={handleSubmit}
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
              inputErrors?.email
                ? "hero-wait-list-email-error"
                : "hero-wait-list-email-hint"
            }
            className="h-14 w-full rounded-sm border-border/60 bg-fg/60 px-4 text-base text-text backdrop-blur-md placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />

          {inputErrors?.email ? (
            <p
              id="hero-wait-list-email-error"
              className="text-left text-xs text-error"
            >
              {inputErrors.email}
            </p>
          ) : (
            <p
              id="hero-wait-list-email-hint"
              className="text-left text-xs text-text-muted"
            >
              {t("hint")}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending || !isEmailValid}
          className="h-14 w-full shrink-0 rounded-sm phone:w-auto"
        >
          {isPending ? t("buttonPending") : t("button")}
        </Button>
      </form>
    </div>
  );
}
