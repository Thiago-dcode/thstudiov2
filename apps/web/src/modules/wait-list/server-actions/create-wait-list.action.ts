'use server';

import { ActionReturn } from "@repo/common-lib/types/response";
import { WaitList } from "@repo/common-lib/types/wait-list";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import waitListService from "../wait-list.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { createWaitListSchema } from "../schemas/wait-list.schema";

export const createWaitListAction = async (formData: FormData): Promise<ActionReturn<WaitList, any>> => {
  const rawData = {
    email: formData.get('email') as string,
  };

  trimValues(rawData, { deep: true });

  const validated = createWaitListSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      data: null,
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      inputs: rawData,
    };
  }

  const result = await waitListService.create({
    email: validated.data.email,
  });

  if (result.error || result.data === null) {
    return {
      data: null,
      errors: getFriendlyApiErrors(result),
      inputs: rawData,
    };
  }

  return {
    data: result.data,
    errors: null,
    inputs: rawData,
  };
};
