import type { PlanPrice } from "@repo/common-lib/types/plan";
import {
  getPurchasablePrices,
  toMinorUnits,
} from "@repo/common-lib/utils/calculatePrice";

/**
 * How many months the yearly price gives away against paying monthly ("pay 10, get 12" = 2),
 * from the active MONTHLY and YEARLY rows. Null unless it is a whole number of months, so the
 * UI only says "N months free" when it is literally true (it falls back to the percent).
 */
export const getFreeMonths = (prices: PlanPrice[]): number | null => {
  const purchasable = getPurchasablePrices(prices);
  const monthly = purchasable.find((price) => price.billing_type === "MONTHLY");
  const yearly = purchasable.find((price) => price.billing_type === "YEARLY");
  if (!monthly || !yearly || toMinorUnits(monthly.price) <= 0) return null;

  const months = 12 - toMinorUnits(yearly.price) / toMinorUnits(monthly.price);
  const whole = Math.round(months);
  return whole >= 1 && Math.abs(months - whole) < 0.001 ? whole : null;
};
