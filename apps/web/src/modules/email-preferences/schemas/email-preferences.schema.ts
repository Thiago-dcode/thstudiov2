import * as z from "zod";

export const createOrUpdateEmailPreferenceSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(1, "Missing token"),
  user_id: z.number().int().positive().optional(),
  marketing: z.boolean().optional(),
  notifications: z.boolean().optional(),
  waitlist_updates: z.boolean().optional(),
});

export type CreateOrUpdateEmailPreferenceSchemaType = z.infer<
  typeof createOrUpdateEmailPreferenceSchema
>;
