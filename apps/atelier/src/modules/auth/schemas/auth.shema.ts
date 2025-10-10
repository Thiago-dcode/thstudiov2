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
  twofa_code: z.string('Invalid twofa code').min(6, 'Invalid twofa code'),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;
export type Verify2faRequestSchemaType = z.infer<typeof verify2faRequestSchema>;