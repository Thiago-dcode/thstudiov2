'use server'

import { getFriendlyApiErrors } from '@/modules/auth/helpers'
import { CategoryBase, CategoryIndexRequest } from '@repo/common-lib/types/category'
import { ActionReturn, Pagination } from '@repo/common-lib/types/response'
import categoriesService from '../categories.service'

export const getAllCategoriesAction = async (
  params?: CategoryIndexRequest,
): Promise<ActionReturn<CategoryBase[], { pagination?: Pagination }>> => {
  const result = await categoriesService.getAll({
    page: 1,
    paginated: true,
    ...params,
  })

  if (result.data) {
    return {
      data: result.data,
      errors: null,
      inputs: { pagination: result.pagination },
    }
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(result),
  }
}
