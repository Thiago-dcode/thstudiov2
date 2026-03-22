'use server'

import { ActionReturn } from '@repo/common-lib/types/response'
import { City, CityIndexRequest } from '@repo/common-lib/types/location'
import locationService from '../location.service'
import { getFriendlyApiErrors } from '@/modules/auth/helpers'

export const getCitiesAction = async (
  params?: CityIndexRequest,
): Promise<ActionReturn<City[], undefined>> => {
  const result = await locationService.getCities(params)

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
