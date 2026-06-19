import type { PlanPrice as PlanPriceType } from "@repo/common-lib/types/plan";
import { getLowestMontlyPrice } from "@repo/common-lib/utils/calculatePrice";

export const PlanPrice = ({
 prices,
 isFree,
}: {
 prices: PlanPriceType[];
 isFree: boolean;
}) => {
 return (
 <div className="flex items- gap-1 w-full ">
 {isFree ? (
 <span className="text-3xl font-bold text-text">Free</span>
 ) : (
 <>
 <span className="text-sm text-text-muted">from</span>
 <span className="text-3xl font-bold text-text">
 €{getLowestMontlyPrice(prices)?.toFixed(2) || "0.00"}
 </span>
 <span className="text-sm text-text-muted self-end">/month</span>
 </>
 )}
 </div>
 );
};
