import { ENUMS } from "@repo/common-lib/constants/enums";
import {
  MAX_CATEGORIES_MEDIA,
  MAX_MEDIA_DELETE_BATCH,
  MAX_MEDIA_LOCATION_BATCH,
} from "@repo/common-lib/constants/limits";
import * as z from "zod";
import {
  formDataBoolean,
  type Translator,
  tooLongMessage,
} from "@/lib/validation/zod-helpers";
import { locationInputSchema } from "@/modules/locations/schemas/location-input.schema";

/** Mirrors the `media.title` VARCHAR(255) column; inputs use it as `maxLength` too. */
export const MEDIA_TITLE_MAX = 255;
const SEO_MAX = 255;

/** Ids of the disciplines / art styles the artist picked. Empty on an update clears them. */
const categoryIdsSchema = z
  .array(z.number().int().positive())
  .max(MAX_CATEGORIES_MEDIA)
  .optional();

export const createMediaSchema = (t: Translator) =>
  z.object({
    title: z
      .string()
      .max(MEDIA_TITLE_MAX, tooLongMessage(t, t("fields.title")))
      .nullable()
      .optional(),
    description: z.string().nullable().optional(),
    location: locationInputSchema.nullable().optional(),
    category_ids: categoryIdsSchema,
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
        .max(MEDIA_TITLE_MAX, tooLongMessage(t, t("fields.title")))
        .nullable()
        .optional(),
      description: z.string().nullable().optional(),
      // `null` clears the place; absent leaves it as it is.
      location: locationInputSchema.nullable().optional(),
      // `[]` clears the categories; absent leaves them as they are.
      category_ids: categoryIdsSchema,
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
      // Declared so zod keeps it; `false` is the value that matters here (hide everywhere).
      is_active: z.boolean().optional(),
    })
    .partial();

/** Body of `PATCH /media/locations`. The place comes from the geocoder, so it reuses that schema. */
export const updateMediaLocationsSchema = z.object({
  location: locationInputSchema,
  media: z
    .array(z.number().int().positive())
    .min(1)
    .max(MAX_MEDIA_LOCATION_BATCH),
});

/** Body of `POST /media/delete-many`. */
export const deleteManyMediaSchema = z.object({
  media: z
    .array(z.number().int().positive())
    .min(1)
    .max(MAX_MEDIA_DELETE_BATCH),
});

export type CreateMediaSchemaType = z.infer<
  ReturnType<typeof createMediaSchema>
>;
export type UpdateMediaSchemaType = z.infer<
  ReturnType<typeof updateMediaSchema>
>;
