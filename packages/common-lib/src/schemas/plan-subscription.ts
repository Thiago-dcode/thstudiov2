import { TableColumn } from '../types/database';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';

export type PlanSubscriptionSchema = {
  id: number;
  stripe_id: string | null;
  paypal_id: string | null;
  status: EnumType<'TRANSACTION_STATUS'>;
  payment_status: EnumType<'PAYMENT_STATUS'>;
  payment_method: EnumType<'PAYMENT_METHOD'>;
  amount: number;
  start_billing_date: Date;
  next_billing_date: Date;
  auto_renewal: boolean;
  user_id: number;
  plan_id: number;
  plan_price_id: number;
  plan_offer_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PlanSubscriptionWithoutTimestampsSchema = Omit<PlanSubscriptionSchema, 'created_at' | 'updated_at'>;

const tablesPlanSubscription = [TABLES_ENUM.PLAN_SUBSCRIPTIONS] as const;
export type PlanSubscriptionColumns = TableColumn<typeof tablesPlanSubscription, PlanSubscriptionWithoutTimestampsSchema>;

export type CreatePlanSubscriptionInput = Omit<
  PlanSubscriptionSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanSubscriptionInput = Partial<CreatePlanSubscriptionInput>;
