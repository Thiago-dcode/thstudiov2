import * as z from "zod"; 

export const loginRequestSchema = z.object({ 
  password: z.string('Invalid password').min(3, 'Invalid password'),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(255).nullable().optional(),
  surname: z.string().min(1).max(255).nullable().optional(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(255),
  profession: z.string().max(100).optional(),
  biography: z.string().max(1000).nullable().optional(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  email_validated: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  twofa_attempts: z.number().int().min(0).optional().default(0),
  funnel_step: z.number().int().min(0).optional().default(0),
  number_email_validations_sent: z.number().int().min(0).optional().default(0),
  address_id: z.number().int().positive().nullable().optional(),
  twofa_enabled: z.boolean().optional().default(false),
  twofa_expires_at: z.date().nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  surname: z.string().min(1).max(255).optional(),
  profession: z.string().max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(8).max(255).optional(),
  short_biography: z.string().max(120).optional(),
  biography: z.string().max(5000).optional(),
  email: z.string().email().optional(),
  is_active: z.boolean().optional(),
  twofa_attempts: z.number().int().min(0).optional(),
  funnel_step: z.number().int().min(0).optional(),
  number_email_validations_sent: z.number().int().min(0).optional(),
  address_id: z.number().int().positive().optional(),
}).partial();


export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;
export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;
