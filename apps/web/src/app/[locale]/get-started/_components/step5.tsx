import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import PlanSubscriptionList from "@/modules/plans/components/plan-list";
import plansService from "@/modules/plans/plans.service";
import usersService from "@/modules/users/users.service";
import utilsService from "@/modules/utils/utils.service";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { redirect } from "next/navigation";
import { ButtonFinishFunnel, ContainerFormFunnel } from "./funnel.provider";
import userBenefitService from "@/modules/user-benefit/user-benefit.service";

export default async function Step5() {

    const user = await userSession();
    if (!user) redirect('/');
    const [plans, paymentMethods, activeSubscription, benefit] = await Promise.all([
        plansService.getAll({
            is_active: true,
        }),
        utilsService.getPaymentMethods({
            enabled: true
        }),
        usersService.getActiveSubscription(user.id),
        userBenefitService.getByUserId(user.id)
    ]);
    // Skip if user already has already a paid subscription 
    if (plans.error || !plans || !plans.data || !activeSubscription.data?.plan_price.plan.is_free) {
        await usersService.update(user.id, {
            funnel_step: FUNNEL_LAST_STEP + 1
        });
        redirect('/get-started');
    }

    return (
        <PlanSubscriptionList
            plans={plans.data!}
            paymentMethods={paymentMethods.data!}
            successUrl={config.app_url + '/get-started/success'}
            cancelUrl={config.app_url + '/get-started/failed'}
            benefit={benefit.data || undefined}
            onFreeComponent={
                <ContainerFormFunnel>
                    <ButtonFinishFunnel variant={'default'} text={"Continue without benefits"} />
                </ContainerFormFunnel>
            }
            onErrorComponent={
                <ContainerFormFunnel>
                    <ButtonFinishFunnel text={"Try again later"} />
                </ContainerFormFunnel>
            }
        />
    );
}
