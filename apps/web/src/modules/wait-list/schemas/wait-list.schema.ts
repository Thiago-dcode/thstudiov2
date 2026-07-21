import * as z from "zod";
import { emailField, type Translator } from "@/lib/validation/zod-helpers";

export const createWaitListSchema = (t: Translator) =>
  z.object({
    email: emailField(t),
  });

export type CreateWaitListSchemaType = z.infer<
  ReturnType<typeof createWaitListSchema>
>;
