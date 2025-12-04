import { EnumType } from "../constants/enums";
import { PlanSchema, PlanTranslationSchema } from "../schemas/plan";
import { PlanPrice } from "./plan-price";

export type BasePlan = Omit<PlanSchema, 'created_at' | 'updated_at'>;

export type PlanTranslation = Omit<PlanTranslationSchema, 'language_code'> & {
  code: EnumType<'LANGUAGE_CODE'>;
};

export type FullPlan = Omit<BasePlan, 'stripe_id' | 'paypal_id'> & {
  prices: Omit<PlanPrice, 'stripe_id' | 'paypal_id'>[];
  translation?: PlanTranslation;
};

export type PlanIndexRequest = {
  is_active?: boolean;
};

// Re-export for convenience
export type { PlanPrice } from "./plan-price";
