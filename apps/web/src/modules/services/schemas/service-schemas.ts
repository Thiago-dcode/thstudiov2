import * as z from "zod";
import { requiredString, type Translator } from "@/lib/validation/zod-helpers";

const featureItemSchema = (t: Translator) =>
  z.object({
    title: z.string().min(1, t("validation.service.featureTitleRequired")),
  });

const termItemSchema = (t: Translator) =>
  z.object({
    title: z.string().min(1, t("validation.service.termTitleRequired")),
  });

export const createServiceSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")),
    description: z.string().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
    show_price: z.boolean().optional(),
    is_highlight: z.boolean().optional(),
    user_id: z.number(),
    portfolio_id: z.number().optional(),
    thumbnail: z.instanceof(File).optional(),
    features: z.array(featureItemSchema(t)).optional(),
    terms: z.array(termItemSchema(t)).optional(),
  });

export type CreateServiceSchemaType = z.infer<
  ReturnType<typeof createServiceSchema>
>;

export const updateServiceSchema = (t: Translator) =>
  z.object({
    title: requiredString(t, t("fields.title")).optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
    portfolio_id: z.number().optional(),
    show_price: z.boolean().optional(),
    is_highlight: z.boolean().optional(),
    thumbnail: z.instanceof(File).optional(),
    features: z.array(featureItemSchema(t)).optional(),
    terms: z.array(termItemSchema(t)).optional(),
  });

export type UpdateServiceSchemaType = z.infer<
  ReturnType<typeof updateServiceSchema>
>;
