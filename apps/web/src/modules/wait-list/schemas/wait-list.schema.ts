import * as z from "zod";

export const createWaitListSchema = z.object({
 email: z.string().email("Invalid email address"),
});

export type CreateWaitListSchemaType = z.infer<typeof createWaitListSchema>;
