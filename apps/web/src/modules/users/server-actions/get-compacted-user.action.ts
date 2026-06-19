"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { CompactUser } from "@repo/common-lib/types/user";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import usersService from "../users.service";

export const getUserCompactedAction = async (
 username: string,
): Promise<ActionReturn<CompactUser, undefined>> => {
 const user = await usersService.getCompact(username);

 if (user.data) {
 return {
 data: user.data,
 errors: null,
 };
 }
 return {
 data: null,
 errors: getFriendlyApiErrors(user),
 };
};
