import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";
import { serverEnv } from "@/env/server";
import type { Translator } from "@/lib/validation/zod-helpers";

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

const appOriginUrl = (t: Translator) =>
  z.url().refine(isSameOriginAsApp, {
    message: t("validation.subscription.urlMustBeAppOrigin"),
  });

export const initiateSubscriptionSchema = (t: Translator) =>
  z.object({
    plan_price_id: z.number(),
    payment_method: z.enum(ENUMS.PAYMENT_METHOD),
    success_url: appOriginUrl(t),
    cancel_url: appOriginUrl(t),
    benefit_id: z.number().int().positive().optional(),
  });

export type InitiateSubscriptionSchemaType = z.infer<
  ReturnType<typeof initiateSubscriptionSchema>
>;
