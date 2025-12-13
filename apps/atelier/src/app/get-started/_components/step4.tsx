import { PlanCard } from "@/modules/plans/components/plan.card";
import { PlanProvider } from "@/modules/plans/components/plan.provider";
import plansService from "@/modules/plans/plans.service";
import { redirect } from "next/navigation";

export default async function Step4() {
    const plans = await plansService.getAll({
        is_active: true,
    });
    if (plans.error || !plans.data) {
        redirect('/')
    }

    return (
        <PlanProvider>
            <div className="size-full flex flex-wrap items-center justify-center gap-8">
                {plans.data.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                    />
                ))}
            </div>
        </PlanProvider>
    );
}