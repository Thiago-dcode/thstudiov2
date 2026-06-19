"use server";

import type { City, CityIndexRequest } from "@repo/common-lib/types/location";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import locationService from "../location.service";

export const getCitiesAction = async (
  params?: CityIndexRequest,
): Promise<ActionReturn<City[], undefined>> => {
  const result = await locationService.getCities(params);

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
