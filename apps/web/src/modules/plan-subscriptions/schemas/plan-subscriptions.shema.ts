import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";

export const initiateSubscriptionSchema = z.object({
  plan_price_id: z.number(),
  payment_method: z.enum(ENUMS.PAYMENT_METHOD),
  success_url: z.url(),
  cancel_url: z.url(),
  benefit_id: z.number().int().positive().optional(),
});

export type InitiateSubscriptionSchemaType = z.infer<
  typeof initiateSubscriptionSchema
>;
