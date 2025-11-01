import { TABLES_ENUM } from '../constants/database';
import { TableColumn } from '../types/database';
import { EnumType } from '@repo/common-lib/constants/enums';
export type PlanTransactionSchema = {
  id: number;
  transaction_id: string;
  status: EnumType<'TRANSACTION_STATUS'>;
  payment_status: EnumType<'PAYMENT_STATUS'>;
  payment_method: EnumType<'PAYMENT_METHOD'> | null;
  amount: number;
  user_id: number;
  plan_price_id: number;
  plan_offer_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export type PlanTransactionWithoutTimestampsSchema = Omit<PlanTransactionSchema, 'created_at' | 'updated_at'>;

const tablesPlanTransaction = [TABLES_ENUM.USER_PLAN_TRANSACTIONS] as const;
export type PlanTransactionColumns = TableColumn<typeof tablesPlanTransaction, PlanTransactionWithoutTimestampsSchema>;

export type CreatePlanTransactionInput = Omit<
  PlanTransactionSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanTransactionInput = Partial<CreatePlanTransactionInput>;


