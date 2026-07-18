import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";
import { serverEnv } from "@/env/server";

/**
 * Both URLs are forwarded as-is to the payment provider (Stripe/PayPal) as the
 * post-checkout redirect target, so they must stay same-origin with the app —
 * otherwise a caller could redirect a payer's browser to an attacker domain.
 */
const isSameOriginAsApp = (url: string): boolean => {
  try {
    return new URL(url).origin === new URL(serverEnv.APP_URL).origin;
  } catch {
    return false;
  }
};

const appOriginUrl = () =>
  z
    .url()
    .refine(isSameOriginAsApp, { message: "URL must be on the app's origin" });

export const initiateSubscriptionSchema = z.object({
  plan_price_id: z.number(),
  payment_method: z.enum(ENUMS.PAYMENT_METHOD),
  success_url: appOriginUrl(),
  cancel_url: appOriginUrl(),
  benefit_id: z.number().int().positive().optional(),
});

export type InitiateSubscriptionSchemaType = z.infer<
  typeof initiateSubscriptionSchema
>;
