import { PaymentMethodSchema } from "../schemas/payment-method";

export type PaymentMethod = Omit<PaymentMethodSchema, 'created_at' | 'updated_at'>;

export type PaymentMethodIndexRequest = {
    enabled?: boolean;
  };