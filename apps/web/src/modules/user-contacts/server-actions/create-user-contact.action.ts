"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { UserContact } from "@repo/common-lib/types/user-contact";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import {
 getFriendlyApiErrors,
 getObjErrorFromZod,
} from "@/modules/auth/helpers";
import { createUserContactSchema } from "../schemas/user-contact.schema";
import userContactsService from "../user-contacts.service";

export const createUserContactAction = async (
 formData: FormData,
 userId?: number,
): Promise<ActionReturn<UserContact, any>> => {
 if (userId) {
 formData.set("user_id", userId.toString());
 }

 const rawData = {
 name: formData.get("name") as string,
 email: formData.get("email") as string,
 subject: formData.get("subject") as string,
 message: formData.get("message") as string,
 user_id: formData.get("user_id"),
 };

 trimValues(rawData, { deep: true });

 const validated = createUserContactSchema.safeParse(rawData);
 if (!validated.success) {
 return {
 data: null,
 errors: [],
 inputErrors: getObjErrorFromZod(validated.error),
 inputs: rawData,
 };
 }

 cleanObj(rawData);

 const result = await userContactsService.create({
 contact_name: validated.data.name,
 contact_email: validated.data.email,
 subject: validated.data.subject,
 message: validated.data.message,
 user_id: validated.data.user_id,
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
