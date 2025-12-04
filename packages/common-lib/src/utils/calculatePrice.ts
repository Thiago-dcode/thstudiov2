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