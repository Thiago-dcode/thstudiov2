"use client";

import type { PlanPrice } from "@repo/common-lib/types/plan-price";
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
import { ArrowRight, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CustomIconClient } from "@/lib/components/custom-icon-client";
import { UsePlanSubscription } from "../providers/plan-subscription.provider";

type BenefitSubscriptionDialogProps = {
  planPrice: PlanPrice;
  planName: string;
};

export const BenefitSubscriptionDialog = ({
  planPrice,
  planName,
}: BenefitSubscriptionDialogProps) => {
  const t = useTranslations("benefitSubscriptionDialog");
  const [open, setOpen] = useState(true);
  const {
    benefit,
    successUrl,
    cancelUrl,
    handleSubmit,
    isPending,
    errors,
    onErrorComponent,
  } = UsePlanSubscription();

  if (!benefit || benefit.redeemed) return null;

  const benefitTypeKey =
    `benefitTypes.${benefit.type}` as `benefitTypes.${typeof benefit.type}`;
  const label = t.has(benefitTypeKey) ? t(benefitTypeKey) : benefit.name;
  const months = Math.round(benefit.trial_days / 30);
  const billingTypeKey =
    `billingTypes.${planPrice.billing_type}` as `billingTypes.${typeof planPrice.billing_type}`;

  const handleSubmitSubscription = () => {
    const formData = new FormData();
    formData.set("plan_price_id", planPrice.id.toString());
    formData.set("payment_method", "CARD");
    formData.set("benefit_id", benefit.id.toString());
    formData.set("success_url", successUrl);
    formData.set("cancel_url", cancelUrl);
    handleSubmit(formData);
  };

  if (isPending) {
    return (
      <Dialog open>
        <DialogContent className="w-full max-w-md p-10">
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 animate-ping bg-fg" />
              <span className="absolute inset-0 animate-pulse bg-fg-2" />
              <Gift className="size-7 text-text" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <DialogTitle className="text-lg font-semibold text-text">
                {t("activatingTitle")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Spinner className="size-4" />
                <span>{t("activatingSubtitle")}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (errors && errors.length > 0) {
    return (
      <Dialog open>
        <DialogContent className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex size-16 items-center justify-center bg-error/10">
              <svg
                className="size-8 text-error"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-semibold text-error">
              {t("errorTitle")}
            </DialogTitle>
            <div className="flex flex-col gap-2">
              {errors.map((error, index) => (
                <p key={index} className="text-text-muted">
                  {error}
                </p>
              ))}
            </div>
            <div className="flex w-full flex-col gap-3">{onErrorComponent}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer fixed bottom-6 right-6 z-50 flex items-center gap-2 border border-border-em bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg shadow-lg backdrop-blur-sm transition-all hover:bg-accent/90"
        >
          <CustomIconClient name="gift" alt="" size="xs" />
          <span>{t("trigger")}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md overflow-hidden p-0">
        <div className="h-1 w-full bg-border-em" />

        <div className="flex flex-col items-center gap-6 p-8 pt-6">
          <div className="relative">
            <CustomIconClient name="gift" alt="" size="sm" />
          </div>

          <DialogHeader className="items-center gap-2">
            <DialogTitle className="text-2xl font-semibold text-text">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-center text-base text-text-muted">
              {t.rich("description", {
                label,
                planName,
                months,
                name: (chunks) => (
                  <span className="font-semibold text-text">{chunks}</span>
                ),
                free: (chunks) => (
                  <span className="font-semibold text-accent">{chunks}</span>
                ),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="text-center flex w-full items-start gap-3 border border-border bg-fg px-4 py-3 text-sm text-text-muted">
            <span>
              {t.rich("noPayment", {
                months,
                access: (chunks) => (
                  <span className="font-medium text-text">{chunks}</span>
                ),
              })}
            </span>
          </div>

          <div className="flex w-full flex-col border border-fg-1/15 ">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">{t("plan")}</span>
              <span className="text-sm font-semibold text-text">
                {planName}
              </span>
            </div>
            <div className="mx-4 h-px bg-fg/10" />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-muted">
                {t("billingCycle")}
              </span>
              <span className="text-sm capitalize text-text">
                {t(billingTypeKey)}
              </span>
            </div>
            <div className="mx-4 h-px bg-fg/10" />
            <div className="flex items-center justify-between pl-4  py-3">
              <span className="text-sm text-text-muted">{t("freePeriod")}</span>
              <span className="inline-flex items-center gap-1.5 bg-fg px-2.5 py-0.5 text-sm font-semibold text-text">
                <Gift className="size-3.5" />
                {t("freeMonths", { months })}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pt-1">
            <Button
              onClick={handleSubmitSubscription}
              variant="accent"
              className="w-full font-bold"
            >
              {t("subscribe")}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
