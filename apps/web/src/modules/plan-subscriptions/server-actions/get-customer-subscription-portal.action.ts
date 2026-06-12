"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import * as z from "zod";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import planSubscriptionsService from "../plan-subscriptions.service";

const customerPortalSchema = z.object({
  return_url: z.url(),
});

type CustomerPortalInput = z.infer<typeof customerPortalSchema>;
type CustomerPortalResult = { url: string };

export const getCustomerSubscriptionPortalAction = async (
  returnUrl: string,
): Promise<ActionReturn<CustomerPortalResult, CustomerPortalInput>> => {
  const validated = customerPortalSchema.safeParse({ return_url: returnUrl });

  if (!validated.success) {
    return {
      data: null,
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      inputs: { return_url: returnUrl },
    };
  }

  try {
    const result = await planSubscriptionsService.portal(validated.data);

    if (result.data && !result.error) {
      return {
        data: result.data,
        errors: null,
        inputs: validated.data,
      };
    }

    return {
      data: null,
      errors: getFriendlyApiErrors(result),
      inputs: validated.data,
    };
  } catch (e) {
    console.error("Error during getCustomerSubscriptionPortalAction", e);
    return {
      data: null,
      errors: ["Something went wrong. Please try again later."],
      inputs: validated.data,
    };
  }
};
