import { TABLES_ENUM } from '../constants';
import { TableColumn } from './database';
import { EnumType } from '@repo/common-lib/constants/enums';
// Base Plan type based on the plans table structure
export type PlanSchema = {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  base_price: number;
  is_active: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects_count: number;
  max_clients_count: number;
  max_services_count: number;
  powered_by_ai: boolean;
  limit_storage_requests_per_day: number;
  created_at: Date;
  updated_at: Date;
};

// Plan price type based on the plan_prices table structure
export type PlanPriceSchema = {
  id: number;
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPES'>;
  created_at: Date;
  updated_at: Date;
};

// Plan offer type based on the plan_offers table structure
export type PlanOfferSchema = {
  id: number;
  name: string;
  description: string;
  discount: number;
  is_active: boolean;
  type: EnumType<'PLAN_OFFERS_TYPES'>;
  start_date: Date;
  end_date: Date;
  plan_id: number;
  plan_price_id: number | null;
  created_at: Date;
  updated_at: Date;
};

// Plan translation type based on the plan_translations table structure
export type PlanTranslationSchema = {
  id: number;
  name: string;
  description: string;
  plan_id: number;
  language_code: EnumType<'LANGUAGE_CODE'>;
};

// ✅ Only prefix columns that collide between plans and plan_prices
export type PlanWithPricesSchema = {
  // From plans (main table)
  id: number;
  name: string;
  description: string;
  logo: string | null;
  base_price: number;
  is_active: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects_count: number;
  max_clients_count: number;
  max_services_count: number;
  powered_by_ai: boolean;
  limit_storage_requests_per_day: number;
  created_at: Date;
  updated_at: Date;
  
  // From plan_prices (only colliding columns prefixed)
  pp_id: number;              // COLLISION: both have 'id'
  pp_created_at: Date;        // COLLISION: both have 'created_at'
  pp_updated_at: Date;        // COLLISION: both have 'updated_at'
  // Non-colliding columns
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPES'>;
};

const tablesPlanWithPrices = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES] as const;
export type PlanWithPricesColumns = TableColumn<typeof tablesPlanWithPrices, PlanWithPricesSchema>;


// ✅ Only prefix columns that collide across all 4 tables
export type FullPlanSchema = PlanWithPricesSchema & {
  // From plan_offers (only colliding columns prefixed with 'po_')
  po_id: number;                   // COLLISION: all 4 tables have 'id'
  po_name: string;                 // COLLISION: plans, plan_offers, plan_translations have 'name'
  po_description: string;          // COLLISION: plans, plan_offers, plan_translations have 'description'
  po_is_active: boolean;           // COLLISION: plans, plan_offers have 'is_active'
  po_plan_id: number;              // COLLISION: plan_prices, plan_offers, plan_translations have 'plan_id'
  po_created_at: Date;             // COLLISION: all tables have 'created_at'
  po_updated_at: Date;             // COLLISION: all tables have 'updated_at'
  // Non-colliding columns from plan_offers (no prefix needed)
  discount: number;
  type: EnumType<'PLAN_OFFERS_TYPES'>;
  start_date: Date;
  end_date: Date;
  plan_price_id: number | null;
  
  // From plan_translations (only colliding columns prefixed with 'pt_')
  pt_id: number;                   // COLLISION: all 4 tables have 'id'
  pt_name: string;                 // COLLISION: plans, plan_offers, plan_translations have 'name'
  pt_description: string;          // COLLISION: plans, plan_offers, plan_translations have 'description'
  pt_plan_id: number;              // COLLISION: plan_prices, plan_offers, plan_translations have 'plan_id'
  // Non-colliding columns from plan_translations (no prefix needed)
  language_code: EnumType<'LANGUAGE_CODE'>;
};

const tablesFullPlan = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.PLAN_OFFERS, TABLES_ENUM.PLAN_TRANSLATIONS] as const;
export type FullPlanColumns = TableColumn<typeof tablesFullPlan, FullPlanSchema>;
// Input types for creating/updating plans
export type CreatePlanInput = Omit<PlanSchema, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanInput = Partial<CreatePlanInput>;

export type CreatePlanPriceInput = Omit<
  PlanPriceSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanPriceInput = Partial<CreatePlanPriceInput>;

export type CreatePlanOfferInput = Omit<
  PlanOfferSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanOfferInput = Partial<CreatePlanOfferInput>;

export type CreatePlanTranslationInput = Omit<PlanTranslationSchema, 'id'>;
export type UpdatePlanTranslationInput = Partial<CreatePlanTranslationInput>;

export type CreatePlanWithDetailsInput = CreatePlanInput & {
  prices: CreatePlanPriceInput[];
  translations: CreatePlanTranslationInput[];
};
export type UpdatePlanWithDetailsInput = Partial<CreatePlanWithDetailsInput>;

export type CreatePlanWithTranslationsInput = CreatePlanInput & {
  translations: CreatePlanTranslationInput[];
};
export type UpdatePlanWithTranslationsInput =
  Partial<CreatePlanWithTranslationsInput>;
