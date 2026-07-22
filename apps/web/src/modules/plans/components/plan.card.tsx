"use client";

import type { FullPlan } from "@repo/common-lib/types/plan";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { UsePlanSubscription } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanFeatures } from "./plan.features";
import { PlanHeader } from "./plan.header";
import { PlanPrice } from "./plan.price";

export type PlanCardProps = {
  plan: FullPlan;
  className?: string;
};

export function PlanCard({ plan, className }: PlanCardProps) {
  const t = useTranslations("plans.card");
  // Extract data from plan
  const name = plan.translation?.name || plan.name;
  const short_description =
    plan.translation?.short_description || plan.short_description;
  const { setPlanSelected } = UsePlanSubscription();

  return (
    <div
      onClick={() => {
        setPlanSelected(plan);
      }}
      className={cn(
        "relative flex flex-col items-start justify-between gap-8 p-8 transition-all duration-300 bg-fg border hover:border-border-em hover:scale-105 shadow-lg max-w-sm w-full hover:cursor-pointer",
        plan.is_popular && "border-border-em",
        className,
      )}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-text px-4 py-1 text-xs font-medium text-accent-fg">
            {t("popular")}
          </span>
        </div>
      )}
      {plan.top_tier && !plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-bg! px-4 py-1 text-xs font-medium">
            {t("bestValue")}
          </span>
        </div>
      )}

      <PlanHeader name={name} description={short_description} />
      {/* Pricing */}
      <PlanPrice isFree={plan.is_free} prices={plan.prices} />
      <div className="w-full">
        <p className="w-full py-3 bg-text text-bg text-center font-bold">
          {plan.is_free ? t("getStarted") : t("goPlan", { planName: plan.name })}
        </p>
      </div>
      <PlanFeatures plan={plan} />
    </div>
  );
}
