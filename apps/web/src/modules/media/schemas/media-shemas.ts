import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";

export const createMediaSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  compression_level: z
    .enum([...ENUMS.COMPRESSION_LEVEL] as [string, ...string[]])
    .nullable()
    .optional(),
  seo_alt: z.string().max(255).nullable().optional(),
  seo_title: z.string().max(255).nullable().optional(),
  seo_description: z.string().max(255).nullable().optional(),
  user_id: z.number().int().positive(),
});

export const updateMediaSchema = z
  .object({
    title: z.string().max(255).nullable().optional(),
    description: z.string().nullable().optional(),
    seo_alt: z.string().max(255).nullable().optional(),
    seo_title: z.string().max(255).nullable().optional(),
    seo_description: z.string().max(255).nullable().optional(),
  })
  .partial();

export type CreateMediaSchemaType = z.infer<typeof createMediaSchema>;
export type UpdateMediaSchemaType = z.infer<typeof updateMediaSchema>;
