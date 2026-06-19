"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { WaitListCreateResponse } from "@repo/common-lib/types/wait-list";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import {
 getFriendlyApiErrors,
 getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { createWaitListSchema } from "../schemas/wait-list.schema";
import waitListService from "../wait-list.service";

export const createWaitListAction = async (
 formData: FormData,
): Promise<ActionReturn<WaitListCreateResponse, unknown>> => {
 const rawData = {
 email: formData.get("email") as string,
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
 email: validated.data.email.trim().toLowerCase(),
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
