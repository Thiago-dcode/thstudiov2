import { PlanCard } from "@/modules/plans/components/plan.card";
import { PlanProvider } from "@/modules/plans/components/plan.provider";
import plansService from "@/modules/plans/plans.service";
import utilsService from "@/modules/utils/utils.service";
import { redirect } from "next/navigation";

export default async function Step4() {
    const [plans, paymentMethods] = await Promise.all([
        plansService.getAll({
            is_active: true,
        }),
        utilsService.getPaymentMethods({enabled:true})
    ])
    if (plans.error || !plans.data) {
        redirect('/')
    }

    return (
        <PlanProvider availablePaymentMethods={paymentMethods.data!}>
           <>
           <div className="size-full flex flex-wrap items-center justify-center gap-8">
                {plans.data.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                    />
                ))}
            </div>
           </>
        </PlanProvider>
    );
}