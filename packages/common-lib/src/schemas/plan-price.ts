import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from '../types/database';
import { EnumType } from '@repo/common-lib/constants/enums';

// Plan price type based on the plan_prices table structure
export type PlanPriceSchema = {
  id: number;
  stripe_id: string | null;
  paypal_id: string | null;
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPE'>;
  created_at: Date;
  updated_at: Date;
};

export type PlanPriceWithoutTimestampsSchema = Omit<PlanPriceSchema, 'created_at' | 'updated_at'>;

const tablesPlanPrices = [TABLES_ENUM.PLAN_PRICES] as const;
export type PlanPriceColumns = TableColumn<typeof tablesPlanPrices, PlanPriceWithoutTimestampsSchema>;

// Input types for creating/updating plan prices
export type CreatePlanPriceInput = Omit<PlanPriceSchema, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanPriceInput = Partial<CreatePlanPriceInput>;

// ============================================
// Composite types (PlanPrice + Plan)
// ============================================

// PlanPrice with Plan - only colliding fields prefixed with p_
export type PlanPriceWithPlanSchema = PlanPriceSchema & {
  // Colliding fields (prefixed)
  p_id: number;
  p_stripe_id: string | null;
  p_paypal_id: string | null;
  // Non-colliding fields (no prefix)
  name: string;
  short_description: string;
  base_price: number;
  is_active: boolean;
  is_free: boolean;
};

const tablesPlanPriceWithPlan = [TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.PLANS] as const;
export type PlanPriceWithPlanColumns = TableColumn<typeof tablesPlanPriceWithPlan, Omit<PlanPriceWithPlanSchema, 'created_at' | 'updated_at' >>;


