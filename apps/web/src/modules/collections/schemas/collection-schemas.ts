import * as z from "zod";

export const createCollectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    user_id: z.number(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

export type CreateCollectionSchemaType = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    slug: z.string().min(3, 'Slug must be at least 3 characters long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().optional(),
    is_highlight: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

export type UpdateCollectionSchemaType = z.infer<typeof updateCollectionSchema>;
