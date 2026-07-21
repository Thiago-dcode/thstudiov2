"use server";

import type { State, StateIndexRequest } from "@repo/common-lib/types/location";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import locationService from "../location.service";

export const getStatesAction = async (
  params?: StateIndexRequest,
): Promise<ActionReturn<State[], undefined>> => {
  const result = await locationService.getStates(params);

  if (result.data) {
    return {
      data: result.data,
      errors: null,
    };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};
