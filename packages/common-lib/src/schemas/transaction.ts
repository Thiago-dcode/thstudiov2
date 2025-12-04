import { TableColumn } from '../types/database';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';

export type TransactionSchema = {
  id: number;
  transaction_id: string;
  status: EnumType<'TRANSACTION_STATUS'>;
  payment_status: EnumType<'PAYMENT_STATUS'>;
  payment_method: EnumType<'PAYMENT_METHOD'>;
  product_type: EnumType<'PRODUCT_TYPE'>;
  amount: number;
  user_id: number;
  plan_price_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export type TransactionWithoutTimestampsSchema = Omit<TransactionSchema, 'created_at' | 'updated_at'>;

const tablesTransaction = [TABLES_ENUM.TRANSACTIONS] as const;
export type TransactionColumns = TableColumn<typeof tablesTransaction, TransactionWithoutTimestampsSchema>;

export type CreateTransactionInput = Omit<
  TransactionSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateTransactionInput = Partial<CreateTransactionInput>;


