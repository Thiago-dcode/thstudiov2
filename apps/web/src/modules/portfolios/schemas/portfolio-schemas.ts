import * as z from "zod";

export const createPortfolioSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    user_id: z.number(),
    thumbnail: z.instanceof(File, { message: 'Thumbnail is required' }),
});

export type CreatePortfolioSchemaType = z.infer<typeof createPortfolioSchema>;

