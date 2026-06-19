import * as z from "zod";

export const createUserContactSchema = z.object({
 name: z.string().min(1, "Name is required").max(255),
 email: z.string().email("Invalid email address"),
 subject: z.string().min(1, "Subject is required").max(255),
 message: z.string().min(1, "Message is required"),
 user_id: z.coerce.number().min(1, "Artist ID is required"),
});

export type CreateUserContactSchemaType = z.infer<
 typeof createUserContactSchema
>;
