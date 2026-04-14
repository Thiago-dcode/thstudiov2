'use client'

import { FullPlan } from "@repo/common-lib/types/plan";
import { PlanPrice as PlanPriceType } from "@repo/common-lib/types/plan-price";
import { PaymentMethod } from "@repo/common-lib/types/payment-method";
import { EnumType } from "@repo/common-lib/constants/enums";
import { createContext, ReactElement, ReactNode, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { initiateSubscriptionAction } from "../server-actions/initiate-subscription.action";
import { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";

type PlanSubscriptionContextType = {
  planSelected?: FullPlan;
  setPlanSelected: (plan?: FullPlan) => void;
  priceSelected?: PlanPriceType;
  setPriceSelected: (price?: PlanPriceType) => void;
  availablePaymentMethods: PaymentMethod[];
  paymentMethod?: EnumType<'PAYMENT_METHOD'>;
  setPaymentMethod: (method: EnumType<'PAYMENT_METHOD'>) => void;
  successUrl: string;
  cancelUrl: string;
  benefit?: BenefitWithRedeemed,
  onErrorComponent: ReactNode;
  onFreeComponent: ReactNode;
  isPending: boolean;
  errors: string[] | null;
  submitSubscription: () => void;
  onSubmit: (e: React.FormEvent) => void;
  handleSubmit: (formData: FormData) => void;
}

const PlanSubscriptionContext = createContext<PlanSubscriptionContextType>({
  setPlanSelected: () => { },
  setPriceSelected: () => { },
  setPaymentMethod: () => { },
  availablePaymentMethods: [],
  successUrl: '',
  cancelUrl: '',
  onErrorComponent: null,
  onFreeComponent: null,
  isPending: false,
  errors: null,
  submitSubscription: () => { },
  onSubmit: () => { },
  handleSubmit: () => { },
})

export const UsePlanSubscription = () => useContext(PlanSubscriptionContext);

type PlanSubscriptionProviderProps = {
  children: ReactElement;
  availablePaymentMethods: PaymentMethod[];
  successUrl: string;
  cancelUrl: string;
  benefit?: BenefitWithRedeemed,
  onErrorComponent: ReactNode;
  onFreeComponent: ReactNode;
};

export const PlanSubscriptionProvider = ({
  children,
  availablePaymentMethods,
  successUrl,
  cancelUrl,
  benefit,
  onErrorComponent,
  onFreeComponent,
}: PlanSubscriptionProviderProps) => {

  const [planSelected, _setPlanSelected] = useState<FullPlan>();
  const [priceSelected, setPriceSelected] = useState<PlanPriceType>();
  const [paymentMethod, setPaymentMethod] = useState<EnumType<'PAYMENT_METHOD'> | undefined>(
    availablePaymentMethods.find(pm => pm.enabled)?.payment_method
  );
  const router = useRouter();

  const setPlanSelected = (plan?: FullPlan) => {
    if (plan) {
      setPriceSelected(plan?.prices.find(p => p.billing_type === priceSelected?.billing_type || p.billing_type == 'YEARLY'))
    }
    _setPlanSelected(plan)
  }

  const { errors, isPending, handleSubmit } = useHandleAction({
    action: initiateSubscriptionAction,
    beforeAction: async () => {
      //do something
    },
    afterAction: async (result) => {
      if (result.data) {
    
        if (result.data.ok) {
          if (result.data.redirect_url) router.push(result.data.redirect_url);
          else if (result.inputs?.success_url) router.push(result.inputs.success_url);
        }
        else {
          if (result.inputs?.cancel_url) router.push(result.inputs?.cancel_url)
        }
      }
    }
  });

  const submitSubscription = () => {
    if (!priceSelected || !paymentMethod) return;
    const formData = new FormData();
    formData.set('plan_price_id', priceSelected.id.toString());
    formData.set('payment_method', paymentMethod);
    formData.set('success_url', successUrl);
    formData.set('cancel_url', cancelUrl);
    handleSubmit(formData);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSubscription();
  };

  return (
    <PlanSubscriptionContext.Provider value={{
      planSelected,
      setPlanSelected,
      priceSelected,
      setPriceSelected,
      availablePaymentMethods,
      paymentMethod,
      setPaymentMethod,
      successUrl,
      cancelUrl,
      benefit,
      onErrorComponent,
      onFreeComponent,
      isPending,
      errors,
      submitSubscription,
      onSubmit,
      handleSubmit,
    }}>
      {children}
    </PlanSubscriptionContext.Provider>
  )
}
