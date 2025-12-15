import { PlanPrice } from "../types/plan";

export const calculatePrice = (price: PlanPrice) => {
    switch (price.billing_type) {
        case 'MONTHLY':
            return price.price;
        case 'QUARTERLY':
            return price.price * 3;
        case 'YEARLY':
            return price.price * 12;
        case 'LIFETIME':
            return price.price * 36;
    }
}
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