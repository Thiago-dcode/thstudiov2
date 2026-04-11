'use server'

import { BenefitWithRedeemed } from "@repo/common-lib/types/benefit"
import { ActionReturn } from "@repo/common-lib/types/response"
import userBenefitService from "../user-benefit.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"


export const getUserBenefitAction = async (id: number): Promise<ActionReturn<BenefitWithRedeemed, undefined>> => {


  const result = await userBenefitService.getByUserId(id);

  if (result.data) {
    return {
      data: result.data,
      errors: null,
    }
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(result),
  }

}