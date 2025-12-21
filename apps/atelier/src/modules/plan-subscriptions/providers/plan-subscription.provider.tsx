'use client'

import { FullPlan } from "@repo/common-lib/types/plan";
import { PlanPrice as PlanPriceType } from "@repo/common-lib/types/plan-price";
import { createContext, ReactElement, useContext, useState } from "react";

type PlanSubscriptionContextType = {
  planSelected?: FullPlan;
  setPlanSelected: (plan?: FullPlan) => void;
  priceSelected?: PlanPriceType;
  setPriceSelected: (price?: PlanPriceType) => void;
}
const PlanSubscriptionContext = createContext<PlanSubscriptionContextType>({
  setPlanSelected: () => { },
  setPriceSelected: () => { },
})

export const UsePlanSubscription = () => useContext(PlanSubscriptionContext);

export const PlanSubscriptionProvider = ({ children }: {
  children: ReactElement,
}) => {
  
  const [planSelected, _setPlanSelected] = useState<FullPlan>();
  const [priceSelected, setPriceSelected] = useState<PlanPriceType>();

  const setPlanSelected = (plan?: FullPlan) => {
    if (plan) {
      setPriceSelected(plan?.prices.find(p => p.billing_type === priceSelected?.billing_type || p.billing_type == 'YEARLY'))
    }
    _setPlanSelected(plan)
  }

  return (
    <PlanSubscriptionContext.Provider value={{
      planSelected,
      setPlanSelected,
      priceSelected,
      setPriceSelected,
    }}>
      {children}
    </PlanSubscriptionContext.Provider>
  )
}


