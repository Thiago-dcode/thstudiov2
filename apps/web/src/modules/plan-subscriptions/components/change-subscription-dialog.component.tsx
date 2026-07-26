"use client";

import { getMonthlyPrice } from "@repo/common-lib/utils/calculatePrice";
import { CircleSelect } from "@repo/ui/components/custom/CircleSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { AssetComponent } from "@/lib/components/asset-component";
import { PlanFeatures } from "@/modules/plans/components/plan.features";
import { UsePlanSubscription } from "../providers/plan-subscription.provider";

export const ChangeSubscriptionDialog = () => {
  const t = useTranslations("changeSubscriptionDialog");
  const tBilling = useTranslations("benefitSubscriptionDialog.billingTypes");
  const {
    planSelected,
    setPlanSelected,
    priceSelected,
    setPriceSelected,
    availablePaymentMethods,
    paymentMethod,
    setPaymentMethod,
    onErrorComponent,
    onFreeComponent,
    isPending,
    errors,
    onSubmit,
  } = UsePlanSubscription();

  if (isPending) {
    return (
      <Dialog open={true}>
        <DialogContent className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner className="size-12" />
            <DialogTitle className="text-text-muted text-base font-normal">
              {t("processing")}
            </DialogTitle>
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
            <div className="flex items-center justify-center size-16 bg-red-500/10">
              <svg
                className="size-8 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-semibold text-red-500">
              {t("errorTitle")}
            </DialogTitle>
            <div className="flex flex-col gap-2">
              {errors.map((error, index) => (
                <p key={index} className="text-text-muted">
                  {error}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-3 w-full">{onErrorComponent}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog
      onOpenChange={(value) => {
        if (!value) setPlanSelected(undefined);
      }}
      open={!!planSelected}
    >
      <DialogContent
        className={cn(" lg:w-[1000px] h-full lg:h-fit p-0 overflow-y-auto", {
          "w-4/5 lg:w-fit lg:max-w-[500px] h-fit max-h-[90vh]":
            planSelected?.is_free,
        })}
      >
        {planSelected && (
          <div className="flex lg:flex-row flex-col items-center justify-between">
            <div
              className={cn(
                "w-full lg:max-w-2/4 flex flex-col items-start justify-start gap-8 p-8 lg:h-full",
                {
                  "max-w-full w-full lg:max-w-full": planSelected.is_free,
                },
              )}
            >
              <div className="flex flex-col items-start justify-start gap-2 w-full">
                <DialogTitle className="text-2xl font-semibold">
                  {planSelected.translation?.name}
                </DialogTitle>
                <p className="w-full">
                  {planSelected.translation?.description}
                </p>
              </div>
              <div className="hidden lg:flex flex-col items-start justify-start gap-2">
                <p className="text-text-muted text-lg">
                  {t("thisPlanIncludes")}
                </p>
                <PlanFeatures plan={planSelected} />
              </div>
              <Accordion
                className="lg:hidden w-full border-b-0"
                type="single"
                collapsible
              >
                <AccordionItem value="features" className="w-full border-b-0">
                  <AccordionTrigger>
                    <p className="text-text-muted text-lg">
                      {t("thisPlanIncludes")}
                    </p>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PlanFeatures plan={planSelected} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {planSelected.is_free ? onFreeComponent : null}
            </div>

            {!planSelected.is_free ? (
              <div className="flex flex-col p-8 gap-4 items-center justify-between w-full h-full bg-fg">
                <div className="flex flex-col gap-3 w-full">
                  <h4 className="text-sm font-semibold text-text">
                    {t("billingCycle")}
                  </h4>
                  <div className="flex flex-col items-start justify-start gap-2 w-full">
                    {planSelected.prices.map((price) => {
                      return (
                        <Button
                          onClick={() => {
                            setPriceSelected(price);
                          }}
                          key={price.billing_type}
                          variant={"ghost"}
                          className={cn(
                            " border-2 p-3 w-full flex items-center justify-start",
                            {
                              "text-text border-text":
                                priceSelected?.id === price.id,
                            },
                          )}
                        >
                          <div className="flex items-center justify-start gap-2">
                            {" "}
                            <CircleSelect
                              selected={priceSelected?.id === price.id}
                            />
                            <p>
                              {tBilling(
                                price.billing_type as
                                  | "MONTHLY"
                                  | "QUARTERLY"
                                  | "YEARLY"
                                  | "LIFETIME",
                              )}
                            </p>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {priceSelected && (
                  <div className="flex flex-col gap-4 w-full">
                    {/* Price Display */}
                    <div className="flex items-start justify-between">
                      <p className="font-bold">{t("total")}</p>
                      <div className="flex flex-col items-end justify-start gap-2">
                        <p className="text-base font-base text-text">
                          <span className="text-sm text-text-muted">
                            {priceSelected.billing_type !== "MONTHLY"
                              ? "~"
                              : ""}{" "}
                          </span>
                          €{getMonthlyPrice(priceSelected)?.toFixed(2)}
                          <span className="text-sm text-text-muted">
                            {t("perMonth")}
                          </span>
                        </p>
                        {priceSelected.billing_type !== "MONTHLY" && (
                          <p className="text-base text-text">
                            €{priceSelected.price}
                            <span className="text-sm text-text-muted ">
                              {" "}
                              {t("billed", {
                                billingType: tBilling(
                                  priceSelected.billing_type as
                                    | "MONTHLY"
                                    | "QUARTERLY"
                                    | "YEARLY"
                                    | "LIFETIME",
                                ),
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex flex-col gap-3 w-full">
                      <h4 className="text-sm font-semibold text-text">
                        {t("paymentMethod")}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {availablePaymentMethods
                          .filter((pm) => pm.enabled)
                          .map(({ payment_method }) => {
                            return (
                              <Button
                                key={payment_method}
                                onClick={() => {
                                  setPaymentMethod(payment_method);
                                }}
                                variant="ghost"
                                className={cn(
                                  "border-2 p-3 w-full flex items-center justify-start gap-3",
                                  {
                                    "text-text border-text border-3":
                                      payment_method === paymentMethod,
                                  },
                                )}
                              >
                                <CircleSelect
                                  selected={paymentMethod === payment_method}
                                />
                                <div className="flex items-center justify-between w-full">
                                  <span className="w-20 text-start">
                                    {payment_method}
                                  </span>
                                  <AssetComponent
                                    file={`icons/${payment_method.toLowerCase()}.png`}
                                    alt={payment_method}
                                    className="w-fit h-6 object-contain"
                                  />
                                </div>
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pay Button */}
                {priceSelected && (
                  <form
                    onSubmit={onSubmit}
                    className="w-full font-bold lg:static sticky bottom-0 bg-fg p-2"
                  >
                    <Button
                      type={"submit"}
                      disabled={!priceSelected || !paymentMethod || isPending}
                      variant={"accent"}
                      className="w-full font-bold"
                    >
                      {t("completePayment")}
                    </Button>
                  </form>
                )}
                <AssetComponent
                  file="icons/trust-payment.png"
                  alt={t("trustPaymentAlt")}
                  height={100}
                  width={300}
                />
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
