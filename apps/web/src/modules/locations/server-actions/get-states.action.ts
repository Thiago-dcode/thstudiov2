'use server'

import { ActionReturn } from '@repo/common-lib/types/response'
import { State, StateIndexRequest } from '@repo/common-lib/types/location'
import locationService from '../location.service'
import { getFriendlyApiErrors } from '@/modules/auth/helpers'

export const getStatesAction = async (
  params?: StateIndexRequest,
): Promise<ActionReturn<State[], undefined>> => {
  const result = await locationService.getStates(params)

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
