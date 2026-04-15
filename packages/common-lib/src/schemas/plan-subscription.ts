import { TableColumn } from '../types/database';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';

export type PlanSubscriptionSchema = {
  id: number;
  stripe_id: string | null;
  stripe_item_id: string | null;
  paypal_id: string | null;
  payment_method: EnumType<'PAYMENT_METHOD'>;
  amount: number;
  start_billing_date: Date;
  next_billing_date: Date;
  auto_renewal: boolean;
  user_id: number;
  plan_price_id: number;
  plan_offer_id: number | null;
  is_active: boolean;
  is_trialing: boolean;
  cancel_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type PlanSubscriptionWithoutTimestampsSchema = Omit<PlanSubscriptionSchema, 'created_at' | 'updated_at'>;

const tablesPlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS] as const;
export type PlanSubscriptionColumns = TableColumn<typeof tablesPlanSubscription, PlanSubscriptionWithoutTimestampsSchema>;

// ============================================
// Composite types (PlanSubscription + PlanPrice + Plan)
// ============================================

// Full plan subscription with plan_prices and plans
// Colliding fields prefixed: pp_ for plan_prices, p_ for plans
export type FullPlanSubscriptionSchema = PlanSubscriptionSchema & {
  // plan_prices colliding fields (prefixed with pp_)
  pp_id: number;
  pp_stripe_id: string | null;
  pp_paypal_id: string | null;
  // plan_prices non-colliding fields
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPE'>;
  // plans colliding fields (prefixed with p_)
  p_id: number;
  p_stripe_id: string | null;
  p_paypal_id: string | null;
  p_is_active: boolean;
  // plans non-colliding fields
  name: string;
  base_price: number;
  is_popular: boolean;
  is_free: boolean;
  top_tier: boolean;
};

export type FullPlanSubscriptionWithoutTimestampsSchema = Omit<FullPlanSubscriptionSchema, 'created_at' | 'updated_at'>;

const tablesFullPlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.PLANS] as const;
export type FullPlanSubscriptionColumns = TableColumn<typeof tablesFullPlanSubscription, FullPlanSubscriptionWithoutTimestampsSchema>;

// ============================================
// Input types
// ============================================

export type CreatePlanSubscriptionInput = Omit<
  PlanSubscriptionSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanSubscriptionInput = Partial<CreatePlanSubscriptionInput>;
