import * as z from "zod";

const featureItemSchema = z.object({
    title: z.string().min(1, 'Feature title is required'),
});

const termItemSchema = z.object({
    title: z.string().min(1, 'Term title is required'),
});

export const createServiceSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
    show_price: z.boolean().optional(),
    user_id: z.number(),
    portfolio_id: z.number().optional(),
    thumbnail: z.instanceof(File).optional(),
    features: z.array(featureItemSchema).optional(),
    terms: z.array(termItemSchema).optional(),
});

export type CreateServiceSchemaType = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
    portfolio_id: z.number().optional(),
    show_price: z.boolean().optional(),
    thumbnail: z.instanceof(File).optional(),
    features: z.array(featureItemSchema).optional(),
    terms: z.array(termItemSchema).optional(),
});

export type UpdateServiceSchemaType = z.infer<typeof updateServiceSchema>;
