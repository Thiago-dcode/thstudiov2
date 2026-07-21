import { MAX_COLLECTION_ITEMS } from "@repo/common-lib/constants/constants";
import * as z from "zod";
import {
  requiredString,
  slugField,
  type Translator,
} from "@/lib/validation/zod-helpers";

const collectionMediaItemSchema = z.object({
  id: z.number(),
  position: z.number(),
});

export const createCollectionSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")),
    slug: slugField(t),
    description: z.string().optional(),
    user_id: z.number(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    media: z
      .array(collectionMediaItemSchema)
      .min(1, t("validation.minCollectionMedia"))
      .max(
        MAX_COLLECTION_ITEMS,
        t("validation.maxCollectionMedia", { max: MAX_COLLECTION_ITEMS }),
      )
      .optional(),
  });

export type CreateCollectionSchemaType = z.infer<
  ReturnType<typeof createCollectionSchema>
>;

export const updateCollectionSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")).optional(),
    slug: slugField(t).optional(),
    description: z.string().optional(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    media: z
      .array(collectionMediaItemSchema)
      .min(1, t("validation.minCollectionMedia"))
      .max(
        MAX_COLLECTION_ITEMS,
        t("validation.maxCollectionMedia", { max: MAX_COLLECTION_ITEMS }),
      )
      .optional(),
  });

export type UpdateCollectionSchemaType = z.infer<
  ReturnType<typeof updateCollectionSchema>
>;
