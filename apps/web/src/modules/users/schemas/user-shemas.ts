import * as z from "zod";
import {
  emailField,
  maxLengthMessage,
  minLengthMessage,
  personNameField,
  requiredString,
  type Translator,
  tooLongMessage,
} from "@/lib/validation/zod-helpers";

export const loginRequestSchema = (t: Translator) =>
  z.object({
    password: z
      .string(t("validation.auth.invalidPassword"))
      .min(3, t("validation.auth.invalidPassword")),
    user_agent: z.string().optional(),
    ip_address: z.string().optional(),
  });

export const createUserSchema = (t: Translator) =>
  z.object({
    name: personNameField(t, 80, t("fields.name")).nullable().optional(),
    surname: personNameField(t, 100, t("fields.surname")).nullable().optional(),
    username: z
      .string()
      .min(3, minLengthMessage(t, t("fields.username"), 3))
      .max(50, maxLengthMessage(t, t("fields.username"), 50))
      .regex(/^[a-zA-Z0-9]+$/, t("validation.user.usernameAlphanumeric")),
    password: z
      .string()
      .min(8, minLengthMessage(t, t("fields.password"), 8))
      .max(50, tooLongMessage(t, t("fields.password"))),
    profession: z
      .string()
      .max(100, tooLongMessage(t, t("fields.profession")))
      .optional(),
    biography: z
      .string()
      .max(1000, tooLongMessage(t, t("fields.biography")))
      .nullable()
      .optional(),
    email: emailField(t),
    avatar: z.string().url(t("validation.avatarUrlInvalid")).optional(),
    email_validated: z.boolean().optional().default(false),
    is_active: z.boolean().optional().default(true),
    twofa_attempts: z.number().int().min(0).optional().default(0),
    funnel_step: z.number().int().min(0).optional().default(0),
    number_email_validations_sent: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0),
    address_id: z.number().int().positive().nullable().optional(),
    twofa_enabled: z.boolean().optional().default(false),
    twofa_expires_at: z.date().nullable().optional(),
  });

export const updateUserSchema = (t: Translator) =>
  z
    .object({
      name: personNameField(t, 80, t("fields.name")).optional(),
      surname: personNameField(t, 100, t("fields.surname")).optional(),
      profession: z
        .string()
        .max(100, tooLongMessage(t, t("fields.profession")))
        .optional(),
      username: z
        .string()
        .min(3, minLengthMessage(t, t("fields.username"), 3))
        .max(20, maxLengthMessage(t, t("fields.username"), 20))
        .regex(/^[a-zA-Z0-9]+$/, t("validation.user.usernameAlphanumeric"))
        .optional(),
      password: z
        .string()
        .min(8, minLengthMessage(t, t("fields.password"), 8))
        .max(20, tooLongMessage(t, t("fields.password")))
        .optional(),
      short_biography: z
        .string()
        .max(120, tooLongMessage(t, t("fields.shortBiography")))
        .optional(),
      biography: z
        .string()
        .max(5000, tooLongMessage(t, t("fields.biography")))
        .optional(),
      email: emailField(t).optional(),
      is_active: z.boolean().optional(),
      twofa_attempts: z.number().int().min(0).optional(),
      funnel_step: z.number().int().min(0).optional(),
      number_email_validations_sent: z.number().int().min(0).optional(),
      address_id: z.number().int().positive().optional(),
    })
    .partial();

export const updateUserPasswordSchema = (t: Translator) =>
  z.object({
    old_password: requiredString(t, t("fields.currentPassword")),
    new_password: z
      .string()
      .min(8, minLengthMessage(t, t("fields.newPassword"), 8))
      .max(20, maxLengthMessage(t, t("fields.newPassword"), 20))
      .regex(/\d/, t("validation.user.passwordMustContainNumber"))
      .regex(/^\S+$/, t("validation.user.passwordNoSpaces")),
  });

export type LoginRequestSchemaType = z.infer<
  ReturnType<typeof loginRequestSchema>
>;
export type CreateUserSchemaType = z.infer<ReturnType<typeof createUserSchema>>;
export type UpdateUserSchemaType = z.infer<ReturnType<typeof updateUserSchema>>;
export type UpdateUserPasswordSchemaType = z.infer<
  ReturnType<typeof updateUserPasswordSchema>
>;
