'use client'

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { getMonthlyPrice } from "@repo/common-lib/utils/calculatePrice"
import { PlanFeatures } from "@/modules/plans/components/plan.features";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import { CircleSelect } from "@repo/ui/components/custom/CircleSelect";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion";
import { UsePlanSubscription } from "../providers/plan-subscription.provider";
import { AssetComponent } from "@/lib/components/asset-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { initiateSubscriptionAction } from "../server-actions/initiate-subscription.action";
import { PaymentMethod } from "@repo/common-lib/types/payment-method";
import { EnumType } from "@repo/common-lib/constants/enums";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

type ChangeSubscriptionDialogProps = {
  availablePaymentMethods: PaymentMethod[];
  successUrl: string,
  cancelUrl: string,
  onErrorComponent: ReactNode,
  onFreeComponent: ReactNode
}

export const ChangeSubscriptionDialog = ({ availablePaymentMethods, successUrl, cancelUrl, onErrorComponent,onFreeComponent }: ChangeSubscriptionDialogProps) => {
  const { planSelected, setPlanSelected, setPriceSelected, priceSelected } = UsePlanSubscription()
  const [paymentMethod, setPaymentMethod] = useState<EnumType<'PAYMENT_METHOD'> | undefined>(availablePaymentMethods.find(pm => pm.enabled)?.payment_method);
  const router = useRouter();
  const { errors, isPending,  handleSubmit } = useHandleAction({
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
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitSubscription();
  };

  if (isPending) {
    return (
      <Dialog open={true}>
        <DialogContent className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner className="size-12" />
            <p className="text-text-muted">Processing...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (errors && errors.length > 0) {
    return (
      <Dialog open={true}>
        <DialogContent className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-red-500/10">
              <svg className="size-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-semibold text-red-500">
              Something went wrong
            </DialogTitle>
            <div className="flex flex-col gap-2">
              {errors.map((error, index) => (
                <p key={index} className="text-text-muted">{error}</p>
              ))}
            </div>
            <div className="flex flex-col gap-3 w-full">
              {onErrorComponent}
          </div>
        </div>
      </DialogContent>
      </Dialog >
    );
  }
return (<Dialog onOpenChange={(value) => {
  if (!value) setPlanSelected(undefined)
}} open={!!planSelected}>
  <DialogContent className={cn(" w-full lg:w-[1000px] h-full lg:h-fit p-0 overflow-y-auto",
    {
      "w-4/5 lg:w-fit lg:max-w-[500px] h-fit max-h-[90vh]": planSelected?.is_free
    }
  )}>
    {planSelected && <div className="flex lg:flex-row flex-col items-center justify-between">

      <div className={cn("w-full lg:max-w-2/4 flex flex-col items-start justify-start gap-8 p-8 lg:h-full", {
        "max-w-full w-full lg:max-w-full": planSelected.is_free
      })}>
        <div className="flex flex-col items-start justify-start gap-2 w-full">
          <DialogTitle className="text-2xl font-semibold">{planSelected.translation?.name}</DialogTitle>
          <p className="w-full">{planSelected.translation?.description}</p>
        </div>
        <div className="hidden lg:flex flex-col items-start justify-start gap-2">
          <p className="text-text-muted text-lg">This plan includes: </p>
          <PlanFeatures plan={planSelected} />
        </div>
        <Accordion className="lg:hidden w-full border-b-0" type="single" collapsible>
          <AccordionItem value="features" className="w-full border-b-0">
            <AccordionTrigger>
              <p className="text-text-muted text-lg">This plan includes: </p>
            </AccordionTrigger>
            <AccordionContent>
              <PlanFeatures plan={planSelected} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {planSelected.is_free ?<>{onFreeComponent}</>:null}

      </div>

      {!planSelected.is_free ? <div className="flex flex-col p-8 gap-4 items-center justify-between w-full h-full bg-fg-1">
        <div className="flex flex-col gap-3 w-full">
          <h4 className="text-sm font-semibold text-text">Billing Cycle</h4>
          <div className="flex flex-col items-start justify-start gap-2 w-full">
            {planSelected.prices.map(price => {
              return <Button onClick={() => {
                setPriceSelected(price)
              }} key={price.billing_type} variant={'ghost'} className={cn(" border-2 rounded-md p-3 w-full flex items-center justify-start", {
                "text-text border-text": priceSelected?.id === price.id
              })}><div className="flex items-center justify-start gap-2"> <CircleSelect selected={priceSelected?.id === price.id} /><p>{price.billing_type}</p></div></Button>
            })}
          </div>
        </div>
        {
          priceSelected && (
            <div className="flex flex-col gap-4 w-full">
              {/* Price Display */}
              <div className="flex items-start justify-between">
                <p className="font-bold">Total</p>
                <div className="flex flex-col items-end justify-start gap-2">
                  <p className="text-base font-base text-text"><span className="text-sm text-text-muted">{priceSelected.billing_type !== 'MONTHLY' ? '~' : ''} </span>€{getMonthlyPrice(priceSelected)?.toFixed(2)}<span className="text-sm text-text-muted">/month</span></p>
                  {priceSelected.billing_type !== 'MONTHLY' && (

                    <p className="text-base text-text">
                      €{priceSelected.price}
                      <span className="text-sm text-text-muted "> billed {priceSelected.billing_type.toLowerCase()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-3 w-full">
                <h4 className="text-sm font-semibold text-text">Payment Method</h4>
                <div className="flex flex-col gap-2">
                  {availablePaymentMethods.filter(pm => pm.enabled).map(({ payment_method }) => {

                    return <Button key={payment_method}
                      onClick={() => {
                        setPaymentMethod(payment_method)
                      }}
                      variant="ghost"
                      className={cn("border-2 rounded-md p-3 w-full flex items-center justify-start gap-3", {
                        "text-text border-text border-3": payment_method === paymentMethod
                      })}
                    >
                      <CircleSelect selected={paymentMethod === payment_method} />
                      <div className="flex items-center justify-between w-full">
                        <span className="w-20 text-start">{payment_method}</span>
                        <AssetComponent file={`icons/${payment_method.toLowerCase()}.png`} alt={payment_method} className="w-fit h-6 object-contain" />
                      </div>

                    </Button>
                  })}
                </div>
              </div>
            </div>
          )
        }

        {/* Pay Button */}
        {priceSelected && (
          <form onSubmit={onSubmit} className="w-full font-bold lg:static sticky bottom-0 bg-fg-1  p-2">
            <Button type={'submit'} disabled={!priceSelected || !paymentMethod || isPending} variant={'secondary'} className="w-full font-bold rounded-xl">
              Complete Payment
            </Button>
          </form>
        )}
        <AssetComponent file="icons/trust-payment.png" alt="trust payment" height={100} width={300} />

      </div> : null}
    </div>}

  </DialogContent>
</Dialog>)

}