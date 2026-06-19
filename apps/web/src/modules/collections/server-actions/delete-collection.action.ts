"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import collectionService from "../collection.service";

export const deleteCollectionAction = async (
 id: number,
): Promise<ActionReturn<boolean>> => {
 const response = await collectionService.delete(id);

 if (response.error) {
 return {
 data: null,
 errors: getFriendlyApiErrors(response),
 };
 }

 return {
 data: true,
 errors: null,
 };
};
