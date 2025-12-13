import { PlanPrice as PlanPriceType } from "@repo/common-lib/types/plan";

export const PlanPrice = ({ prices, isFree }: {
  prices: PlanPriceType[],
  isFree: boolean
}) => {
  const yearlyPrice = prices.find(price => price.billing_type === 'YEARLY');
  const lowestPrice = yearlyPrice || prices[0];
  return <div className="flex items- gap-1 w-full ">
    {isFree ? (
      <span className="text-3xl font-bold text-text">Free</span>
    ) : (
      <>
        <span className="text-sm text-text-muted">from</span>
        <span className="text-3xl font-bold text-text">
          €{lowestPrice?.price?.toFixed(2) || "0.00"}
        </span>
        <span className="text-sm text-text-muted self-end">
          /month
        </span>
      </>
    )}
  </div>
}