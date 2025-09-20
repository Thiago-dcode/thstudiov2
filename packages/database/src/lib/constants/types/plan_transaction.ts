import { EnumType } from './database';

// Plan transaction type based on the user_plan_transactions table structure
export type PlanTransaction = {
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

// Input types for creating/updating plan transactions
export type CreatePlanTransactionInput = Omit<
  PlanTransaction,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePlanTransactionInput = Partial<CreatePlanTransactionInput>;


