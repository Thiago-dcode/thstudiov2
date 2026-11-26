import { PURCHASABLE_BILLING_TYPES } from "../constants/plan";
import { PlanPrice } from "../types/plan";

/**
 * `plan_prices.price` is the total billed per period (a YEARLY row holds the yearly amount).
 * It is a float column, so compare amounts in minor units, never with `===`.
 */
export const toMinorUnits = (amount: number): number => Math.round(amount * 100);

export const getMonthlyPrice = (price: PlanPrice) => {
    switch (price.billing_type) {
        case 'MONTHLY':
            return price.price;
        case 'QUARTERLY':
            return price.price / 3;
        case 'YEARLY':
            return price.price / 12;
    }
    return price.price
}
export const getLowestMontlyPrice = (prices:PlanPrice[]) =>{
    const yearlyPrice = prices.find(price => price.billing_type === 'YEARLY');
  const lowestPrice = yearlyPrice || prices[0];
  let monthlyPrice = lowestPrice.price;
  switch (lowestPrice.billing_type) {
    case 'QUARTERLY':
      monthlyPrice = lowestPrice.price / 3;
      break;
    case 'YEARLY':
      monthlyPrice = lowestPrice.price / 12;
      break;
  }
  return monthlyPrice;
}

const isPurchasable = (price: PlanPrice) =>
  price.is_active && (PURCHASABLE_BILLING_TYPES as readonly string[]).includes(price.billing_type);

/** The prices a new subscription can be bought on (active, MONTHLY/YEARLY), in display order. */
export const getPurchasablePrices = (prices: PlanPrice[]): PlanPrice[] =>
  prices
    .filter(isPurchasable)
    .sort(
      (a, b) =>
        (PURCHASABLE_BILLING_TYPES as readonly string[]).indexOf(a.billing_type) -
        (PURCHASABLE_BILLING_TYPES as readonly string[]).indexOf(b.billing_type),
    );

export type YearlySaving = {
  /** The amount billed once a year. */
  yearlyTotal: number;
  /** `yearlyTotal / 12`, rounded to cents. */
  monthlyEquivalent: number;
  /** Whole percent saved against paying monthly for twelve months. */
  percent: number;
};

/**
 * What paying yearly saves, from the active MONTHLY and YEARLY rows. Null when either is
 * missing or yearly is not actually cheaper.
 */
export const getYearlySaving = (prices: PlanPrice[]): YearlySaving | null => {
  const purchasable = getPurchasablePrices(prices);
  const monthly = purchasable.find((price) => price.billing_type === 'MONTHLY');
  const yearly = purchasable.find((price) => price.billing_type === 'YEARLY');
  if (!monthly || !yearly || monthly.price <= 0) return null;

  const percent = Math.round((1 - yearly.price / (monthly.price * 12)) * 100);
  if (percent <= 0) return null;

  return {
    yearlyTotal: toMinorUnits(yearly.price) / 100,
    monthlyEquivalent: toMinorUnits(yearly.price / 12) / 100,
    percent,
  };
};
