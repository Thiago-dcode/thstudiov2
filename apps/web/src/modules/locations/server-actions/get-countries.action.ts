'use server'

import { ActionReturn } from '@repo/common-lib/types/response'
import { Country, CountryIndexRequest } from '@repo/common-lib/types/location'
import locationService from '../location.service'
import { getFriendlyApiErrors } from '@/modules/auth/helpers'

export const getCountriesAction = async (
  params?: CountryIndexRequest,
): Promise<ActionReturn<Country[], undefined>> => {
  const result = await locationService.getCountries(params)

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
