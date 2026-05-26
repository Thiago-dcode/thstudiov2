import * as z from 'zod';

const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_API_URL: z.string().min(1),
    NEXT_PUBLIC_GEOAPIFY_URL: z.string().min(1),
    NEXT_PUBLIC_GEOAPIFY_KEY: z.string().min(1),
});

const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GEOAPIFY_URL: process.env.NEXT_PUBLIC_GEOAPIFY_URL,
    NEXT_PUBLIC_GEOAPIFY_KEY: process.env.NEXT_PUBLIC_GEOAPIFY_KEY,
});

if (!parsed.success) {
    const flat = parsed.error.flatten();
    console.error('Invalid client environment variables:', {
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
    });
    throw new Error('Invalid client environment variables. Check the console for details.');
}

export const clientEnv = parsed.data;
