import { MAX_COLLECTION_ITEMS } from "@repo/common-lib/constants/constants";
import * as z from "zod";

const collectionMediaItemSchema = z.object({
  id: z.number(),
  position: z.number(),
});

export const createCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  user_id: z.number(),
  is_highlight: z.boolean().optional(),
  is_active: z.boolean().optional(),
  media: z
    .array(collectionMediaItemSchema)
    .min(1, "At least one media item is required")
    .max(
      MAX_COLLECTION_ITEMS,
      `Collections can have up to ${MAX_COLLECTION_ITEMS} media`,
    )
    .optional(),
});

export type CreateCollectionSchemaType = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
  description: z.string().optional(),
  is_highlight: z.boolean().optional(),
  is_active: z.boolean().optional(),
  media: z
    .array(collectionMediaItemSchema)
    .min(1, "At least one media item is required")
    .max(
      MAX_COLLECTION_ITEMS,
      `Collections can have up to ${MAX_COLLECTION_ITEMS} media`,
    )
    .optional(),
});

export type UpdateCollectionSchemaType = z.infer<typeof updateCollectionSchema>;
