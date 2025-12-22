import { config } from "@/lib/config";
import { setUserSession, userSession } from "@/modules/auth/server-actions/user-session.action";
import { ChangeSubscriptionDialog } from "@/modules/plan-subscriptions/components/change-subscription-dialog.component";
import planSubscriptionsService from "@/modules/plan-subscriptions/plan-subscriptions.service";
import { PlanSubscriptionProvider } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanCard } from "@/modules/plans/components/plan.card";
import plansService from "@/modules/plans/plans.service";
import { updateUserAction } from "@/modules/users/server-actions/update-user.action";
import usersService from "@/modules/users/users.service";
import utilsService from "@/modules/utils/utils.service";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { redirect } from "next/navigation";
import { ButtonFinishFunnel, ButtonSubmitFunnel, ContainerFormFunnel } from "./funnel.provider";

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
        planSubscriptionsService.getActive(user.id)
    ]);
    //Skip if user already has already a paid subscription 
    if (plans.error || !plans || !plans.data || !activeSubscription.data?.plan_price.plan.is_free) {
        await usersService.update(user.id, {
            funnel_step: FUNNEL_LAST_STEP + 1
        });
        redirect('/get-started');
    }

    return (
        <PlanSubscriptionProvider >
            <>
                <ChangeSubscriptionDialog onErrorComponent={<ContainerFormFunnel >
                    <ButtonFinishFunnel  text={"Try again later"} />
                </ContainerFormFunnel>} successUrl={config.app_url + '/get-started/success'} cancelUrl={config.app_url + '/get-started/failed'} availablePaymentMethods={paymentMethods.data!} />
                <div className="size-full flex flex-wrap items-center justify-center gap-8">
                    {plans.data.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                        />
                    ))}
                </div>
            </>
        </PlanSubscriptionProvider>
    );
}