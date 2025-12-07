'use client'

import { FullPlan } from "@repo/common-lib/types/plan";
import {PlanPrice as PlanPriceType}from "@repo/common-lib/types/plan-price";
import { createContext, ReactElement, useContext, useState } from "react";
import { calculatePrice } from "@repo/common-lib/utils/calculatePrice"
import { ENUMS, EnumType } from "@repo/common-lib/constants/enums";
import { PlanFeatures } from "./plan.features";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import cardIcon from '@/assets/icons/card.png'
import paypalIcon from '@/assets/icons/paypal.png'
import Image from "next/image";
import { CircleSelect } from "@repo/ui/components/custom/CircleSelect";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion";
type PlanContextType = {
  planSelected?: FullPlan;
  setPlanSelected: (plan: FullPlan) => void

}
const PlanContext = createContext<PlanContextType>({
  setPlanSelected: () => { }
})

export const usePlan = () => useContext(PlanContext);

const loadPaymentMethodIcon = (pm: EnumType<'PAYMENT_METHOD'>) => {
  switch (pm) {
    case 'CARD':
      return cardIcon

    case 'PAYPAL':
      return paypalIcon

  }
}
export const PlanProvider = ({ children }: {
  children: ReactElement
}) => {

  const [planSelected, _setPlanSelected] = useState<FullPlan>();
  const [priceSelected, setPriceSelected] = useState<PlanPriceType>();
  const [paymentMethod, setPaymentMethod] = useState<EnumType<'PAYMENT_METHOD'>>();
  const setPlanSelected = (plan?: FullPlan) => {
    if (plan) {
      setPriceSelected(plan?.prices.find(p => p.billing_type === priceSelected?.billing_type || p.billing_type == 'YEARLY'))
    }
    _setPlanSelected(plan)

  }

  return (
    <PlanContext.Provider value={{
      planSelected,
      setPlanSelected
    }}>
      <Dialog  onOpenChange={(value) => {
        if (!value) setPlanSelected(undefined)
      }} open={!!planSelected}>
        <DialogContent className={cn(" w-4/5 lg:w-[1000px] h-full lg:h-fit p-0 overflow-y-auto",
          {
            "w-4/5 lg:w-fit lg:max-w-[500px] h-fit": planSelected?.is_free
          }
        )}>
          {planSelected && <div className="flex lg:flex-row flex-col items-center justify-between">

            <div className={cn("w-full lg:max-w-2/4 flex flex-col items-start justify-start gap-8 p-8 lg:h-full", {
              "max-w-full w-full": planSelected.is_free
            })}>
              <div className="flex flex-col items-start justify-start gap-2 w-full">
                <DialogTitle className="text-2xl font-semibold">{planSelected.translation?.name}</DialogTitle>
                <p>{planSelected.translation?.description}</p>
              </div>
              <div className="hidden lg:flex flex-col items-start justify-start gap-2">
                <p className="text-text-muted text-lg">This plan includes: </p>
                <PlanFeatures plan={planSelected} />
              </div>
              <Accordion className="lg:hidden w-full border-b-0" type="single" collapsible>
                <AccordionItem  value="features" className="w-full border-b-0">
                  <AccordionTrigger>
                    <p className="text-text-muted text-lg">This plan includes: </p>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PlanFeatures plan={planSelected} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {planSelected.is_free && <Button className="self-center">Continue without benefits</Button>}
            </div>

            {!planSelected.is_free && <div className="flex flex-col p-8 gap-4 items-center justify-between w-full h-full bg-fg-1">
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
                        <p className="text-base font-base text-text">€{priceSelected.price} <span className="text-sm text-text-muted">/month</span></p>
                        {priceSelected.billing_type !== 'MONTHLY' && (
                          <p className="text-base text-text">
                            €{calculatePrice(priceSelected)}
                            <span className="text-sm text-text-muted "> billed {priceSelected.billing_type.toLowerCase()}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex flex-col gap-3 w-full">
                      <h4 className="text-sm font-semibold text-text">Payment Method</h4>
                      <div className="flex flex-col gap-2">
                        {ENUMS.PAYMENT_METHOD.map(pm => {

                          return <Button key={pm}
                            onClick={() => {
                              setPaymentMethod(pm)
                            }}
                            variant="ghost"
                            className={cn("border-2 rounded-md p-3 w-full flex items-center justify-start gap-3", {
                              "text-text border-text border-3": pm === paymentMethod
                            })}
                          >
                            <CircleSelect selected={paymentMethod === pm } />
                            <div className="flex items-center justify-between w-full">
                            <span className="w-20 text-start">{pm}</span>
                            <Image src={loadPaymentMethodIcon(pm)} alt={pm} className="w-fit h-6 object-contain" />
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
              <div className="w-full font-bold lg:static sticky bottom-0 bg-fg-1  p-2">
                  <Button variant={'secondary'} className="w-full font-bold rounded-xl">
                  Complete Payment
                </Button>
              </div>
              )}


            </div>}
          </div>}

        </DialogContent>
      </Dialog>
      {children}
    </PlanContext.Provider>
  )

}

export const PlanHeader = ({ name, description }: {
  name: string,
  description: string
}) => {


  return (
    <div className="flex flex-col items-start gap-1 justify-between w-full">
      <h3 className="text-2xl font-semibold text-text">{name}</h3>
      <p className="mt-1 text-sm text-text-muted">
        {description}
      </p>

    </div>
  )
}

