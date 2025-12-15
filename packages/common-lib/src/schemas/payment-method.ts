import { TableColumn } from '../types/database';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';

export type PaymentMethodSchema = {
  id: number;
  payment_method: EnumType<'PAYMENT_METHOD'>;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PaymentMethodWithoutTimestampsSchema = Omit<PaymentMethodSchema, 'created_at' | 'updated_at'>;

const tablesPaymentMethod = [TABLES_ENUM.PAYMENT_METHODS] as const;
export type PaymentMethodColumns = TableColumn<typeof tablesPaymentMethod, PaymentMethodWithoutTimestampsSchema>;

// ============================================
// Input types
// ============================================

export type CreatePaymentMethodInput = Omit<
  PaymentMethodSchema,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdatePaymentMethodInput = Partial<CreatePaymentMethodInput>;
