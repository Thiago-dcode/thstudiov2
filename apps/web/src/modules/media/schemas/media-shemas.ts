import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";
import { formDataBoolean } from "@/lib/validation/zod-helpers";

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
  // Must be declared, not just forwarded: zod strips unknown keys, so an undeclared field is
  // silently dropped before the route ever sees it.
  generate_metadata: formDataBoolean(),
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
