import * as z from "zod"; 
 
export const loginRequestSchema = z.object({ 
  email: z.email('Invalid email'),
  password: z.string('Invalid password').min(3, 'Invalid password'),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
  remember_me: z.boolean().optional(),
});
export const verify2faRequestSchema = z.object({ 
  email: z.email('Invalid email'),
  twofa_code: z.string('Invalid code').min(6, 'Code must be 6 digits'),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});
export const passwordRecoveryRequestSchema = z.object({ 
  email: z.email('Invalid email'),
  fallback_url: z.string('Invalid fallback url'),
});

export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;
export type Verify2faRequestSchemaType = z.infer<typeof verify2faRequestSchema>;
export type PasswordRecoveryRequestSchemaType = z.infer<typeof passwordRecoveryRequestSchema>;