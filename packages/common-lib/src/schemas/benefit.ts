import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== BENEFIT BASE SCHEMA ====================
export type BenefitSchema = {
  id: number;
  type: EnumType<'BENEFIT_TYPE'>;
  name: string;
  trial_days: number;
  stripe_coupon_id: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type BenefitSchemaWithoutTimestamps = Omit<BenefitSchema, 'created_at' | 'updated_at'>;

const tablesBenefit = [TABLES_ENUM.BENEFITS] as const;
export type BenefitSchemaColumns = TableColumn<typeof tablesBenefit, BenefitSchemaWithoutTimestamps>;


// ==================== USER_BENEFITS (pivot) ====================
export type UserBenefitSchema = {
  id: number;
  user_id: number;
  benefit_id: number;
  redeemed: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FullUserBenefitSchema = BenefitSchemaWithoutTimestamps & {
  u_id: number,
  redeemed: boolean


}
const fullTablesBenefit = [TABLES_ENUM.BENEFITS, TABLES_ENUM.USER_BENEFITS] as const;
export type FullBenefitSchemaColumns = TableColumn<typeof fullTablesBenefit, FullUserBenefitSchema>;

export type UserBenefitSchemaWithoutTimestamps = Omit<UserBenefitSchema, 'created_at' | 'updated_at'>;

const tablesUserBenefit = [TABLES_ENUM.USER_BENEFITS] as const;
export type UserBenefitSchemaColumns = TableColumn<
  typeof tablesUserBenefit,
  UserBenefitSchemaWithoutTimestamps
>;
