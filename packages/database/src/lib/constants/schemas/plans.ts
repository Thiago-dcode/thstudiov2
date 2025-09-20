import { EnumType } from './database';

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




// Plan with prices (for pricing queries)
export type PlanWithPrices = PlanSchema & PlanPriceSchema;

// Plan with offers (for offers queries)
export type PlanWithOffers = PlanSchema & PlanOfferSchema;

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
