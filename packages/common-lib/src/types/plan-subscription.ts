import { PlanSubscriptionSchema } from "../schemas/plan-subscription";
import { PlanPrice } from "./plan-price";

export type PlanSubscription = Omit<PlanSubscriptionSchema, 'created_at' | 'updated_at'>;

export type FullPlanSubscription = PlanSubscription & {
  plan_price: PlanPrice & {
    plan: {
      id: number;
      stripe_id: string | null;
      paypal_id: string | null;
      is_active: boolean;
      name: string;
      base_price: number;
      is_popular: boolean;
      is_free: boolean;
    };
  };
};
