import { EnumType } from "../constants/enums";
import { PlanSubscriptionSchema } from "../schemas/plan-subscription";
import { FullPlanPrice, PlanPrice } from "./plan-price";
import { StripeError } from "./stripe";

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
      top_tier: boolean;
    };
  };
};

export type InitiateSubscriptionRequest ={
  plan_price_id:number;
  payment_method:EnumType<'PAYMENT_METHOD'>
  success_url:string;
  cancel_url:string;
  benefit_id?: number;
}

export type HandleSubscriptionProcessInput = {
  currentUserSubscription: FullPlanSubscription | null;
  newPlanPrice: FullPlanPrice;
  successUrl: string;
  cancelUrl: string;
  benefit_id?:number
}


export type HandleSubscriptionProcessResponse = {
  ok: boolean;
  message: string;
  redirect_url: string | null;
  paypal_error?: {} | null;
  stripe_error?: StripeError | null;
  retryable:boolean
}
