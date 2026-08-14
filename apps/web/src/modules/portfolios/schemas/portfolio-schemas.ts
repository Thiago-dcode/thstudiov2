import { MAX_CATEGORIES_PORTFOLIO } from "@repo/common-lib/constants/constants";
import * as z from "zod";
import { requiredString, type Translator } from "@/lib/validation/zod-helpers";

export const createPortfolioSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")),
    description: z.string().optional(),
    user_id: z.number(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    thumbnail: z.instanceof(File, {
      message: t("validation.thumbnailRequired"),
    }),
    categories: z
      .array(z.number())
      .max(
        MAX_CATEGORIES_PORTFOLIO,
        t("validation.maxCategories", { max: MAX_CATEGORIES_PORTFOLIO }),
      )
      .optional(),
  });

export type CreatePortfolioSchemaType = z.infer<
  ReturnType<typeof createPortfolioSchema>
>;

export const updatePortfolioSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")).optional(),
    description: z.string().optional(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    thumbnail: z.instanceof(File).optional(),
    categories: z
      .array(z.number())
      .max(
        MAX_CATEGORIES_PORTFOLIO,
        t("validation.maxCategories", { max: MAX_CATEGORIES_PORTFOLIO }),
      )
      .optional(),
  });

export type UpdatePortfolioSchemaType = z.infer<
  ReturnType<typeof updatePortfolioSchema>
>;
