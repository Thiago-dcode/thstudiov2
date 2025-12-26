'use client'


import type { FullPlan } from "@repo/common-lib/types/plan";
import { PlanFeatures } from "./plan.features";
import { PlanPrice } from "./plan.price";
import { cn } from "@repo/ui/lib/utils";
import {  UsePlanSubscription } from "@/modules/plan-subscriptions/providers/plan-subscription.provider";
import { PlanHeader } from "./plan.header";

export type PlanCardProps = {
  plan: FullPlan;
  className?: string;
};


export function PlanCard({
  plan,
  className,
}: PlanCardProps) {
  // Extract data from plan
  const name = plan.translation?.name || plan.name;
  const short_description = plan.translation?.short_description || plan.short_description;
const {setPlanSelected,} = UsePlanSubscription();

  return ( 
   <>
  
    <div
     onClick={()=>{
      setPlanSelected(plan)
    }}
      className={cn(
        "relative flex flex-col items-start justify-between gap-8 rounded-2xl  p-8 transition-all duration-300 border hover:border-accent hover:scale-105 shadow-lg max-w-sm  w-full  bg-fg-1 hover:cursor-pointer",
        plan.is_popular && "border-accent/50 ",
        className
      )}
    >
      {/* Popular Badge */}
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-accent px-4 py-1 text-xs font-medium text-white">
            Popular
          </span>
        </div>
      )}

     <PlanHeader name={name} description={short_description}/>
      {/* Pricing */}
     <PlanPrice isFree={plan.is_free} prices={plan.prices}/>
     <div className="w-full">
        <p
          className="w-full p-3 bg-text rounded-2xl text-bg text-center font-bold"
        >
         {plan.is_free? "Get started" :`Go ${plan.name}`}
        </p>
      </div>
<PlanFeatures plan={plan}/>
    
    </div>
   </>
  );
}

