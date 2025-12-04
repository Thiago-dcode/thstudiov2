import { PlanSubscriptionSchema } from "../schemas/plan-subscription";
import { BasePlan, PlanPrice, PlanTranslation } from "./plan";

export type PlanSubscription = Omit<PlanSubscriptionSchema, 'created_at' | 'updated_at'>;

export type FullPlanSubscription = PlanSubscription & {
  plan: BasePlan;
  plan_price: PlanPrice;
  plan_translation?: PlanTranslation;
};
