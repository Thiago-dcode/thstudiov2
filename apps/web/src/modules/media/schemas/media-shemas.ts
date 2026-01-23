import * as z from "zod"; 
import { ENUMS } from "@repo/common-lib/constants/enums";

export const createMediaSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  compression_level: z.enum([...ENUMS.COMPRESSION_LEVEL] as [string, ...string[]]).nullable().optional(),
  seo_alt: z.string().max(255).nullable().optional(),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(255).nullable().optional(),
  seo_filename: z.string().min(1).max(255),
  user_id: z.number().int().positive(),
});

export type CreateMediaSchemaType = z.infer<typeof createMediaSchema>;
