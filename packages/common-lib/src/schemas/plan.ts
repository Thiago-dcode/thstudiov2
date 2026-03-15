import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from '../types/database';
import { EnumType } from '@repo/common-lib/constants/enums';
import {  CreatePlanPriceInput } from "./plan-price";

// Base Plan type based on the plans table structure
export type PlanSchema = {
  id: number;
  stripe_id: string | null;
  paypal_id?: string | null;
  name: string;
  short_description: string;
  description: string;
  logo: string | null;
  base_price: number;
  is_active: boolean;
  is_popular: boolean;
  is_free: boolean;
  max_media_size: number;
  max_projects: number;
  max_portfolios: number;
  max_services: number;
  max_clients: number;
  allow_media_compression: boolean;
  ai_credits: number;
  limit_write_storage_per_day: number;
  created_at: Date;
  updated_at: Date;
};

export type PlanWithoutTimestampsSchema = Omit<PlanSchema, 'created_at' | 'updated_at'>;

const tablesPlans = [TABLES_ENUM.PLANS] as const;
export type PlanColumns = TableColumn<typeof tablesPlans, PlanWithoutTimestampsSchema>;

// Plan translation type based on the plan_translations table structure
export type PlanTranslationSchema = {
  id: number;
  name: string;
  short_description: string;
  description: string;
  plan_id: number;
  language_code: EnumType<'LANGUAGE_CODE'>;
};

// Full plan with prices and translations
export type FullPlanSchema = PlanWithPricesSchema & {
  pt_id: number;
  pt_name: string;
  pt_short_description: string;
  pt_description: string;
  pt_plan_id: number;
  language_code: EnumType<'LANGUAGE_CODE'>;
};
const tablesPlanTranslations = [TABLES_ENUM.PLAN_TRANSLATIONS] as const;
export type PlanTranslationColumns = TableColumn<typeof tablesPlanTranslations, PlanTranslationSchema>;

// Plan with prices - prefixed columns to avoid collisions
export type PlanWithPricesSchema = PlanSchema & {
  pp_id: number;
  pp_stripe_id: string | null;
  pp_paypal_id?: string | null;
  pp_created_at: Date;
  pp_updated_at: Date;
  plan_id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPE'>;
};

const tablesPlanWithPrices = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES] as const;
export type PlanWithPricesColumns = TableColumn<typeof tablesPlanWithPrices, PlanWithPricesSchema>;

const tablesFullPlan = [TABLES_ENUM.PLANS, TABLES_ENUM.PLAN_PRICES, TABLES_ENUM.PLAN_TRANSLATIONS] as const;
export type FullPlanColumns = TableColumn<typeof tablesFullPlan, FullPlanSchema>;

// Input types for creating/updating plans
export type CreatePlanInput = Omit<PlanSchema, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlanInput = Partial<CreatePlanInput>;

export type CreatePlanTranslationInput = Omit<PlanTranslationSchema, 'id'>;
export type UpdatePlanTranslationInput = Partial<CreatePlanTranslationInput>;

export type CreatePlanWithTranslationsInput = CreatePlanInput & {
  translations: CreatePlanTranslationInput[];
};
export type UpdatePlanWithTranslationsInput = Partial<CreatePlanWithTranslationsInput>;
export type CreatePlanWithDetailsInput = CreatePlanInput & {
  prices: CreatePlanPriceInput[];
  translations: CreatePlanTranslationInput[];
};
export type UpdatePlanWithDetailsInput = Partial<CreatePlanWithDetailsInput>;
