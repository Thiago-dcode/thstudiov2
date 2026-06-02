'use server';

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { EmailPreference } from "@repo/common-lib/types/email-preferences";
import { cleanObj, trimValues } from "@repo/common-lib/utils/object";
import emailPreferencesService from "../email-preferences.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { createOrUpdateEmailPreferenceSchema } from "../schemas/email-preferences.schema";

const parseOptionalPositiveInt = (value: FormDataEntryValue | null): number | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const createOrUpdateEmailPreferenceAction = async (formData: FormData): Promise<ActionReturn<EmailPreference, any>> => {
  const rawData = {
    email: formData.get('email') as string,
    user_id: parseOptionalPositiveInt(formData.get('user_id')),
    marketing: formData.get('marketing') === 'on',
    notifications: formData.get('notifications') === 'on',
    waitlist_updates: formData.get('waitlist_updates') === 'on',
  };

  trimValues(rawData, { deep: true });

  const validated = createOrUpdateEmailPreferenceSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      data: null,
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      inputs: rawData,
    };
  }

  cleanObj(rawData);

  const result = await emailPreferencesService.createOrUpdate(validated.data);

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
