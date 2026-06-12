"use server";

import type { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import userBenefitService from "../user-benefit.service";

export const getUserBenefitAction = async (
  id: number,
): Promise<ActionReturn<BenefitWithRedeemed, undefined>> => {
  const result = await userBenefitService.getByUserId(id);

  if (result.data) {
    return {
      data: result.data,
      errors: null,
    };
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(result),
  };
};
