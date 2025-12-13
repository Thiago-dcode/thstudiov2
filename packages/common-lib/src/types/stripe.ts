import { EnumType } from "../constants/enums";

export type StripeError = {
    type: EnumType<'STRIPE_ERROR'>;
    rawType: EnumType<'STRIPE_RAW_ERROR_TYPE'>;
    code: string | null;
    message: string;
    param: string | null;
    statusCode: number;
    declineCode: string | null;
    isRetryable: boolean;
  }