import * as z from "zod";

export const createPortfolioSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    user_id: z.number(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    thumbnail: z.instanceof(File, { message: 'Thumbnail is required' }),
    categories: z.array(z.number()).optional(),
});

export type CreatePortfolioSchemaType = z.infer<typeof createPortfolioSchema>;

export const updatePortfolioSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().optional(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
    thumbnail: z.instanceof(File).optional(),
    categories: z.array(z.number()).optional(),
});

export type UpdatePortfolioSchemaType = z.infer<typeof updatePortfolioSchema>;

