import type { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import type { PaymentMethod } from "@repo/common-lib/types/payment-method";
import type { FullPlan } from "@repo/common-lib/types/plan";
import type { ReactNode } from "react";
import { BenefitSubscriptionDialog } from "@/modules/plan-subscriptions/components/benefit-subscription-dialog";
import { ChangeSubscriptionDialog } from "@/modules/plan-subscriptions/components/change-subscription-dialog.component";
import { PlanSubscriptionProvider } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanCard } from "@/modules/plans/components/plan.card";

type PlanSubscriptionListProps = {
  plans: FullPlan[];
  paymentMethods: PaymentMethod[];
  successUrl: string;
  cancelUrl: string;
  benefit?: BenefitWithRedeemed;
  onErrorComponent: ReactNode;
  onFreeComponent: ReactNode;
};

export default function PlanSubscriptionList({
  plans,
  paymentMethods,
  successUrl,
  cancelUrl,
  onErrorComponent,
  onFreeComponent,
  benefit,
}: PlanSubscriptionListProps) {
  const topTierPlan = plans.find((plan) => plan.top_tier) ?? null;
  const montlyPlanPrice = topTierPlan?.prices.find(
    (p) => p.billing_type === "MONTHLY",
  );
  const topTierPlanName =
    topTierPlan?.translation?.name || topTierPlan?.name || "";
  return (
    <PlanSubscriptionProvider
      availablePaymentMethods={paymentMethods}
      successUrl={successUrl}
      cancelUrl={cancelUrl}
      benefit={benefit}
      onErrorComponent={onErrorComponent}
      onFreeComponent={onFreeComponent}
    >
      <ChangeSubscriptionDialog />
      {montlyPlanPrice && (
        <BenefitSubscriptionDialog
          planPrice={montlyPlanPrice}
          planName={topTierPlanName}
        />
      )}

      <div className="size-full flex flex-wrap items-center justify-center gap-8">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </PlanSubscriptionProvider>
  );
}
