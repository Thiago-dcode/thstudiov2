import { ChangeSubscriptionDialog } from "@/modules/plan-subscriptions/components/change-subscription-dialog.component";
import { PlanSubscriptionProvider } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanCard } from "@/modules/plans/components/plan.card";
import { getHighestMontlyPrice } from "@repo/common-lib/utils/calculatePrice";
import { FullPlan } from "@repo/common-lib/types/plan";
import { PaymentMethod } from "@repo/common-lib/types/payment-method";
import { ReactNode } from "react";
import { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import { BenefitSubscriptionDialog } from "@/modules/plan-subscriptions/components/benefit-subscription-dialog";

type PlanSubscriptionListProps = {
    plans: FullPlan[];
    paymentMethods: PaymentMethod[];
    successUrl: string;
    cancelUrl: string;
    benefit?: BenefitWithRedeemed,
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
    benefit
}: PlanSubscriptionListProps) {
    const paidPlans = plans.filter(plan => !plan.is_free);
    const mostExpensivePlan = paidPlans.length > 0
        ? paidPlans.reduce((maxPlan, currentPlan) => {
            const maxPrice = getHighestMontlyPrice(maxPlan.prices);
            const currentPrice = getHighestMontlyPrice(currentPlan.prices);
            return currentPrice > maxPrice ? currentPlan : maxPlan;
        }, paidPlans[0])
        : null;

    const montlyPlanPrice = mostExpensivePlan?.prices.find(p => p.billing_type === 'MONTHLY');
    const mostExpensivePlanName = mostExpensivePlan?.translation?.name || mostExpensivePlan?.name || '';
    return (
        <PlanSubscriptionProvider
            availablePaymentMethods={paymentMethods}
            successUrl={successUrl}
            cancelUrl={cancelUrl}
            benefit={benefit}
            onErrorComponent={onErrorComponent}
            onFreeComponent={onFreeComponent}
        >
            <>
                <ChangeSubscriptionDialog />
               {montlyPlanPrice && <BenefitSubscriptionDialog planPrice={montlyPlanPrice} planName={mostExpensivePlanName} />}

                <div className="size-full flex flex-wrap items-center justify-center gap-8">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            isMostExpensive={plan.id === mostExpensivePlan?.id}
                        />
                    ))}
                </div>
            </>
        </PlanSubscriptionProvider>
    );
}
