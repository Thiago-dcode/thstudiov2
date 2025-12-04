import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from '../types/database';
import { EnumType } from '@repo/common-lib/constants/enums';

// Base PlanSubscription type based on the plan_subscriptions table structure
export type PlanSubscriptionSchema = {
  id: number;
  stripe_id?: string | null;
  paypal_id?: string | null;
  start_date: Date;
  plan_id: number;
  plan_price_id: number;
  plan_transaction_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PlanSubscriptionSchemaWithoutTimestamps = Omit<PlanSubscriptionSchema, 'created_at' | 'updated_at'>;

const tablesPlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS] as const;
export type PlanSubscriptionSchemaColumns = TableColumn<typeof tablesPlanSubscription, PlanSubscriptionSchemaWithoutTimestamps>;

// Input types for creating/updating plan subscriptions
export type CreatePlanSubscriptionInput = Omit<PlanSubscriptionSchema, 'id' | 'created_at' | 'updated_at' | 'start_date'> & {
  start_date?:Date
};
export type UpdatePlanSubscriptionInput = Partial<CreatePlanSubscriptionInput>;

// Extended type with related plan data
export type PlanSubscriptionWithPlanSchema = PlanSubscriptionSchema & {
  // From plans (only colliding columns prefixed)
  plan_name: string;
  plan_short_description: string;
  plan_description: string;
  plan_logo: string | null;
  base_price: number;
  plan_is_active: boolean;
  is_popular: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects: number;
  max_portfolios: number;
  max_services: number;
  max_clients: number;
  powered_by_ai: boolean;
  allow_media_compression: boolean;
  limit_write_storage_per_day: number;
};

const tablesPlanSubscriptionWithPlan = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.PLANS] as const;
export type PlanSubscriptionWithPlanColumns = TableColumn<typeof tablesPlanSubscriptionWithPlan, PlanSubscriptionWithPlanSchema>;

// Extended type with plan price data
export type PlanSubscriptionWithPriceSchema = PlanSubscriptionSchema & {
  // From plan_prices (only colliding columns prefixed)
  pp_id: number;
  pp_stripe_id: string;
  pp_created_at: Date;
  pp_updated_at: Date;
  price: number;
  billing_type: string;
};

const tablesPlanSubscriptionWithPrice = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.PLAN_PRICES] as const;
export type PlanSubscriptionWithPriceColumns = TableColumn<typeof tablesPlanSubscriptionWithPrice, PlanSubscriptionWithPriceSchema>;

// Full plan subscription with both plan and price details
export type FullPlanSubscriptionSchema = PlanSubscriptionSchema & {
  // From plans
  plan_name: string;
  plan_short_description: string;
  plan_description: string;
  plan_logo: string | null;
  base_price: number;
  plan_is_active: boolean;
  is_popular: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects: number;
  max_portfolios: number;
  max_services: number;
  max_clients: number;
  powered_by_ai: boolean;
  allow_media_compression: boolean;
  limit_write_storage_per_day: number;
  // From plan_prices
  pp_id: number;
  pp_stripe_id: string;
  pp_created_at: Date;
  pp_updated_at: Date;
  price: number;
  billing_type: string;
};

const tablesFullPlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES] as const;
export type FullPlanSubscriptionColumns = TableColumn<typeof tablesFullPlanSubscription, FullPlanSubscriptionSchema>;

// Extended type with transaction data
export type PlanSubscriptionWithTransactionSchema = PlanSubscriptionSchema & {
  // From user_plan_transactions (only colliding columns prefixed)
  pt_id: number;
  transaction_id: string;
  status: EnumType<'TRANSACTION_STATUS'>;
  payment_status: EnumType<'PAYMENT_STATUS'>;
  payment_method: EnumType<'PAYMENT_METHOD'> | null;
  amount: number;
  user_id: number;
  pt_plan_price_id: number;
  plan_offer_id: number | null;
  pt_created_at: Date;
  pt_updated_at: Date;
};

const tablesPlanSubscriptionWithTransaction = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.USER_PLAN_TRANSACTIONS] as const;
export type PlanSubscriptionWithTransactionColumns = TableColumn<typeof tablesPlanSubscriptionWithTransaction, PlanSubscriptionWithTransactionSchema>;

// Complete plan subscription with plan, price, and transaction details
export type CompletePlanSubscriptionSchema = PlanSubscriptionSchema & {
  // From plans
  plan_name: string;
  plan_short_description: string;
  plan_description: string;
  plan_logo: string | null;
  base_price: number;
  plan_is_active: boolean;
  is_popular: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects: number;
  max_portfolios: number;
  max_services: number;
  max_clients: number;
  powered_by_ai: boolean;
  allow_media_compression: boolean;
  limit_write_storage_per_day: number;
  // From plan_prices
  pp_id: number;
  pp_stripe_id: string;
  pp_created_at: Date;
  pp_updated_at: Date;
  price: number;
  billing_type: string;
  // From user_plan_transactions
  pt_id: number;
  transaction_id: string;
  status: EnumType<'TRANSACTION_STATUS'>;
  payment_status: EnumType<'PAYMENT_STATUS'>;
  payment_method: EnumType<'PAYMENT_METHOD'> | null;
  amount: number;
  user_id: number;
  pt_plan_price_id: number;
  plan_offer_id: number | null;
  pt_created_at: Date;
  pt_updated_at: Date;
};

const tablesCompletePlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS, TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.USER_PLAN_TRANSACTIONS] as const;
export type CompletePlanSubscriptionColumns = TableColumn<typeof tablesCompletePlanSubscription, CompletePlanSubscriptionSchema>;

