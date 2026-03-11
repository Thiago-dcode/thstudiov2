'use server';

import { ActionReturn } from "@repo/common-lib/types/response";
import { UserContact } from "@repo/common-lib/types/user-contact";
import { trimValues, cleanObj } from "@repo/common-lib/utils/cleanObj";
import userContactsService from "../user-contacts.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { createUserContactSchema } from "../schemas/user-contact.schema";

export const createUserContactAction = async (formData: FormData): Promise<ActionReturn<UserContact, any>> => {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    subject: formData.get('subject') as string,
    message: formData.get('message') as string,
    user_id: formData.get('user_id'),
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
