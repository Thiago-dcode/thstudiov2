import * as z from "zod";

const personNameField = (maxLength: number, field: "Name" | "Surname") =>
  z
    .string()
    .min(1, `${field} is required`)
    .max(maxLength, `${field} is too long`)
    .regex(/^[^\d]*$/, `Invalid ${field}`);

export const loginRequestSchema = z.object({
  password: z.string("Invalid password").min(3, "Invalid password"),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export const createUserSchema = z.object({
  name: personNameField(80, "Name").nullable().optional(),
  surname: personNameField(100, "Surname").nullable().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric with no spaces"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long"),
  profession: z.string().max(100, "Profession is too long").optional(),
  biography: z
    .string()
    .max(1000, "Biography is too long")
    .nullable()
    .optional(),
  email: z.string().email("Invalid email address"),
  avatar: z.string().url("Invalid avatar URL").optional(),
  email_validated: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  twofa_attempts: z.number().int().min(0).optional().default(0),
  funnel_step: z.number().int().min(0).optional().default(0),
  number_email_validations_sent: z.number().int().min(0).optional().default(0),
  address_id: z.number().int().positive().nullable().optional(),
  twofa_enabled: z.boolean().optional().default(false),
  twofa_expires_at: z.date().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    name: personNameField(80, "Name").optional(),
    surname: personNameField(100, "Surname").optional(),
    profession: z.string().max(100, "Profession is too long").optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric with no spaces")
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password is too long")
      .optional(),
    short_biography: z
      .string()
      .max(120, "Short biography is too long")
      .optional(),
    biography: z.string().max(5000, "Biography is too long").optional(),
    email: z.string().email("Invalid email address").optional(),
    is_active: z.boolean().optional(),
    twofa_attempts: z.number().int().min(0).optional(),
    funnel_step: z.number().int().min(0).optional(),
    number_email_validations_sent: z.number().int().min(0).optional(),
    address_id: z.number().int().positive().optional(),
  })
  .partial();

export const updateUserPasswordSchema = z.object({
  old_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/^\S+$/, "Password cannot contain spaces"),
});

export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;
export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;
export type UpdateUserPasswordSchemaType = z.infer<
  typeof updateUserPasswordSchema
>;
