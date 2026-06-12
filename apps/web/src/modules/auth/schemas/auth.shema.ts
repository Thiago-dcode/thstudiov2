import * as z from "zod";

export const loginRequestSchema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Invalid password")
    .min(3, "Password must be at least 3 characters"),
  remember_me: z.boolean().optional(),
});
export const registerRequestSchema = z.object({
  email: z.email("Invalid email"),
  username: z
    .string("Invalid username")
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  password: z
    .string("Invalid password")
    .min(3, "Password must be at least 3 characters")
    .max(20, "Password must be at most 20 characters"),
  invitation_code: z.string().optional(),
});
export const verify2faRequestSchema = z.object({
  email: z.email("Invalid email"),
  twofa_code: z.string("Invalid code").min(6, "Code must be 6 digits"),
});
export const passwordRecoveryRequestSchema = z.object({
  email: z.email("Invalid email"),
  fallback_url: z.string("Invalid fallback url"),
});

export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;
export type RegisterRequestSchemaType = z.infer<typeof registerRequestSchema>;
export type Verify2faRequestSchemaType = z.infer<typeof verify2faRequestSchema>;
export type PasswordRecoveryRequestSchemaType = z.infer<
  typeof passwordRecoveryRequestSchema
>;
