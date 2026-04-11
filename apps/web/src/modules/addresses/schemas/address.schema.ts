import * as z from "zod";

export const createAddressSchema = z.object({
  formated_address: z.string().max(255).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  state: z.string().max(255).optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  country: z.string().max(255).optional().nullable(),
  country_code: z.string().max(5).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  user_id: z.number().int().positive().optional().nullable(),
  client_id: z.number().int().positive().optional().nullable(),
});

export type CreateAddressSchemaType = z.infer<typeof createAddressSchema>;

