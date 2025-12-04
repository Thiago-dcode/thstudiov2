import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from '../types/database';
import { EnumType } from '@repo/common-lib/constants/enums';
// Base Plan type based on the plans table structure
export type PlanSchema = {
  id: number;
  stripe_id:string | null,
  paypal_id:string |null,
  name: string;
  short_description:string
  description: string;
  logo: string | null;
  base_price: number;
  is_active: boolean;
  is_popular:boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects: number;
  max_portfolios: number;
  max_services: number;
  max_clients: number;
  powered_by_ai: boolean;
  allow_media_compression:boolean;
  limit_write_storage_per_day: number;
  created_at: Date;
  updated_at: Date;
};

// Plan price type based on the plan_prices table structure
export type PlanPriceSchema = {
  id: number;
  stripe_id:string,
  paypal_id:string,
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
  short_description:string;
  description: string;
  plan_id: number;
  language_code: EnumType<'LANGUAGE_CODE'>;
};

// ✅ Only prefix columns that collide between plans and plan_prices
export type PlanWithPricesSchema = PlanSchema & {
  
  pp_id: number;              
  pp_created_at: Date;       
  pp_updated_at: Date;       
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPES'>;
};

const tablesPlanWithPrices = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES] as const;
export type PlanWithPricesColumns = TableColumn<typeof tablesPlanWithPrices, PlanWithPricesSchema>;


export type FullPlanSchema = PlanWithPricesSchema & {
  pt_id: number;                   
  pt_name: string;  
  pt_short_description:string;               
  pt_description: string;          
  pt_plan_id: number;              
  language_code: EnumType<'LANGUAGE_CODE'>;
};

const tablesFullPlan = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.PLAN_TRANSLATIONS] as const;
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
