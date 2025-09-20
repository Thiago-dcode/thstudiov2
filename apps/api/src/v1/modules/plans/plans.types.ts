import { EnumType } from '@repo/database/schemas/database';

export type BasePlan = {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  base_price: number;
  is_active: boolean;
  is_free: boolean;
};
export type BasePlanPrice = {
  id: number;
  price: number;
  billing_type: EnumType<'BILLING_TYPES'>;
};

export type BasePlanWithPrices = BasePlan & {
  prices: BasePlanPrice[];
};
