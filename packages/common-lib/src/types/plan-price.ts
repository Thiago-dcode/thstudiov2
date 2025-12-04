import { PlanPriceSchema } from "../schemas/plan-price";

export type PlanPrice = Omit<PlanPriceSchema, 'created_at' | 'updated_at'>;

export type FullPlanPrice = Omit<PlanPrice, 'stripe_id' | 'paypal_id'> & {
  plan: {
    id: number;
    name: string;
    short_description: string;
    base_price: number;
    is_active: boolean;
    is_free: boolean;
  };
};
