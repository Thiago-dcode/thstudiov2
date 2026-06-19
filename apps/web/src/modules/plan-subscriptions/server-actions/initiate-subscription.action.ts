"use server";

import { INITIATE_SUBCRIPTION_COOKIE } from "@repo/common-lib/constants/constants";
import type {
 HandleSubscriptionProcessResponse,
 InitiateSubscriptionRequest,
} from "@repo/common-lib/types/plan-subscription";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { generateUUID } from "@repo/common-lib/utils/generate-uuid";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { encryptObj, getEncryptedJsonCookie } from "@/lib/utils";
import {
 getFriendlyApiErrors,
 getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import planSubscriptionsService from "../plan-subscriptions.service";
import { initiateSubscriptionSchema } from "../schemas/plan-subscriptions.shema";

function parseOptionalPositiveInt(
 formData: FormData,
 key: string,
): number | undefined {
 const raw = formData.get(key);
 if (raw == null || String(raw).trim() === "") return undefined;
 return parseInt(String(raw), 10);
}

export const initiateSubscriptionAction = async (
 formData: FormData,
): Promise<
 ActionReturn<HandleSubscriptionProcessResponse, InitiateSubscriptionRequest>
> => {
 const validated = initiateSubscriptionSchema.safeParse({
 plan_price_id: parseInt(formData.get("plan_price_id") as string, 10),
 payment_method: formData.get("payment_method"),
 success_url: formData.get("success_url"),
 cancel_url: formData.get("cancel_url"),
 benefit_id: parseOptionalPositiveInt(formData, "benefit_id"),
 });

 if (!validated.success) {
 return {
 data: null,
 errors: [],
 inputErrors: getObjErrorFromZod(validated.error),
 inputs: validated.data,
 };
 }

 try {
 const uuid = await generateUUID();
 validated.data.success_url = queryParamBuilder(validated.data.success_url, {
 token: uuid,
 });
 validated.data.cancel_url = queryParamBuilder(validated.data.cancel_url, {
 token: uuid,
 });
 const result = await planSubscriptionsService.initiate(validated.data);

 if (result.data && !result.error) {
 const [user] = await Promise.all([
 userSession(),
 setInitiateSubscriptionCookie({
 ...result.data,
 token: uuid,
 }),
 ]);

 revalidateTag(`subscription-${user?.id}`, "max");

 return {
 data: result.data,
 errors: null,
 inputs: validated.data,
 };
 }

 return {
 data: null,
 errors: getFriendlyApiErrors(result),
 inputs: validated.data,
 };
 } catch (e) {
 console.error("Error during initiateSubscriptionAction", e);
 return {
 data: null,
 errors: ["Something went wrong. Please try again later."],
 inputs: validated.data,
 };
 }
};

export const setInitiateSubscriptionCookie = async (
 data: HandleSubscriptionProcessResponse & {
 token: string;
 },
) => {
 const cookieStore = await cookies();
 cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, await encryptObj(data), {
 httpOnly: true,
 maxAge: 60 * 10, // 10 min
 });
};

export const getInitiateSubscriptionCookie = async () => {
 return await getEncryptedJsonCookie<
 HandleSubscriptionProcessResponse & {
 token: string;
 }
 >(INITIATE_SUBCRIPTION_COOKIE);
};

export const deleteInitiateSubscriptionCookie = async () => {
 const cookieStore = await cookies();
 cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, "", {
 httpOnly: true,
 maxAge: 0,
 });
};
