"use server";

import type {
  Country,
  CountryIndexRequest,
} from "@repo/common-lib/types/location";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import locationService from "../location.service";

export const getCountriesAction = async (
  params?: CountryIndexRequest,
): Promise<ActionReturn<Country[], undefined>> => {
  const result = await locationService.getCountries(params);

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
