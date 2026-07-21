import * as z from "zod";
import { emailField, type Translator } from "@/lib/validation/zod-helpers";

export const createOrUpdateEmailPreferenceSchema = (t: Translator) =>
  z.object({
    email: emailField(t),
    token: z.string().min(1, t("validation.emailPreference.tokenRequired")),
    user_id: z.number().int().positive().optional(),
    marketing: z.boolean().optional(),
    notifications: z.boolean().optional(),
    waitlist_updates: z.boolean().optional(),
  });

export type CreateOrUpdateEmailPreferenceSchemaType = z.infer<
  ReturnType<typeof createOrUpdateEmailPreferenceSchema>
>;
