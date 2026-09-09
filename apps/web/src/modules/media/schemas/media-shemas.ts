import { ENUMS } from "@repo/common-lib/constants/enums";
import * as z from "zod";
import {
  formDataBoolean,
  type Translator,
  tooLongMessage,
} from "@/lib/validation/zod-helpers";

const TITLE_MAX = 255;
const SEO_MAX = 255;

export const createMediaSchema = (t: Translator) =>
  z.object({
    title: z
      .string()
      .max(TITLE_MAX, tooLongMessage(t, t("fields.title")))
      .nullable()
      .optional(),
    description: z.string().nullable().optional(),
    compression_level: z
      .enum([...ENUMS.COMPRESSION_LEVEL] as [string, ...string[]], {
        message: t("validation.invalid", { field: t("fields.file") }),
      })
      .nullable()
      .optional(),
    seo_alt: z
      .string()
      .max(SEO_MAX, tooLongMessage(t, t("fields.seoAlt")))
      .nullable()
      .optional(),
    seo_title: z
      .string()
      .max(SEO_MAX, tooLongMessage(t, t("fields.seoTitle")))
      .nullable()
      .optional(),
    seo_description: z
      .string()
      .max(SEO_MAX, tooLongMessage(t, t("fields.seoDescription")))
      .nullable()
      .optional(),
    // Must be declared, not just forwarded: zod strips unknown keys, so an undeclared field is
    // silently dropped before the request is ever built.
    generate_metadata: formDataBoolean(),
    user_id: z.number().int().positive(),
  });

export const updateMediaSchema = (t: Translator) =>
  z
    .object({
      title: z
        .string()
        .max(TITLE_MAX, tooLongMessage(t, t("fields.title")))
        .nullable()
        .optional(),
      description: z.string().nullable().optional(),
      seo_alt: z
        .string()
        .max(SEO_MAX, tooLongMessage(t, t("fields.seoAlt")))
        .nullable()
        .optional(),
      seo_title: z
        .string()
        .max(SEO_MAX, tooLongMessage(t, t("fields.seoTitle")))
        .nullable()
        .optional(),
      seo_description: z
        .string()
        .max(SEO_MAX, tooLongMessage(t, t("fields.seoDescription")))
        .nullable()
        .optional(),
    })
    .partial();

export type CreateMediaSchemaType = z.infer<
  ReturnType<typeof createMediaSchema>
>;
export type UpdateMediaSchemaType = z.infer<
  ReturnType<typeof updateMediaSchema>
>;
