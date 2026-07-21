import * as z from "zod";
import {
  emailField,
  requiredString,
  type Translator,
} from "@/lib/validation/zod-helpers";

export const createUserContactSchema = (t: Translator) =>
  z.object({
    name: requiredString(t, t("fields.name")).max(255),
    email: emailField(t),
    subject: requiredString(t, t("fields.subject")).max(255),
    message: requiredString(t, t("fields.message")),
    user_id: z.coerce
      .number()
      .min(1, t("validation.required", { field: t("fields.artistId") })),
  });

export type CreateUserContactSchemaType = z.infer<
  ReturnType<typeof createUserContactSchema>
>;
