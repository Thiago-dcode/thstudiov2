import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { ChangeSubscriptionDialog } from "@/modules/plan-subscriptions/components/change-subscription-dialog.component";
import { PlanSubscriptionProvider } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanCard } from "@/modules/plans/components/plan.card";
import plansService from "@/modules/plans/plans.service";
import usersService from "@/modules/users/users.service";
import utilsService from "@/modules/utils/utils.service";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { redirect } from "next/navigation";
import { ButtonFinishFunnel, ContainerFormFunnel } from "./funnel.provider";
import { getHighestMontlyPrice } from "@repo/common-lib/utils/calculatePrice";

export default async function Step4() {

    const user = await userSession();
    if (!user) redirect('/');
    const [plans, paymentMethods, activeSubscription] = await Promise.all([
        plansService.getAll({
            is_active: true,
        }),
        utilsService.getPaymentMethods({
            enabled: true
        }),
        usersService.getActiveSubscription(user.id)
    ]);
    // Skip if user already has already a paid subscription 
    if (plans.error || !plans || !plans.data || !activeSubscription.data?.plan_price.plan.is_free) {
        await usersService.update(user.id, {
            funnel_step: FUNNEL_LAST_STEP + 1
        });
        redirect('/get-started');
    }

    // Calculate the most expensive plan (excluding free plans)
    const paidPlans = plans.data!.filter(plan => !plan.is_free);
    const mostExpensivePlanId = paidPlans.length > 0 
        ? paidPlans.reduce((maxPlan, currentPlan) => {
            const maxPrice = getHighestMontlyPrice(maxPlan.prices);
            const currentPrice = getHighestMontlyPrice(currentPlan.prices);
            return currentPrice > maxPrice ? currentPlan : maxPlan;
          }, paidPlans[0]).id
        : null;

    return (
        <PlanSubscriptionProvider >
            <>
                <ChangeSubscriptionDialog onFreeComponent={<ContainerFormFunnel >
                    <ButtonFinishFunnel variant={'default'} text={"Continue without benefits"} />
                </ContainerFormFunnel>} onErrorComponent={<ContainerFormFunnel >
                    <ButtonFinishFunnel text={"Try again later"} />
                </ContainerFormFunnel>} successUrl={config.app_url + '/get-started/success'} cancelUrl={config.app_url + '/get-started/failed'} availablePaymentMethods={paymentMethods.data!} />
                <div className="size-full flex flex-wrap items-center justify-center gap-8">
                    {plans.data!.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            isMostExpensive={plan.id === mostExpensivePlanId}
                        />
                    ))}
                </div>
            </>
        </PlanSubscriptionProvider>
    );
}