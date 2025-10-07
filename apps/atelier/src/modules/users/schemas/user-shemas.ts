import * as z from "zod"; 
 
export const loginRequestSchema = z.object({ 
  password: z.string('Invalid password').min(3, 'Invalid password'),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});


export type LoginRequestSchemaType = z.infer<typeof loginRequestSchema>;