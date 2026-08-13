import * as z from "zod";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import {
  maxLengthMessage,
  minLengthMessage,
  type Translator,
} from "@/lib/validation/zod-helpers";

export const loginRequestSchema = (t: Translator) =>
  z.object({
    email: z.email(t("validation.auth.invalidEmail")),
    password: z
      .string(t("validation.auth.invalidPassword"))
      .min(3, minLengthMessage(t, t("fields.password"), 3)),
    remember_me: z.boolean().optional(),
  });

export const registerRequestSchema = (t: Translator) =>
  z.object({
    email: z.email(t("validation.auth.invalidEmail")),
    username: z
      .string(t("validation.auth.invalidUsername"))
      .min(3, minLengthMessage(t, t("fields.username"), 3))
      .max(20, maxLengthMessage(t, t("fields.username"), 20))
      .regex(/^[a-zA-Z0-9_-]+$/, t("validation.auth.usernameAllowedChars"))
      .transform(normalizeUsername),
    password: z
      .string(t("validation.auth.invalidPassword"))
      .min(3, minLengthMessage(t, t("fields.password"), 3))
      .max(20, maxLengthMessage(t, t("fields.password"), 20)),
    invitation_code: z.string().optional(),
  });

export const verify2faRequestSchema = (t: Translator) =>
  z.object({
    email: z.email(t("validation.auth.invalidEmail")),
    twofa_code: z
      .string(t("validation.auth.invalidCode"))
      .min(6, t("validation.auth.codeLength", { length: 6 })),
  });

export const passwordRecoveryRequestSchema = (t: Translator) =>
  z.object({
    email: z.email(t("validation.auth.invalidEmail")),
  });

export type LoginRequestSchemaType = z.infer<
  ReturnType<typeof loginRequestSchema>
>;
export type RegisterRequestSchemaType = z.infer<
  ReturnType<typeof registerRequestSchema>
>;
export type Verify2faRequestSchemaType = z.infer<
  ReturnType<typeof verify2faRequestSchema>
>;
export type PasswordRecoveryRequestSchemaType = z.infer<
  ReturnType<typeof passwordRecoveryRequestSchema>
>;
